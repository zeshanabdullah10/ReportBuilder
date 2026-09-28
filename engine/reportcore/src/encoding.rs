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

#[cfg(test)]
mod tests {
    use super::decode_text;

    #[test]
    fn utf8_bom_and_cp1252() {
        assert_eq!(decode_text("µΩ".as_bytes()), "µΩ");
        assert_eq!(decode_text(b"\xef\xbb\xbf{}"), "{}");
        assert_eq!(decode_text(&[0x35, 0x20, 0xb5, 0x41, 0x20, 0x80]), "5 µA €");
    }
}
