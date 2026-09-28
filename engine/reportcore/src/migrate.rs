//! Import templates from the legacy web builder (Craft.js canvas state).
//!
//! Legacy templates placed components at absolute pixel positions on fixed
//! pages. We convert them into flowing blocks: components are ordered top to
//! bottom, and components that overlap vertically become a `columns` block
//! with widths proportional to their pixel widths. The conversion is best
//! effort; anything unrecognised becomes a visible callout so nothing is lost
//! silently.

use crate::model::*;
use serde_json::{Map, Value};

#[derive(Debug, Default)]
pub struct Migration {
    pub document: Document,
    pub notes: Vec<String>,
}

fn s(props: &Map<String, Value>, k: &str) -> String {
    match props.get(k) {
        Some(Value::String(x)) => x.clone(),
        Some(Value::Number(n)) => n.to_string(),
        _ => String::new(),
    }
}

fn n(props: &Map<String, Value>, k: &str) -> Option<f64> {
    props.get(k).and_then(|v| v.as_f64().or_else(|| v.as_str().and_then(|s| s.parse().ok())))
}

/// `{{data.x.y}}` or `data.x.y` → `x.y` (an expression).
fn binding_expr(b: &str) -> String {
    let t = b.trim();
    let t = t.strip_prefix("{{").and_then(|x| x.strip_suffix("}}")).unwrap_or(t).trim();
    t.strip_prefix("data.").unwrap_or(t).to_string()
}

fn type_name(node: &Value) -> String {
    match node.get("type") {
        Some(Value::String(s)) => s.clone(),
        Some(Value::Object(o)) => o.get("resolvedName").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        _ => String::new(),
    }
}

struct Item {
    y: f64,
    x: f64,
    w: f64,
    h: f64,
    block: Block,
}

/// Migrate a legacy template JSON (any of: Craft.js node map, `{nodes}`,
/// a template row with `canvas_state` / `settings.pages`).
pub fn migrate_legacy(v: &Value) -> Result<Migration, String> {
    let mut m = Migration::default();
    let mut doc = Document::default();
    if let Some(name) = v.get("name").and_then(|x| x.as_str()) {
        doc.meta.name = name.to_string();
    }
    if let Some(sd) = v.get("sample_data").or_else(|| v.get("sampleData")) {
        if !sd.is_null() {
            doc.sample_data = Some(sd.clone());
        }
    }
    let pages: Vec<Value> = if let Some(p) = v.pointer("/settings/pages").and_then(|p| p.as_array()) {
        let mut p = p.clone();
        p.sort_by_key(|x| x.get("order").and_then(|o| o.as_i64()).unwrap_or(0));
        p.into_iter().map(|pg| pg.get("canvasState").cloned().unwrap_or(Value::Null)).collect()
    } else if let Some(cs) = v.get("canvas_state").or_else(|| v.get("canvasState")) {
        vec![cs.clone()]
    } else {
        vec![v.clone()]
    };
    let mut first = true;
    for page in pages {
        let nodes = match page.get("nodes") {
            Some(Value::Object(o)) => o.clone(),
            _ => match page {
                Value::Object(o) => o,
                Value::Null => continue,
                _ => return Err("legacy canvas state must be an object".into()),
            },
        };
        if nodes.is_empty() {
            continue;
        }
        let root_id = if nodes.contains_key("ROOT") {
            "ROOT".to_string()
        } else {
            let children: std::collections::HashSet<&str> = nodes
                .values()
                .filter_map(|n| n.get("nodes").and_then(|c| c.as_array()))
                .flatten()
                .filter_map(|c| c.as_str())
                .collect();
            nodes.keys().find(|k| !children.contains(k.as_str())).cloned().ok_or("no root node found")?
        };
        if !first {
            doc.body.push(Block::new("", BlockKind::PageBreak(PageBreak {})));
        }
        first = false;
        let root = &nodes[&root_id];
        if type_name(root) == "Page" {
            if let Some(p) = root.get("props").and_then(|p| p.as_object()) {
                match s(p, "pageSize").as_str() {
                    "Letter" => doc.page.size = PaperSize::Letter,
                    "Legal" => doc.page.size = PaperSize::Legal,
                    "A3" => doc.page.size = PaperSize::A3,
                    _ => {}
                }
            }
        }
        let content_w = match doc.page.size {
            PaperSize::Letter | PaperSize::Legal => 816.0 - 80.0,
            PaperSize::A3 => 1123.0 - 80.0,
            _ => 794.0 - 80.0,
        };
        let ids: Vec<String> = root
            .get("nodes")
            .and_then(|c| c.as_array())
            .map(|a| a.iter().filter_map(|x| x.as_str().map(String::from)).collect())
            .unwrap_or_default();
        let items = collect(&nodes, &ids, &mut m.notes, content_w);
        doc.body.extend(layout_rows(items, content_w));
    }
    doc.normalize();
    m.document = doc;
    Ok(m)
}

fn collect(nodes: &Map<String, Value>, ids: &[String], notes: &mut Vec<String>, content_w: f64) -> Vec<Item> {
    let mut items = Vec::new();
    for id in ids {
        let Some(node) = nodes.get(id) else { continue };
        let props = node.get("props").and_then(|p| p.as_object()).cloned().unwrap_or_default();
        if props.get("visible") == Some(&Value::Bool(false)) {
            continue;
        }
        let ty = type_name(node);
        let (x, y) = (n(&props, "x").unwrap_or(0.0), n(&props, "y").unwrap_or(0.0));
        let (w, h) = (n(&props, "width").unwrap_or(200.0), n(&props, "height").unwrap_or(40.0));
        if ty == "Container" {
            let child_ids: Vec<String> = node
                .get("nodes")
                .and_then(|c| c.as_array())
                .map(|a| a.iter().filter_map(|x| x.as_str().map(String::from)).collect())
                .unwrap_or_default();
            let children = collect(nodes, &child_ids, notes, w);
            let blocks = layout_rows(children, w);
            items.push(Item {
                x,
                y,
                w,
                h,
                block: Block::new(
                    id.clone(),
                    BlockKind::Section(Section { blocks, boxed: true, ..Default::default() }),
                ),
            });
            continue;
        }
        let Some(mut block) = convert(&ty, &props, notes, content_w, w) else { continue };
        block.id = id.clone();
        let cond = s(&props, "visibilityCondition");
        if !cond.trim().is_empty() {
            block.visible_if = Some(binding_expr(&cond));
        }
        items.push(Item { x, y, w, h, block });
    }
    items
}

fn convert(ty: &str, p: &Map<String, Value>, notes: &mut Vec<String>, content_w: f64, w: f64) -> Option<Block> {
    let binding = s(p, "binding");
    let kind = match ty {
        "Text" => {
            let text =
                if !binding.trim().is_empty() { format!("{{{{ {} }}}}", binding_expr(&binding)) } else { s(p, "text") };
            let weight = match s(p, "fontWeight").as_str() {
                "bold" | "700" | "800" | "900" => Some(Weight::Bold),
                "600" => Some(Weight::Semibold),
                "500" => Some(Weight::Medium),
                _ => None,
            };
            let size = n(p, "fontSize").map(|px| (px * 0.75 * 10.0).round() / 10.0);
            let align = match s(p, "textAlign").as_str() {
                "center" => Some(Align::Center),
                "right" => Some(Align::Right),
                _ => None,
            };
            let color = Some(s(p, "color")).filter(|c| c.starts_with('#') && c != "#000000");
            if size.is_some_and(|sz| sz >= 18.0) {
                BlockKind::Heading(Heading { text, level: if size.unwrap() >= 24.0 { 1 } else { 2 }, align, color })
            } else {
                BlockKind::Text(Text { text, style: TextStyle { size, weight, color, align, ..Default::default() } })
            }
        }
        "Image" | "Logo" => BlockKind::Image(Image {
            src: s(p, "src"),
            width: (w / content_w * 100.0).clamp(5.0, 100.0).round(),
            ..Default::default()
        }),
        "Table" => {
            let columns = p
                .get("columns")
                .and_then(|c| c.as_array())
                .map(|cols| {
                    cols.iter()
                        .enumerate()
                        .map(|(i, c)| match c {
                            Value::String(h) => TableColumn {
                                header: h.clone(),
                                value: format!("row[{}]", Value::String(h.clone())),
                                ..Default::default()
                            },
                            Value::Object(o) => {
                                let key = ["key", "header", "name", "label"]
                                    .iter()
                                    .find_map(|k| o.get(*k).and_then(|v| v.as_str()))
                                    .unwrap_or("")
                                    .to_string();
                                let key = if key.is_empty() { i.to_string() } else { key };
                                let label = ["label", "header", "name", "key"]
                                    .iter()
                                    .find_map(|k| o.get(*k).and_then(|v| v.as_str()))
                                    .unwrap_or(&key)
                                    .to_string();
                                TableColumn {
                                    header: label,
                                    value: format!("row[{}]", Value::String(key)),
                                    ..Default::default()
                                }
                            }
                            _ => TableColumn::default(),
                        })
                        .collect()
                })
                .unwrap_or_default();
            if binding.trim().is_empty() {
                notes.push("a static legacy table was imported without its rows; bind it to data".into());
            }
            BlockKind::Table(Table { source: binding_expr(&binding), columns, ..Default::default() })
        }
        "MeasurementTable" => {
            let b = s(p, "dataBinding");
            BlockKind::MeasurementTable(MeasurementTable {
                source: if b.trim().is_empty() { "measurements".into() } else { binding_expr(&b) },
                ..Default::default()
            })
        }
        "Chart" | "Histogram" | "ScatterPlot" => {
            let kind = match (ty, s(p, "chartType").as_str()) {
                ("Histogram", _) => ChartKind::Histogram,
                ("ScatterPlot", _) | (_, "scatter") => ChartKind::Scatter,
                (_, "bar") => ChartKind::Bar,
                (_, "pie") | (_, "doughnut") => ChartKind::Pie,
                _ => ChartKind::Line,
            };
            let mut series = Vec::new();
            if let Some(ds) = p.get("datasets").and_then(|d| d.as_array()) {
                for d in ds {
                    let src = d.get("binding").and_then(|v| v.as_str()).unwrap_or("");
                    series.push(Series {
                        label: d.get("label").and_then(|v| v.as_str()).unwrap_or("Series").into(),
                        source: if src.is_empty() { json_list(d.get("dataPoints")) } else { binding_expr(src) },
                        ..Default::default()
                    });
                }
            }
            if series.is_empty() {
                let src =
                    if binding.trim().is_empty() { json_list(p.get("dataPoints")) } else { binding_expr(&binding) };
                series.push(Series { label: s(p, "label"), source: src, ..Default::default() });
            }
            BlockKind::Chart(Chart {
                kind,
                title: s(p, "title"),
                series,
                height_mm: (n(p, "height").unwrap_or(220.0) * 25.4 / 96.0).clamp(30.0, 140.0).round(),
                ..Default::default()
            })
        }
        "Indicator" => BlockKind::Status(Status {
            label: s(p, "label"),
            value: if binding.trim().is_empty() {
                format!("{}", Value::String(s(p, "status")))
            } else {
                binding_expr(&binding)
            },
            ..Default::default()
        }),
        "TestSummaryBox" | "PassRateChart" => BlockKind::Summary(Summary::default()),
        "Divider" => BlockKind::Divider(Divider {
            thickness: n(p, "thickness").unwrap_or(1.0) * 0.75,
            color: Some(s(p, "color")).filter(|c| c.starts_with('#')),
        }),
        "Spacer" => BlockKind::Spacer(Spacer { height_mm: (n(p, "height").unwrap_or(20.0) * 25.4 / 96.0).round() }),
        "PageBreak" => BlockKind::PageBreak(PageBreak {}),
        "QRCode" => BlockKind::QrCode(QrCode {
            value: if binding.trim().is_empty() {
                s(p, "value")
            } else {
                format!("{{{{ {} }}}}", binding_expr(&binding))
            },
            size_mm: (n(p, "size").unwrap_or(100.0) * 25.4 / 96.0).round(),
            caption: s(p, "label"),
            ..Default::default()
        }),
        "Barcode" => BlockKind::Barcode(Barcode {
            value: if binding.trim().is_empty() {
                s(p, "value")
            } else {
                format!("{{{{ {} }}}}", binding_expr(&binding))
            },
            format: match s(p, "format").to_ascii_uppercase().as_str() {
                "CODE39" => BarcodeFormat::Code39,
                "EAN13" => BarcodeFormat::Ean13,
                _ => BarcodeFormat::Code128,
            },
            ..Default::default()
        }),
        "SignatureLine" => {
            let entries = p
                .get("signatures")
                .and_then(|x| x.as_array())
                .map(|a| {
                    a.iter()
                        .map(|sg| SignatureEntry {
                            role: sg.get("label").and_then(|v| v.as_str()).unwrap_or("Signature").into(),
                            name: sg
                                .get("nameBinding")
                                .and_then(|v| v.as_str())
                                .map(|b| format!("{{{{ {} }}}}", binding_expr(b)))
                                .unwrap_or_default(),
                        })
                        .collect()
                })
                .unwrap_or_else(|| Signatures::default().entries);
            BlockKind::Signatures(Signatures { entries, show_date: true })
        }
        "Gauge" => BlockKind::Gauge(Gauge {
            label: s(p, "label"),
            value: binding_expr(&binding),
            min: n(p, "min").map(|v| v.to_string()).unwrap_or_else(|| "0".into()),
            max: n(p, "max").map(|v| v.to_string()).unwrap_or_else(|| "100".into()),
            unit: s(p, "unit"),
            ..Default::default()
        }),
        "ProgressBar" => BlockKind::Progress(Progress {
            label: s(p, "label"),
            value: if binding.trim().is_empty() {
                n(p, "value").map(|v| v.to_string()).unwrap_or_default()
            } else {
                binding_expr(&binding)
            },
            max: n(p, "max").map(|v| v.to_string()).unwrap_or_else(|| "100".into()),
            ..Default::default()
        }),
        "DateTime" => BlockKind::Text(Text {
            text: if binding.trim().is_empty() {
                "{{ date(now(), 'YYYY-MM-DD HH:mm') }}".into()
            } else {
                format!("{{{{ date({}, 'YYYY-MM-DD HH:mm') }}}}", binding_expr(&binding))
            },
            style: TextStyle::default(),
        }),
        "PageNumber" => BlockKind::Text(Text {
            text: "Page {{ page }} of {{ pages }}".into(),
            style: TextStyle { align: Some(Align::Right), ..Default::default() },
        }),
        "BulletList" => {
            let items = p
                .get("items")
                .and_then(|x| x.as_array())
                .map(|a| a.iter().filter_map(|i| i.as_str()).map(|i| format!("•  {i}")).collect::<Vec<_>>().join("\n"))
                .unwrap_or_default();
            BlockKind::Text(Text { text: items, style: TextStyle::default() })
        }
        "SpecBox" | "RevisionBlock" | "ToleranceBand" | "Watermark" | "Logo_" => {
            notes.push(format!("legacy '{ty}' was converted to a note; rebuild it with the new blocks"));
            BlockKind::Callout(Callout {
                title: format!("Legacy {ty}"),
                text: "This component needs to be recreated.".into(),
                tone: Tone::Warn,
            })
        }
        other => {
            notes.push(format!("unknown legacy component '{other}' was skipped"));
            return None;
        }
    };
    Some(Block::new("", kind))
}

fn json_list(v: Option<&Value>) -> String {
    match v {
        Some(Value::Array(a)) => Value::Array(a.clone()).to_string(),
        _ => String::new(),
    }
}

fn layout_rows(mut items: Vec<Item>, content_w: f64) -> Vec<Block> {
    items.sort_by(|a, b| {
        a.y.partial_cmp(&b.y)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then(a.x.partial_cmp(&b.x).unwrap_or(std::cmp::Ordering::Equal))
    });
    let mut rows: Vec<Vec<Item>> = Vec::new();
    for it in items {
        let joins = rows.last().is_some_and(|row| {
            let bottom = row.iter().map(|r| r.y + r.h).fold(f64::MIN, f64::max);
            // Overlapping vertically by more than a third of the smaller height.
            let overlap = bottom - it.y;
            overlap > it.h.min(row[0].h) / 3.0
        });
        if joins {
            rows.last_mut().unwrap().push(it);
        } else {
            rows.push(vec![it]);
        }
    }
    let mut out = Vec::new();
    for mut row in rows {
        if row.len() == 1 {
            out.push(row.pop().unwrap().block);
            continue;
        }
        row.sort_by(|a, b| a.x.partial_cmp(&b.x).unwrap_or(std::cmp::Ordering::Equal));
        let total: f64 = row.iter().map(|r| r.w.max(10.0)).sum::<f64>().max(content_w * 0.2);
        let columns = row
            .into_iter()
            .map(|r| Column { width: ((r.w.max(10.0) / total) * 10.0).round().max(1.0), blocks: vec![r.block] })
            .collect();
        out.push(Block::new("", BlockKind::Columns(Columns { columns, gap_mm: 5.0 })));
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn converts_rows_and_bindings() {
        let legacy = json!({
            "ROOT": {"type": {"resolvedName": "Page"}, "props": {"pageSize": "Letter"}, "nodes": ["a", "b", "c", "d"]},
            "a": {"type": {"resolvedName": "Text"}, "props": {"text": "Title", "fontSize": 32, "x": 0, "y": 0, "width": 400, "height": 50}},
            "b": {"type": {"resolvedName": "Text"}, "props": {"binding": "{{data.dut.serial}}", "x": 0, "y": 80, "width": 300, "height": 30}},
            "c": {"type": {"resolvedName": "Indicator"}, "props": {"binding": "data.result", "label": "Result", "x": 350, "y": 85, "width": 150, "height": 30}},
            "d": {"type": {"resolvedName": "MeasurementTable"}, "props": {"dataBinding": "{{data.results}}", "x": 0, "y": 200, "width": 700, "height": 300}}
        });
        let m = migrate_legacy(&legacy).unwrap();
        let d = &m.document;
        assert_eq!(d.page.size, PaperSize::Letter);
        assert_eq!(d.body.len(), 3);
        assert!(matches!(&d.body[0].kind, BlockKind::Heading(h) if h.text == "Title" && h.level == 1));
        match &d.body[1].kind {
            BlockKind::Columns(c) => {
                assert_eq!(c.columns.len(), 2);
                assert!(matches!(&c.columns[0].blocks[0].kind, BlockKind::Text(t) if t.text == "{{ dut.serial }}"));
                assert!(matches!(&c.columns[1].blocks[0].kind, BlockKind::Status(s) if s.value == "result"));
            }
            other => panic!("expected columns, got {other:?}"),
        }
        assert!(matches!(&d.body[2].kind, BlockKind::MeasurementTable(t) if t.source == "results"));
        assert!(crate::validate::validate(d, None)
            .issues
            .iter()
            .all(|i| i.severity != crate::validate::Severity::Error));
    }

    #[test]
    fn multi_page_settings() {
        let legacy = json!({"name": "Old", "settings": {"pages": [
            {"order": 1, "canvasState": {"ROOT": {"type": "Page", "nodes": ["x"]}, "x": {"type": "Spacer", "props": {"height": 38}}}},
            {"order": 0, "canvasState": {"ROOT": {"type": "Page", "nodes": ["y"]}, "y": {"type": "Divider", "props": {}}}}
        ]}});
        let m = migrate_legacy(&legacy).unwrap();
        assert_eq!(m.document.meta.name, "Old");
        let kinds: Vec<&str> = m.document.body.iter().map(|b| b.kind.type_name()).collect();
        assert_eq!(kinds, vec!["divider", "pageBreak", "spacer"]);
    }
}
