//! Date parsing and formatting for the `date()` expression function.
//!
//! Accepts RFC 3339 / ISO 8601 strings, `YYYY-MM-DD[ HH:MM[:SS]]`, Unix
//! timestamps (seconds, or milliseconds when larger than 1e11) and LabVIEW
//! timestamps (seconds since 1904, numbers from 2.9e9 up to 1e11). The original
//! UTC offset is preserved so reports show the station's local time.

use chrono::{DateTime, FixedOffset, NaiveDate, NaiveDateTime, TimeZone, Utc};
use serde_json::Value;

const MONTHS: [&str; 12] = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
const DAYS: [&str; 7] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/// Seconds between the LabVIEW epoch (1904-01-01 UTC) and the Unix epoch.
pub const LABVIEW_EPOCH_OFFSET: f64 = 2_082_844_800.0;
/// Smallest number read as a LabVIEW timestamp (1999-01-25 in LabVIEW time).
const LABVIEW_MIN: f64 = 2.9e9;

pub fn parse(v: &Value) -> Option<DateTime<FixedOffset>> {
    match v {
        Value::Number(n) => {
            let mut f = n.as_f64()?;
            // LabVIEW timestamps count seconds from 1904-01-01. Values in this band are
            // 1999–2068 as LabVIEW time but 2062+ as Unix seconds, so read them as LabVIEW.
            if (LABVIEW_MIN..1e11).contains(&f) {
                f -= LABVIEW_EPOCH_OFFSET;
            }
            let (secs, nanos) = if f.abs() > 1e11 {
                ((f / 1000.0).floor() as i64, ((f % 1000.0) * 1e6) as u32)
            } else {
                (f.floor() as i64, (f.fract() * 1e9) as u32)
            };
            Utc.timestamp_opt(secs, nanos).single().map(|d| d.fixed_offset())
        }
        Value::String(s) => parse_str(s.trim()),
        _ => None,
    }
}

fn parse_str(s: &str) -> Option<DateTime<FixedOffset>> {
    if let Ok(d) = DateTime::parse_from_rfc3339(s) {
        return Some(d);
    }
    let utc = FixedOffset::east_opt(0)?;
    for fmt in ["%Y-%m-%dT%H:%M:%S%.f", "%Y-%m-%d %H:%M:%S%.f", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M", "%Y/%m/%d %H:%M:%S"]
    {
        if let Ok(n) = NaiveDateTime::parse_from_str(s, fmt) {
            return utc.from_local_datetime(&n).single();
        }
    }
    for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%d.%m.%Y"] {
        if let Ok(d) = NaiveDate::parse_from_str(s, fmt) {
            return utc.from_local_datetime(&d.and_hms_opt(0, 0, 0)?).single();
        }
    }
    if let Ok(n) = s.parse::<f64>() {
        return parse(&crate::expr::num(n));
    }
    None
}

/// Format with tokens: YYYY YY MMMM MMM MM M DD D dddd ddd HH H hh h mm ss A Z.
/// Text in square brackets is emitted literally: `[at] HH:mm`.
pub fn format(v: &Value, fmt: &str) -> Option<String> {
    let d = parse(v)?;
    Some(format_dt(&d, fmt))
}

pub fn format_dt(d: &DateTime<FixedOffset>, fmt: &str) -> String {
    use chrono::{Datelike, Timelike};
    let chars: Vec<char> = fmt.chars().collect();
    let mut out = String::new();
    let mut i = 0;
    let run = |i: usize, c: char| chars[i..].iter().take_while(|&&x| x == c).count();
    while i < chars.len() {
        let c = chars[i];
        if c == '[' {
            if let Some(end) = chars[i + 1..].iter().position(|&x| x == ']') {
                out.extend(&chars[i + 1..i + 1 + end]);
                i += end + 2;
                continue;
            }
        }
        let n = run(i, c);
        let piece = match (c, n) {
            ('Y', 4..) => Some(format!("{:04}", d.year())),
            ('Y', 2..=3) => Some(format!("{:02}", d.year() % 100)),
            ('M', 4..) => Some(MONTHS[d.month0() as usize].to_string()),
            ('M', 3) => Some(MONTHS[d.month0() as usize][..3].to_string()),
            ('M', 2) => Some(format!("{:02}", d.month())),
            ('M', 1) => Some(d.month().to_string()),
            ('D', 2..) => Some(format!("{:02}", d.day())),
            ('D', 1) => Some(d.day().to_string()),
            ('d', 4..) => Some(DAYS[d.weekday().num_days_from_monday() as usize].to_string()),
            ('d', 3) => Some(DAYS[d.weekday().num_days_from_monday() as usize][..3].to_string()),
            ('H', 2..) => Some(format!("{:02}", d.hour())),
            ('H', 1) => Some(d.hour().to_string()),
            ('h', 2..) => Some(format!("{:02}", (d.hour() + 11) % 12 + 1)),
            ('h', 1) => Some(((d.hour() + 11) % 12 + 1).to_string()),
            ('m', 2..) => Some(format!("{:02}", d.minute())),
            ('m', 1) => Some(d.minute().to_string()),
            ('s', 2..) => Some(format!("{:02}", d.second())),
            ('s', 1) => Some(d.second().to_string()),
            ('A', _) => Some(if d.hour() < 12 { "AM".into() } else { "PM".into() }),
            ('Z', _) => Some(d.format("%:z").to_string()),
            _ => None,
        };
        match piece {
            Some(p) => {
                out.push_str(&p);
                i += match c {
                    'Y' if n >= 4 => 4,
                    'Y' => 2,
                    'M' | 'd' if n >= 4 => 4,
                    'A' | 'Z' => 1,
                    _ => n.min(if c == 'M' || c == 'd' { 3 } else { 2 }),
                };
            }
            None => {
                out.push(c);
                i += 1;
            }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn labview_timestamps() {
        // 2026-03-01T10:20:30Z as LabVIEW seconds since 1904.
        let lv = 1_772_360_430.0 + LABVIEW_EPOCH_OFFSET;
        assert_eq!(format(&serde_json::json!(lv), "YYYY-MM-DD HH:mm:ss").unwrap(), "2026-03-01 10:20:30");
        assert_eq!(format(&serde_json::json!(1_772_360_430.0), "YYYY-MM-DD").unwrap(), "2026-03-01");
    }

    #[test]
    fn formats() {
        let v = json!("2026-03-01T14:05:09+01:00");
        assert_eq!(format(&v, "YYYY-MM-DD HH:mm:ss").unwrap(), "2026-03-01 14:05:09");
        assert_eq!(format(&v, "D MMM YYYY, h:mm A").unwrap(), "1 Mar 2026, 2:05 PM");
        assert_eq!(format(&v, "dddd [at] HH:mm Z").unwrap(), "Sunday at 14:05 +01:00");
        assert_eq!(format(&json!("2026-03-01"), "DD/MM/YY").unwrap(), "01/03/26");
        assert_eq!(format(&json!(0), "YYYY").unwrap(), "1970");
        assert_eq!(format(&json!(1_700_000_000_000i64), "YYYY").unwrap(), "2023");
        assert!(format(&json!("garbage"), "YYYY").is_none());
    }
}
