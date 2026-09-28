use reportcore::{compile, render_pdf, Document, RenderOptions};
use serde_json::Value;
use std::path::PathBuf;

fn load(name: &str) -> (Document, Value) {
    let dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("templates");
    let doc = Document::from_json(&std::fs::read_to_string(dir.join(format!("{name}.rbt.json"))).unwrap()).unwrap();
    let data: Value =
        serde_json::from_str(&std::fs::read_to_string(dir.join(format!("{name}.data.json"))).unwrap()).unwrap();
    (doc, data)
}

fn out_dir() -> PathBuf {
    let d = PathBuf::from(env!("CARGO_TARGET_TMPDIR")).join("renders");
    std::fs::create_dir_all(&d).unwrap();
    d
}

fn pdf_text(path: &std::path::Path) -> Option<String> {
    let out = std::process::Command::new("pdftotext").arg("-layout").arg(path).arg("-").output().ok()?;
    out.status.success().then(|| String::from_utf8_lossy(&out.stdout).into_owned())
}

#[test]
fn ate_final_test_renders() {
    let (doc, data) = load("ate-final-test");
    let opts = RenderOptions { now: Some("2026-03-01T10:00:00+01:00".into()), ..Default::default() };
    let (pdf, issues) = render_pdf(&doc, &data, &opts).expect("renders");
    assert!(pdf.starts_with(b"%PDF"));
    let errors: Vec<_> = issues.iter().filter(|i| i.severity == reportcore::Severity::Error).collect();
    assert!(errors.is_empty(), "{errors:?}");
    let path = out_dir().join("ate-final-test.pdf");
    std::fs::write(&path, &pdf).unwrap();
    if let Some(text) = pdf_text(&path) {
        assert!(text.contains("PSU-24-0012873"), "{text}");
        assert!(text.contains("FAIL"));
        assert!(text.contains("Page 1 of"));
        assert!(text.contains("Ripple @ 1 A"));
    }
}

#[test]
fn preview_regions_and_svg() {
    let (doc, data) = load("ate-final-test");
    let opts = RenderOptions { preview: true, now: Some("2026-03-01T10:00:00Z".into()), ..Default::default() };
    let c = compile(&doc, &data, &opts).unwrap();
    let plain = compile(&doc, &data, &RenderOptions { now: opts.now.clone(), ..Default::default() }).unwrap();
    assert_eq!(c.page_count(), plain.page_count(), "markers must not change layout");
    let svgs = c.to_svg_pages();
    assert_eq!(svgs.len(), c.page_count());
    assert!(svgs[0].starts_with("<svg"));
    let regions = c.block_regions();
    let ids: Vec<&str> = regions.iter().map(|r| r.id.as_str()).collect();
    for want in ["title", "verdict", "meas", "charts", "trace"] {
        assert!(ids.contains(&want), "missing region {want}: {ids:?}");
    }
    let meas = regions.iter().find(|r| r.id == "meas").unwrap();
    let title = regions.iter().find(|r| r.id == "title").unwrap();
    assert!(meas.top > title.bottom, "{regions:?}");
    for r in &regions {
        assert!(r.bottom >= r.top, "{r:?}");
    }
}

fn doc_from(v: serde_json::Value) -> Document {
    Document::from_json(&v.to_string()).unwrap()
}

#[test]
fn long_tables_paginate_with_repeated_header() {
    let rows: Vec<Value> = (0..600)
        .map(|i| serde_json::json!({"name": format!("Point {i}"), "value": i as f64 * 0.01, "low": 0, "high": 5}))
        .collect();
    let doc = doc_from(serde_json::json!({"body": [{"type": "measurementTable", "source": "m"}]}));
    let c = compile(&doc, &serde_json::json!({"m": rows}), &RenderOptions::default()).unwrap();
    assert!(c.page_count() >= 10, "pages: {}", c.page_count());
    let pdf = c.to_pdf(reportcore::PdfStandard::None).unwrap();
    let path = out_dir().join("long.pdf");
    std::fs::write(&path, pdf).unwrap();
    if let Some(text) = pdf_text(&path) {
        assert!(text.matches("High limit").count() >= c.page_count(), "header must repeat on every page");
        assert!(text.contains("Point 599"));
    }
}

#[test]
fn hostile_data_is_inert() {
    let evil = "\"] #panic(\"x\") [ \\ ) } ]; #import \"/etc/passwd\" <l> @ref $math$ **b** {{ x }}";
    let doc = doc_from(serde_json::json!({"body": [
        {"type": "heading", "text": "{{ s }}"},
        {"type": "text", "text": "Value: {{ s }}"},
        {"type": "table", "source": "rows", "columns": [{"header": "{{ s }}", "value": "row.a"}]},
        {"type": "keyValue", "items": [{"label": "{{ s }}", "value": "{{ s }}"}]},
        {"type": "qrCode", "value": "{{ s }}"},
        {"type": "status", "value": "s", "label": "{{ s }}"}
    ]}));
    let data = serde_json::json!({"s": evil, "rows": [{"a": evil}]});
    let (pdf, _) = render_pdf(&doc, &data, &RenderOptions::default()).expect("hostile strings must not break layout");
    let path = out_dir().join("hostile.pdf");
    std::fs::write(&path, pdf).unwrap();
    if let Some(text) = pdf_text(&path) {
        assert!(text.contains("#panic"), "text must appear literally: {text}");
    }
}

#[test]
fn pdfa_export() {
    let (doc, data) = load("ate-final-test");
    let opts = RenderOptions {
        pdf_standard: reportcore::PdfStandard::A2b,
        now: Some("2026-03-01T10:00:00Z".into()),
        ..Default::default()
    };
    let (pdf, _) = render_pdf(&doc, &data, &opts).expect("PDF/A-2b");
    let s = String::from_utf8_lossy(&pdf);
    assert!(s.contains("pdfaid"), "XMP must declare PDF/A conformance");
}

#[test]
fn every_block_type_renders_with_and_without_data() {
    let doc = doc_from(serde_json::json!({
        "watermark": {"text": "DRAFT {{ rev }}", "visibleIf": "rev != 'RELEASED'"},
        "theme": {"logo": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCAxMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIi8+PC9zdmc+"},
        "header": [{"type": "logo", "heightMm": 6}],
        "body": [
            {"type": "heading", "text": "H", "level": 2, "align": "center"},
            {"type": "text", "text": "multi\nline\n\npara `mono`", "style": {"size": 12, "weight": "bold", "italic": true, "align": "right", "color": "#123456"}},
            {"type": "image", "src": "{{ img }}", "caption": "cap"},
            {"type": "table", "source": "rows", "rowTone": "row.s"},
            {"type": "measurementTable", "source": "rows", "failuresOnly": true, "showNominal": true},
            {"type": "keyValue", "title": "T", "columns": 3, "boxed": false, "items": [{"label": "a", "value": "1"}]},
            {"type": "summary", "source": "rows", "statusField": "s"},
            {"type": "status", "value": "'pass'", "style": "banner"},
            {"type": "callout", "tone": "warn", "title": "t", "text": "x"},
            {"type": "chart", "kind": "bar", "series": [{"label": "A", "source": "rows", "x": "item.name", "y": "item.value"}, {"label": "B", "source": "rows", "x": "item.name", "y": "item.value * 2"}]},
            {"type": "chart", "kind": "pie", "series": [{"label": "A", "source": "rows", "x": "item.name", "y": "item.value"}]},
            {"type": "chart", "kind": "scatter", "series": [{"label": "A", "source": "rows", "x": "item.value", "y": "item.value"}]},
            {"type": "gauge", "value": "7.2", "min": "0", "max": "10", "low": "2", "high": "8", "unit": "V"},
            {"type": "progress", "value": "42", "label": "Coverage"},
            {"type": "barcode", "value": "{{ sn }}", "format": "code128"},
            {"type": "signatures"},
            {"type": "divider"},
            {"type": "spacer", "heightMm": 3},
            {"type": "pageBreak"},
            {"type": "section", "title": "Ch {{ item.name }}", "repeat": "rows", "boxed": true, "keepTogether": true, "blocks": [
                {"type": "text", "text": "#{{ number }} = {{ item.value }}"},
                {"type": "pageBreak"}
            ]},
            {"type": "columns", "columns": [{"width": 1, "blocks": [{"type": "text", "text": "L"}]}, {"width": 2, "blocks": []}]}
        ]
    }));
    let data = serde_json::json!({"rev": "B", "sn": "SN-1", "img": "", "rows": [
        {"name": "a", "value": 1, "low": 0, "high": 2, "s": "PASS"},
        {"name": "b", "value": 3, "low": 0, "high": 2, "s": "FAIL"}
    ]});
    for (d, preview) in [(data, false), (serde_json::json!({}), true), (serde_json::json!({}), false)] {
        let c = compile(&doc, &d, &RenderOptions { preview, ..Default::default() }).expect("renders");
        assert!(c.page_count() >= 2);
        c.to_pdf(reportcore::PdfStandard::None).unwrap();
    }
}

#[test]
fn gallery_templates_render_cleanly() {
    let dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("templates");
    let mut names: Vec<String> = std::fs::read_dir(&dir)
        .unwrap()
        .filter_map(|e| e.ok()?.file_name().to_str()?.strip_suffix(".rbt.json").map(String::from))
        .collect();
    names.sort();
    assert!(names.len() >= 6);
    for name in names {
        let (doc, data) = load(&name);
        let report = reportcore::validate(&doc, Some(&data));
        let bad: Vec<_> = report.issues.iter().filter(|i| i.severity != reportcore::Severity::Info).collect();
        assert!(bad.is_empty(), "{name}: {bad:?}");
        let opts = RenderOptions { now: Some("2026-03-04T12:00:00Z".into()), ..Default::default() };
        let (pdf, issues) = render_pdf(&doc, &data, &opts).unwrap_or_else(|e| panic!("{name}: {e}"));
        let bad: Vec<_> = issues.iter().filter(|i| i.severity != reportcore::Severity::Info).collect();
        assert!(bad.is_empty(), "{name}: {bad:?}");
        std::fs::write(out_dir().join(format!("{name}.pdf")), pdf).unwrap();
    }
}
