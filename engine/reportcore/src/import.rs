//! Data import: CSV → report data, and the shared "load data text" entry
//! point used by the CLI, the C ABI and the local server.
//!
//! The CSV reader is a small RFC 4180 parser (quoted fields, doubled quotes,
//! embedded delimiters and line breaks, CRLF, UTF-8 BOM) with delimiter
//! sniffing among `,`, `;` and tab. See [`csv_to_data`] for the data shape.

use anyhow::{bail, Context, Result};
use serde_json::{Map, Number, Value};

/// True when `name` (a file name or path) has a `.csv` or `.tsv` extension.
pub fn is_csv_name(name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    lower.ends_with(".csv") || lower.ends_with(".tsv")
}

/// Parse data text: CSV when `name_hint` ends in `.csv`/`.tsv`, otherwise JSON
/// (tolerating bare `NaN`/`Infinity`, see [`crate::encoding::parse_json_lenient`]).
pub fn parse_data_text(text: &str, name_hint: &str) -> Result<Value> {
    if is_csv_name(name_hint) {
        csv_to_data(text, name_hint)
    } else {
        crate::encoding::parse_json_lenient(text).map_err(|e| {
            if name_hint.is_empty() {
                anyhow::anyhow!("data is not valid JSON: {e}")
            } else {
                anyhow::anyhow!("{name_hint} is not valid JSON: {e}")
            }
        })
    }
}

/// Like [`parse_data_text`] for raw bytes (UTF-8 with or without BOM, or Windows-1252).
pub fn parse_data_bytes(bytes: &[u8], name_hint: &str) -> Result<Value> {
    parse_data_text(&crate::encoding::decode_text(bytes), name_hint)
}

const DELIMITERS: [char; 3] = [',', ';', '\t'];

/// Convert CSV text into report data.
///
/// * The delimiter is sniffed among `,` `;` and tab (a `.tsv` `name_hint` prefers tab).
/// * Optional preamble: leading rows with exactly two non-empty cells, such as
///   `Serial,SN123`, become top-level fields with camelCase keys
///   (`{"serial": "SN123"}`), as long as a wider header row follows them.
/// * The header row names the columns (camelCase keys). Every following row
///   becomes an object. Values are coerced: numbers (a decimal comma is accepted
///   when the delimiter is `;`), `true`/`false`, empty → `null`; anything else,
///   including numbers with leading zeros such as serials `007`, stays a string.
/// * The rows go under `measurements` when the columns look like measurements
///   (a value column plus a low/high limit column, matched case-insensitively
///   against common aliases such as `Measured`, `Min`, `Max`, `LSL`, `USL`,
///   `Low Limit`). Those columns are then renamed to the canonical
///   `name`/`value`/`low`/`high`/`nominal`/`unit`/`status`. Otherwise the rows
///   go under `rows` with their header names.
pub fn csv_to_data(text: &str, name_hint: &str) -> Result<Value> {
    let label = if name_hint.is_empty() { "CSV data".to_string() } else { name_hint.to_string() };
    let text = text.strip_prefix('\u{feff}').unwrap_or(text);
    let prefer_tab = name_hint.to_ascii_lowercase().ends_with(".tsv");
    let delim = sniff_delimiter(text, prefer_tab);
    let records: Vec<Vec<String>> = parse_records(text, delim, usize::MAX)
        .with_context(|| format!("{label} is not valid CSV"))?
        .into_iter()
        .filter(|r| r.iter().any(|c| !c.trim().is_empty()))
        .collect();
    if records.is_empty() {
        bail!("{label} is empty");
    }
    let decimal_comma = delim == ';';
    let non_empty = |r: &Vec<String>| r.iter().filter(|c| !c.trim().is_empty()).count();

    // Preamble: a leading run of key/value rows, only when a wider header follows.
    let run = records.iter().take_while(|r| non_empty(r) == 2 && !r[0].trim().is_empty()).count();
    let preamble_len = match records.get(run) {
        Some(header) if run > 0 && non_empty(header) >= 3 => run,
        _ => 0,
    };

    let header = &records[preamble_len];
    let width = records[preamble_len..].iter().map(Vec::len).max().unwrap_or(0);
    let mut used = std::collections::HashSet::new();
    let mut keys: Vec<String> = (0..width)
        .map(|i| {
            let raw = header.get(i).map(|s| s.trim()).unwrap_or("");
            let base = if raw.is_empty() { format!("column{}", i + 1) } else { camel_case(raw) };
            unique(base, &mut used)
        })
        .collect();

    let measurement_slots = measurement_columns(header);
    let list_key = if let Some(slots) = &measurement_slots {
        for (slot, idx) in slots {
            // Rename to the canonical slot unless another column already has that key.
            if keys.iter().enumerate().all(|(j, k)| j == *idx || k != slot) {
                keys[*idx] = slot.to_string();
            }
        }
        "measurements"
    } else {
        "rows"
    };

    let mut out = Map::new();
    let mut top_used = std::collections::HashSet::from([list_key.to_string()]);
    for r in &records[..preamble_len] {
        let mut cells = r.iter().map(|c| c.trim()).filter(|c| !c.is_empty());
        let (k, v) = (cells.next().unwrap_or_default(), cells.next().unwrap_or_default());
        let key = unique(camel_case(k.trim_end_matches(':')), &mut top_used);
        out.insert(key, coerce(v, decimal_comma));
    }
    let rows: Vec<Value> = records[preamble_len + 1..]
        .iter()
        .map(|r| {
            let mut obj = Map::new();
            for (i, key) in keys.iter().enumerate() {
                obj.insert(key.clone(), r.get(i).map(|c| coerce(c, decimal_comma)).unwrap_or(Value::Null));
            }
            Value::Object(obj)
        })
        .collect();
    out.insert(list_key.to_string(), Value::Array(rows));
    Ok(Value::Object(out))
}

fn unique(base: String, used: &mut std::collections::HashSet<String>) -> String {
    let mut key = base.clone();
    let mut n = 2;
    while !used.insert(key.clone()) {
        key = format!("{base}{n}");
        n += 1;
    }
    key
}

/// Parse CSV into records (at most `limit`). Quotes open only at the start of a
/// field (leading blanks allowed); a stray quote inside an unquoted field is kept.
fn parse_records(text: &str, delim: char, limit: usize) -> Result<Vec<Vec<String>>> {
    let mut records = Vec::new();
    let mut record: Vec<String> = Vec::new();
    let mut field = String::new();
    let mut in_quotes = false;
    let mut quoted = false;
    let mut chars = text.chars().peekable();
    let mut line = 1usize;
    let mut quote_line = 0usize;
    while let Some(c) = chars.next() {
        if in_quotes {
            match c {
                '"' if chars.peek() == Some(&'"') => {
                    chars.next();
                    field.push('"');
                }
                '"' => in_quotes = false,
                _ => {
                    if c == '\n' {
                        line += 1;
                    }
                    field.push(c);
                }
            }
            continue;
        }
        match c {
            '"' if !quoted && field.trim().is_empty() => {
                field.clear();
                in_quotes = true;
                quoted = true;
                quote_line = line;
            }
            c if c == delim => {
                record.push(finish_field(&mut field, quoted));
                quoted = false;
            }
            '\r' | '\n' => {
                if c == '\r' && chars.peek() == Some(&'\n') {
                    chars.next();
                }
                line += 1;
                record.push(finish_field(&mut field, quoted));
                quoted = false;
                records.push(std::mem::take(&mut record));
                if records.len() >= limit {
                    return Ok(records);
                }
            }
            _ => field.push(c),
        }
    }
    if in_quotes {
        bail!("unterminated quoted field starting on line {quote_line}");
    }
    if !field.is_empty() || !record.is_empty() || quoted {
        record.push(finish_field(&mut field, quoted));
        records.push(record);
    }
    Ok(records)
}

fn finish_field(field: &mut String, quoted: bool) -> String {
    let f = std::mem::take(field);
    // Text after a closing quote (`"a" `) is kept; surrounding blanks of unquoted fields are trimmed later.
    if quoted {
        f.trim_end_matches([' ', '\t']).to_string()
    } else {
        f
    }
}

/// Pick the delimiter that splits the most sample rows into the same number (≥ 2) of fields.
fn sniff_delimiter(text: &str, prefer_tab: bool) -> char {
    let mut best = (',', 0usize, 0usize);
    let order: Vec<char> = if prefer_tab { vec!['\t', ',', ';'] } else { DELIMITERS.to_vec() };
    for d in order {
        let Ok(records) = parse_records(text, d, 50) else { continue };
        let mut counts: std::collections::BTreeMap<usize, usize> = Default::default();
        for r in records.iter().filter(|r| r.iter().any(|c| !c.trim().is_empty())) {
            if r.len() >= 2 {
                *counts.entry(r.len()).or_default() += 1;
            }
        }
        // Most frequent width wins; ties go to the wider table.
        if let Some((&width, &freq)) = counts.iter().max_by_key(|(w, f)| (**f, **w)) {
            if (freq, width) > (best.1, best.2) {
                best = (d, freq, width);
            }
        }
    }
    best.0
}

/// camelCase identifier for a header or preamble label: `Serial Number` → `serialNumber`,
/// `DUT S/N` → `dutSN`, `low_limit` → `lowLimit`, `2nd pass` → `_2ndPass`.
pub fn camel_case(label: &str) -> String {
    let mut out = String::new();
    for word in label.split(|c: char| !c.is_alphanumeric()).filter(|w| !w.is_empty()) {
        let all_caps = word.chars().all(|c| !c.is_lowercase());
        let mut chars = word.chars();
        let first = chars.next().unwrap();
        if out.is_empty() {
            if all_caps {
                out.push_str(&word.to_lowercase());
            } else {
                out.extend(first.to_lowercase());
                out.push_str(chars.as_str());
            }
        } else {
            out.extend(first.to_uppercase());
            out.push_str(chars.as_str());
        }
    }
    if out.is_empty() {
        return "field".into();
    }
    if out.starts_with(|c: char| c.is_ascii_digit()) {
        out.insert(0, '_');
    }
    out
}

fn norm_key(s: &str) -> String {
    s.chars().filter(|c| c.is_ascii_alphanumeric()).collect::<String>().to_ascii_lowercase()
}

/// Column aliases, mirroring `LIMIT_ALIASES` in desktop/src/lib/drop.ts plus common limit spellings.
const SLOTS: [(&str, &[&str]); 7] = [
    ("value", &["value", "measured", "measurement", "reading", "actual", "result", "measuredvalue", "meas"]),
    (
        "low",
        &[
            "low",
            "lowlimit",
            "min",
            "lower",
            "lsl",
            "lo",
            "minimum",
            "lowerlimit",
            "limitlow",
            "lolimit",
            "minlimit",
            "llimit",
            "ll",
        ],
    ),
    (
        "high",
        &[
            "high",
            "highlimit",
            "max",
            "upper",
            "usl",
            "hi",
            "maximum",
            "upperlimit",
            "limithigh",
            "hilimit",
            "maxlimit",
            "hlimit",
            "ul",
        ],
    ),
    ("nominal", &["nominal", "target", "expected", "typ", "typical"]),
    ("unit", &["unit", "units", "uom"]),
    ("status", &["status", "verdict", "passfail", "outcome", "pass", "passed"]),
    ("name", &["name", "parameter", "param", "test", "testname", "label", "title", "description", "step", "stepname"]),
];

/// When the header looks like a measurement table, map canonical slots to column indexes.
fn measurement_columns(header: &[String]) -> Option<Vec<(&'static str, usize)>> {
    let norms: Vec<String> = header.iter().map(|h| norm_key(h)).collect();
    let mut taken = vec![false; norms.len()];
    let mut out = Vec::new();
    for (slot, aliases) in SLOTS {
        let exact = norms.iter().enumerate().find(|(i, n)| !taken[*i] && n.as_str() == slot);
        let alias = || norms.iter().enumerate().find(|(i, n)| !taken[*i] && aliases.contains(&n.as_str()));
        // Any other "...limit..." column with a direction word also counts as a limit.
        let fuzzy = || {
            let words: &[&str] = match slot {
                "low" => &["low", "min", "lower"],
                "high" => &["high", "max", "upper"],
                _ => return None,
            };
            norms
                .iter()
                .enumerate()
                .find(|(i, n)| !taken[*i] && n.contains("lim") && words.iter().any(|w| n.contains(w)))
        };
        if let Some((i, _)) = exact.or_else(alias).or_else(fuzzy) {
            taken[i] = true;
            out.push((slot, i));
        }
    }
    let has = |s: &str| out.iter().any(|(slot, _)| *slot == s);
    (has("value") && (has("low") || has("high"))).then_some(out)
}

/// Coerce a CSV cell: empty → null, true/false, numbers; everything else stays text.
fn coerce(cell: &str, decimal_comma: bool) -> Value {
    let t = cell.trim();
    if t.is_empty() {
        return Value::Null;
    }
    if t.eq_ignore_ascii_case("true") {
        return Value::Bool(true);
    }
    if t.eq_ignore_ascii_case("false") {
        return Value::Bool(false);
    }
    let normalized;
    let num = if decimal_comma && t.matches(',').count() == 1 && !t.contains('.') {
        normalized = t.replace(',', ".");
        normalized.as_str()
    } else {
        t
    };
    parse_number(num).unwrap_or_else(|| Value::String(t.to_string()))
}

fn parse_number(s: &str) -> Option<Value> {
    let body = s.strip_prefix(['-', '+']).unwrap_or(s);
    let (mantissa, exponent) = match body.find(['e', 'E']) {
        Some(i) => (&body[..i], Some(&body[i + 1..])),
        None => (body, None),
    };
    let (int, frac) = match mantissa.split_once('.') {
        Some((a, b)) => (a, Some(b)),
        None => (mantissa, None),
    };
    let digits = |x: &str| x.bytes().all(|b| b.is_ascii_digit());
    if !digits(int) || !frac.is_none_or(digits) || int.is_empty() && frac.is_none_or(str::is_empty) {
        return None;
    }
    if let Some(e) = exponent {
        let e = e.strip_prefix(['-', '+']).unwrap_or(e);
        if e.is_empty() || !digits(e) {
            return None;
        }
    }
    // Leading zeros mean an identifier (serial, part number), not a number.
    if int.len() > 1 && int.starts_with('0') {
        return None;
    }
    if frac.is_none() && exponent.is_none() {
        if let Ok(i) = s.parse::<i64>() {
            return Some(Value::Number(i.into()));
        }
    }
    let f: f64 = s.parse().ok()?;
    Number::from_f64(f).map(Value::Number)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn plain_table_with_types() {
        let v = csv_to_data("Step,Count,Ok,Note,Serial\nA,3,true,,007\nB,-1.5e2,FALSE,\"x, y\",0\n", "x.csv").unwrap();
        assert_eq!(
            v,
            json!({"rows": [
                {"step": "A", "count": 3, "ok": true, "note": null, "serial": "007"},
                {"step": "B", "count": -150.0, "ok": false, "note": "x, y", "serial": 0}
            ]})
        );
    }

    #[test]
    fn quoting_crlf_bom_and_ragged_rows() {
        let text = "\u{feff}name,comment\r\n\"say \"\"hi\"\"\",\"two\r\nlines\"\r\nshort\r\nx,y,extra\r\n";
        let v = csv_to_data(text, "").unwrap();
        assert_eq!(
            v,
            json!({"rows": [
                {"name": "say \"hi\"", "comment": "two\r\nlines", "column3": null},
                {"name": "short", "comment": null, "column3": null},
                {"name": "x", "comment": "y", "column3": "extra"}
            ]})
        );
        assert!(csv_to_data("a,b\n\"open,1\n", "bad.csv").unwrap_err().to_string().contains("bad.csv"));
        assert!(csv_to_data("\n\n", "e.csv").is_err());
    }

    #[test]
    fn semicolon_with_decimal_comma_and_preamble() {
        let text = "Serial Number;SN-0012\nOperator;J. Rivera\nTemperature;23,5\n\n\
                    Parameter;Measured;Lower Limit;Upper Limit;Units\n\
                    VBUS;4,995;4,75;5,25;V\nRipple;31,7;;30;mV\n";
        let v = csv_to_data(text, "run.csv").unwrap();
        assert_eq!(
            v,
            json!({
                "serialNumber": "SN-0012",
                "operator": "J. Rivera",
                "temperature": 23.5,
                "measurements": [
                    {"name": "VBUS", "value": 4.995, "low": 4.75, "high": 5.25, "unit": "V"},
                    {"name": "Ripple", "value": 31.7, "low": null, "high": 30, "unit": "mV"}
                ]
            })
        );
    }

    #[test]
    fn tab_delimited_measurements_with_min_max() {
        let v = csv_to_data("Test\tValue\tMin\tMax\tStatus\nR1\t10.1\t9\t11\tPASS\n", "r.tsv").unwrap();
        assert_eq!(v, json!({"measurements": [{"name": "R1", "value": 10.1, "low": 9, "high": 11, "status": "PASS"}]}));
    }

    #[test]
    fn two_column_table_is_not_a_preamble() {
        let v = csv_to_data("Time,Voltage\n0,1.5\n1,1.6\n", "t.csv").unwrap();
        assert_eq!(v, json!({"rows": [{"time": 0, "voltage": 1.5}, {"time": 1, "voltage": 1.6}]}));
    }

    #[test]
    fn sniffing_and_keys() {
        assert_eq!(sniff_delimiter("a;b;c\n1,5;2,5;3\n", false), ';');
        assert_eq!(sniff_delimiter("a,b\n1,2\n", false), ',');
        assert_eq!(sniff_delimiter("a\tb,c\n1\t2,3\n", true), '\t');
        assert_eq!(camel_case("Serial Number"), "serialNumber");
        assert_eq!(camel_case("DUT S/N"), "dutSN");
        assert_eq!(camel_case("low_limit"), "lowLimit");
        assert_eq!(camel_case("2nd pass"), "_2ndPass");
        assert_eq!(camel_case("µ-Value"), "µValue");
        assert_eq!(camel_case("--"), "field");
        let v = csv_to_data("A,a,,A\n1,2,3,4\n", "").unwrap();
        assert_eq!(v, json!({"rows": [{"a": 1, "a2": 2, "column3": 3, "a3": 4}]}));
    }

    #[test]
    fn numbers() {
        assert_eq!(coerce("1,5", true), json!(1.5));
        assert_eq!(coerce("1,5", false), json!("1,5"));
        assert_eq!(coerce("1.000,5", true), json!("1.000,5"));
        assert_eq!(coerce(".5", false), json!(0.5));
        assert_eq!(coerce("0.25", false), json!(0.25));
        assert_eq!(coerce("1e", false), json!("1e"));
        assert_eq!(coerce("-", false), json!("-"));
        assert_eq!(coerce(".", false), json!("."));
        assert_eq!(coerce("NaN", false), json!("NaN"));
        assert_eq!(coerce(" 12 ", false), json!(12));
    }

    #[test]
    fn dispatch_by_name() {
        assert_eq!(parse_data_text("a,b,c\n1,2,3", "X.CSV").unwrap(), json!({"rows": [{"a": 1, "b": 2, "c": 3}]}));
        assert_eq!(parse_data_text("{\"v\": NaN}", "x.json").unwrap(), json!({"v": "NaN"}));
        assert!(parse_data_text("{", "x.json").unwrap_err().to_string().contains("x.json"));
        assert_eq!(
            parse_data_bytes(b"a,b,c\n\xb5A,2,3", "x.csv").unwrap(),
            json!({"rows": [{"a": "µA", "b": 2, "c": 3}]})
        );
    }
}
