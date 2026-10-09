//! Text decoding for input produced by LabVIEW and other Windows tools.

const CP1252_HIGH: [char; 32] = [
    '€', '\u{81}', '‚', 'ƒ', '„', '…', '†', '‡', 'ˆ', '‰', 'Š', '‹', 'Œ', '\u{8d}', 'Ž', '\u{8f}', '\u{90}', '‘', '’',
    '“', '”', '•', '–', '—', '˜', '™', 'š', '›', 'œ', '\u{9d}', 'ž', 'Ÿ',
];

/// Decode UTF-8, falling back to Windows-1252 (LabVIEW's default on Windows).
/// A leading UTF-8 byte-order mark is removed.
pub fn decode_text(bytes: &[u8]) -> String {
    let s = match std::str::from_utf8(bytes) {
        Ok(s) => s.to_string(),
        Err(_) => bytes
            .iter()
            .map(|&b| match b {
                0x80..=0x9f => CP1252_HIGH[(b - 0x80) as usize],
                _ => b as char,
            })
            .collect(),
    };
    match s.strip_prefix('\u{feff}') {
        Some(rest) => rest.to_string(),
        None => s,
    }
}

/// Parse JSON data text, tolerating the bare `NaN`, `Infinity` and
/// `-Infinity` tokens that LabVIEW (and Python's `json`) can emit.
///
/// Strict JSON is tried first. Only if that fails are bare non-finite tokens
/// outside string literals rewritten to the strings `"NaN"`, `"Infinity"` and
/// `"-Infinity"` (which the expression engine treats as numbers) and the text
/// parsed again. If it still fails, the original error is returned so its
/// line/column refer to the caller's text.
pub fn parse_json_lenient(text: &str) -> Result<serde_json::Value, serde_json::Error> {
    let text = text.strip_prefix('\u{feff}').unwrap_or(text);
    match serde_json::from_str(text) {
        Ok(v) => Ok(v),
        Err(e) => match rewrite_non_finite(text) {
            Some(fixed) => serde_json::from_str(&fixed).map_err(|_| e),
            None => Err(e),
        },
    }
}

/// Canonical spelling of a bare non-finite token (case-insensitive), if it is one.
fn non_finite_word(word: &str) -> Option<&'static str> {
    match word.to_ascii_lowercase().as_str() {
        "nan" => Some("NaN"),
        "infinity" | "inf" => Some("Infinity"),
        _ => None,
    }
}

/// Rewrite bare `NaN` / `Infinity` / `-Infinity` tokens (also `inf`,
/// `+Infinity`, `-NaN`, in any case) that appear outside string literals into
/// JSON strings. Returns `None` when there was nothing to rewrite.
pub fn rewrite_non_finite(text: &str) -> Option<String> {
    let bytes = text.as_bytes();
    let mut out = String::with_capacity(text.len() + 16);
    let mut changed = false;
    let mut copied = 0; // bytes of `text` already copied into `out`
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'"' => {
                // Skip the string literal, honouring backslash escapes.
                i += 1;
                while i < bytes.len() {
                    match bytes[i] {
                        b'\\' => i += 2,
                        b'"' => {
                            i += 1;
                            break;
                        }
                        _ => i += 1,
                    }
                }
            }
            b'-' | b'+' | b'A'..=b'Z' | b'a'..=b'z' => {
                let start = i;
                let sign = matches!(bytes[i], b'-' | b'+').then_some(bytes[i]);
                let word_start = if sign.is_some() { i + 1 } else { i };
                let mut j = word_start;
                while j < bytes.len() && (bytes[j].is_ascii_alphanumeric() || bytes[j] == b'_') {
                    j += 1;
                }
                // Only a whole word starting with a letter counts: `-1e5`, `NaNa`, `true` are left alone.
                let canon = if j > word_start && bytes[word_start].is_ascii_alphabetic() {
                    non_finite_word(&text[word_start..j])
                } else {
                    None
                };
                match canon {
                    Some(word) => {
                        out.push_str(&text[copied..start]);
                        out.push('"');
                        if sign == Some(b'-') && word == "Infinity" {
                            out.push('-');
                        }
                        out.push_str(word);
                        out.push('"');
                        copied = j;
                        changed = true;
                        i = j;
                    }
                    None => i = j.max(start + 1),
                }
            }
            _ => i += 1,
        }
    }
    if !changed {
        return None;
    }
    out.push_str(&text[copied..]);
    Some(out)
}

#[cfg(test)]
mod tests {
    use super::{decode_text, parse_json_lenient, rewrite_non_finite};
    use serde_json::json;

    #[test]
    fn utf8_bom_and_cp1252() {
        assert_eq!(decode_text("µΩ".as_bytes()), "µΩ");
        assert_eq!(decode_text(b"\xef\xbb\xbf{}"), "{}");
        assert_eq!(decode_text(&[0x35, 0x20, 0xb5, 0x41, 0x20, 0x80]), "5 µA €");
    }

    #[test]
    fn non_finite_tokens_become_strings() {
        assert_eq!(
            parse_json_lenient(r#"{"a": NaN, "b": [Infinity, -Infinity, 1.5e-3], "c": -1}"#).unwrap(),
            json!({"a": "NaN", "b": ["Infinity", "-Infinity", 0.0015], "c": -1})
        );
        assert_eq!(
            parse_json_lenient("[nan, inf, -inf, +Infinity, -NaN,NaN]").unwrap(),
            json!(["NaN", "Infinity", "-Infinity", "Infinity", "NaN", "NaN"])
        );
        // Strict JSON is untouched; tokens inside strings are never rewritten.
        assert_eq!(parse_json_lenient(r#"{"NaN": "Infinity"}"#).unwrap(), json!({"NaN": "Infinity"}));
        assert_eq!(
            parse_json_lenient(r#"{"s": "say \"NaN\" -Infinity \\", "v": NaN}"#).unwrap(),
            json!({"s": "say \"NaN\" -Infinity \\", "v": "NaN"})
        );
        assert_eq!(rewrite_non_finite(r#"{"a":"NaN"}"#), None);
        assert_eq!(rewrite_non_finite("[NaNa, Infinite, -1e5]"), None);
        // BOM and multi-byte text around tokens.
        assert_eq!(parse_json_lenient("\u{feff}{\"µΩ\": NaN}").unwrap(), json!({"µΩ": "NaN"}));
    }

    #[test]
    fn real_errors_keep_their_position() {
        let e = parse_json_lenient("{\"a\": NaN,\n \"b\": oops}").unwrap_err();
        assert_eq!(e.line(), 1, "original error is reported: {e}");
        assert!(parse_json_lenient("{oops").is_err());
        assert!(parse_json_lenient("").is_err());
    }
}
