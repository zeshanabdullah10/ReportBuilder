//! QR codes, 1D barcodes and radial gauges as SVG.

use crate::charts::esc;
use crate::model::{BarcodeFormat, Theme};
use std::fmt::Write;

/// Render a QR code (error correction M) as SVG with a 2-module quiet zone.
pub fn qr_svg(value: &str) -> Result<String, String> {
    let code = qrcode::QrCode::with_error_correction_level(value.as_bytes(), qrcode::EcLevel::M)
        .map_err(|e| format!("cannot encode QR code: {e}"))?;
    let w = code.width();
    let colors = code.to_colors();
    let quiet = 2;
    let size = w + quiet * 2;
    let mut path = String::new();
    for y in 0..w {
        let mut x = 0;
        while x < w {
            if colors[y * w + x] == qrcode::Color::Dark {
                let start = x;
                while x < w && colors[y * w + x] == qrcode::Color::Dark {
                    x += 1;
                }
                let _ = write!(path, "M{},{}h{}v1h-{}z", start + quiet, y + quiet, x - start, x - start);
            } else {
                x += 1;
            }
        }
    }
    Ok(format!(
        r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" shape-rendering="crispEdges"><rect width="{size}" height="{size}" fill="#ffffff"/><path d="{path}" fill="#000000"/></svg>"##
    ))
}

/// Encode a 1D barcode into module bits.
pub fn barcode_bits(value: &str, format: BarcodeFormat) -> Result<Vec<u8>, String> {
    use barcoders::sym::{code128::Code128, code39::Code39, ean13::EAN13};
    let r = match format {
        BarcodeFormat::Code128 => {
            // Character set B covers printable ASCII.
            if !value.chars().all(|c| (' '..='~').contains(&c)) {
                return Err("Code 128 supports printable ASCII only".into());
            }
            Code128::new(format!("Ɓ{value}")).map(|c| c.encode())
        }
        BarcodeFormat::Code39 => Code39::new(value.to_uppercase()).map(|c| c.encode()),
        BarcodeFormat::Ean13 => EAN13::new(value).map(|c| c.encode()),
    };
    r.map_err(|e| format!("cannot encode barcode '{value}': {e}"))
}

/// Render module bits to an SVG (bars only; text is typeset separately).
pub fn barcode_svg(bits: &[u8]) -> String {
    let quiet = 10;
    let w = bits.len() + quiet * 2;
    let mut path = String::new();
    let mut i = 0;
    while i < bits.len() {
        if bits[i] == 1 {
            let start = i;
            while i < bits.len() && bits[i] == 1 {
                i += 1;
            }
            let _ = write!(path, "M{},0h{}v40h-{}z", start + quiet, i - start, i - start);
        } else {
            i += 1;
        }
    }
    format!(
        r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} 40" preserveAspectRatio="none" shape-rendering="crispEdges"><rect width="{w}" height="40" fill="#ffffff"/><path d="{path}" fill="#000000"/></svg>"##
    )
}

pub struct GaugeData<'a> {
    pub value: Option<f64>,
    pub min: f64,
    pub max: f64,
    pub low: Option<f64>,
    pub high: Option<f64>,
    pub text: &'a str,
    pub label: &'a str,
}

/// A 240° radial gauge with an in-spec band.
pub fn gauge_svg(g: &GaugeData, theme: &Theme) -> String {
    let (w, h) = (120.0, 96.0);
    let (cx, cy, r) = (60.0, 58.0, 44.0);
    let start = 150f64.to_radians();
    let sweep = 240f64.to_radians();
    let span = (g.max - g.min).abs().max(1e-12);
    let frac = |v: f64| ((v - g.min) / span).clamp(0.0, 1.0);
    let arc = |a0: f64, a1: f64, rad: f64| -> String {
        let (x0, y0) = (cx + rad * a0.cos(), cy + rad * a0.sin());
        let (x1, y1) = (cx + rad * a1.cos(), cy + rad * a1.sin());
        let large = if (a1 - a0).abs() > std::f64::consts::PI { 1 } else { 0 };
        format!("M{x0:.2},{y0:.2} A{rad:.2},{rad:.2} 0 {large} 1 {x1:.2},{y1:.2}")
    };
    let mut s = String::new();
    let _ = write!(
        s,
        r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" font-family="{}">"#,
        theme.font.typst_name()
    );
    let _ = write!(
        s,
        r##"<path d="{}" fill="none" stroke="#e8e8ed" stroke-width="9" stroke-linecap="round"/>"##,
        arc(start, start + sweep, r)
    );
    if g.low.is_some() || g.high.is_some() {
        let a = frac(g.low.unwrap_or(g.min));
        let b = frac(g.high.unwrap_or(g.max));
        let _ = write!(
            s,
            r#"<path d="{}" fill="none" stroke="{}" stroke-opacity="0.25" stroke-width="9"/>"#,
            arc(start + sweep * a, start + sweep * b, r),
            esc(&theme.pass_color)
        );
    }
    let in_spec = match g.value {
        Some(v) => !(g.low.is_some_and(|l| v < l) || g.high.is_some_and(|h| v > h)),
        None => true,
    };
    let color = if in_spec { theme.accent_color.clone() } else { theme.fail_color.clone() };
    if let Some(v) = g.value {
        let f = frac(v);
        if f > 0.0 {
            let _ = write!(
                s,
                r#"<path d="{}" fill="none" stroke="{}" stroke-width="9" stroke-linecap="round"/>"#,
                arc(start, start + sweep * f.max(0.004), r),
                esc(&color)
            );
        }
    }
    let _ = write!(
        s,
        r#"<text x="{cx}" y="{:.1}" text-anchor="middle" font-size="17" font-weight="600" fill="{}">{}</text>"#,
        cy + 4.0,
        esc(if in_spec { &theme.text_color } else { &theme.fail_color }),
        esc(g.text)
    );
    let _ = write!(
        s,
        r#"<text x="{cx}" y="{:.1}" text-anchor="middle" font-size="8.5" fill="{}">{}</text>"#,
        cy + 17.0,
        esc(&theme.muted_color),
        esc(g.label)
    );
    let _ = write!(
        s,
        r#"<text x="{:.1}" y="{:.1}" text-anchor="middle" font-size="7" fill="{}">{}</text><text x="{:.1}" y="{:.1}" text-anchor="middle" font-size="7" fill="{}">{}</text>"#,
        cx + r * start.cos(),
        cy + r * start.sin() + 14.0,
        esc(&theme.muted_color),
        crate::expr::format_number(g.min),
        cx + r * (start + sweep).cos(),
        cy + r * (start + sweep).sin() + 14.0,
        esc(&theme.muted_color),
        crate::expr::format_number(g.max)
    );
    s.push_str("</svg>");
    s
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn qr() {
        let s = qr_svg("SN-12345").unwrap();
        assert!(s.contains("<path d=\"M"));
    }

    #[test]
    fn barcodes() {
        assert!(barcode_bits("ABC-123", BarcodeFormat::Code128).is_ok());
        assert!(barcode_bits("abc", BarcodeFormat::Code39).is_ok());
        assert!(barcode_bits("750103131130", BarcodeFormat::Ean13).is_ok());
        assert!(barcode_bits("12", BarcodeFormat::Ean13).is_err());
        assert!(barcode_bits("é", BarcodeFormat::Code128).is_err());
        let svg = barcode_svg(&barcode_bits("X1", BarcodeFormat::Code128).unwrap());
        assert!(svg.contains("h"));
    }
}
