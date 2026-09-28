//! Static checks on templates and data.
//!
//! * Every expression and `{{ }}` template must parse.
//! * Every referenced data path is listed (the template's *data contract*).
//! * When data is supplied, paths that do not resolve are reported.

use crate::expr::{self, Scope};
use crate::model::*;
use serde::Serialize;
use serde_json::Value;
use std::cell::RefCell;
use std::collections::BTreeSet;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, PartialOrd, Ord)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Issue {
    pub severity: Severity,
    /// Block id, or empty for document-level issues.
    pub block_id: String,
    /// Field within the block, e.g. `columns[2].value`.
    pub field: String,
    pub message: String,
}

impl std::fmt::Display for Issue {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let sev = match self.severity {
            Severity::Error => "error",
            Severity::Warning => "warning",
            Severity::Info => "info",
        };
        if self.block_id.is_empty() {
            write!(f, "{sev}: {}", self.message)
        } else if self.field.is_empty() {
            write!(f, "{sev}: [{}] {}", self.block_id, self.message)
        } else {
            write!(f, "{sev}: [{}.{}] {}", self.block_id, self.field, self.message)
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FieldKind {
    /// A bare expression: `results`, `row.value * 1000`.
    Expr,
    /// Literal text with `{{ expr }}` holes.
    Template,
}

pub struct FieldRef<'a> {
    pub name: String,
    pub text: &'a str,
    pub kind: FieldKind,
    /// Extra local names in scope for this field only.
    pub locals: &'static [&'static str],
}

const ROW: &[&str] = &["row", "index", "number"];
const ITEM: &[&str] = &["item", "index", "number"];
const NONE: &[&str] = &[];

fn f<'a>(name: impl Into<String>, text: &'a str, kind: FieldKind, locals: &'static [&'static str]) -> FieldRef<'a> {
    FieldRef { name: name.into(), text, kind, locals }
}

/// All expression-bearing fields of a block (excluding children).
pub fn block_fields(b: &Block) -> Vec<FieldRef<'_>> {
    use FieldKind::*;
    let mut v = Vec::new();
    if let Some(c) = &b.visible_if {
        v.push(f("visibleIf", c, Expr, NONE));
    }
    match &b.kind {
        BlockKind::Heading(h) => v.push(f("text", &h.text, Template, NONE)),
        BlockKind::Text(t) => v.push(f("text", &t.text, Template, NONE)),
        BlockKind::Image(i) => {
            v.push(f("src", &i.src, Template, NONE));
            v.push(f("caption", &i.caption, Template, NONE));
        }
        BlockKind::Logo(_) | BlockKind::Divider(_) | BlockKind::Spacer(_) | BlockKind::PageBreak(_) => {}
        BlockKind::Table(t) => {
            v.push(f("source", &t.source, Expr, NONE));
            for (i, c) in t.columns.iter().enumerate() {
                v.push(f(format!("columns[{i}].header"), &c.header, Template, NONE));
                v.push(f(format!("columns[{i}].value"), &c.value, Expr, ROW));
            }
            if let Some(r) = &t.row_tone {
                v.push(f("rowTone", r, Expr, ROW));
            }
        }
        BlockKind::MeasurementTable(m) => v.push(f("source", &m.source, Expr, NONE)),
        BlockKind::KeyValue(k) => {
            v.push(f("title", &k.title, Template, NONE));
            for (i, it) in k.items.iter().enumerate() {
                v.push(f(format!("items[{i}].label"), &it.label, Template, NONE));
                v.push(f(format!("items[{i}].value"), &it.value, Template, NONE));
            }
        }
        BlockKind::Summary(s) => {
            v.push(f("title", &s.title, Template, NONE));
            v.push(f("source", &s.source, Expr, NONE));
            if let Some(x) = &s.verdict {
                v.push(f("verdict", x, Expr, NONE));
            }
        }
        BlockKind::Status(s) => {
            v.push(f("label", &s.label, Template, NONE));
            v.push(f("value", &s.value, Expr, NONE));
        }
        BlockKind::Callout(c) => {
            v.push(f("title", &c.title, Template, NONE));
            v.push(f("text", &c.text, Template, NONE));
        }
        BlockKind::Chart(c) => {
            v.push(f("title", &c.title, Template, NONE));
            v.push(f("xLabel", &c.x_label, Template, NONE));
            v.push(f("yLabel", &c.y_label, Template, NONE));
            for (i, s) in c.series.iter().enumerate() {
                v.push(f(format!("series[{i}].label"), &s.label, Template, NONE));
                v.push(f(format!("series[{i}].source"), &s.source, Expr, NONE));
                v.push(f(format!("series[{i}].x"), &s.x, Expr, ITEM));
                v.push(f(format!("series[{i}].y"), &s.y, Expr, ITEM));
            }
            for (i, l) in c.limits.iter().enumerate() {
                v.push(f(format!("limits[{i}].label"), &l.label, Template, NONE));
                v.push(f(format!("limits[{i}].value"), &l.value, Expr, NONE));
            }
        }
        BlockKind::Gauge(g) => {
            v.push(f("label", &g.label, Template, NONE));
            for (n, x) in [("value", &g.value), ("min", &g.min), ("max", &g.max), ("low", &g.low), ("high", &g.high)] {
                v.push(f(n, x, Expr, NONE));
            }
        }
        BlockKind::Progress(p) => {
            v.push(f("label", &p.label, Template, NONE));
            v.push(f("value", &p.value, Expr, NONE));
            v.push(f("max", &p.max, Expr, NONE));
        }
        BlockKind::QrCode(q) => {
            v.push(f("value", &q.value, Template, NONE));
            v.push(f("caption", &q.caption, Template, NONE));
        }
        BlockKind::Barcode(bc) => v.push(f("value", &bc.value, Template, NONE)),
        BlockKind::Signatures(s) => {
            for (i, e) in s.entries.iter().enumerate() {
                v.push(f(format!("entries[{i}].role"), &e.role, Template, NONE));
                v.push(f(format!("entries[{i}].name"), &e.name, Template, NONE));
            }
        }
        BlockKind::Columns(_) => {}
        BlockKind::Section(s) => {
            v.push(f("title", &s.title, Template, NONE));
            if let Some(r) = &s.repeat {
                v.push(f("repeat", r, Expr, NONE));
            }
        }
    }
    v.retain(|x| !x.text.trim().is_empty());
    v
}

/// Names always in scope besides the data root.
pub const BUILTINS: &[&str] = &["page", "pages", "report", "theme", "data"];

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Report {
    pub issues: Vec<Issue>,
    /// Data paths the template reads (its data contract).
    pub referenced_paths: Vec<String>,
}

impl Report {
    pub fn errors(&self) -> impl Iterator<Item = &Issue> {
        self.issues.iter().filter(|i| i.severity == Severity::Error)
    }
    pub fn has_errors(&self) -> bool {
        self.errors().next().is_some()
    }
}

/// Validate a template, optionally against data.
pub fn validate(doc: &Document, data: Option<&Value>) -> Report {
    let mut issues = Vec::new();
    let mut paths = BTreeSet::new();

    if doc.schema_version > SCHEMA_VERSION {
        issues.push(Issue {
            severity: Severity::Error,
            block_id: String::new(),
            field: String::new(),
            message: format!(
                "template format version {} is newer than this engine supports ({SCHEMA_VERSION}); please update",
                doc.schema_version
            ),
        });
    }

    let mut ids = BTreeSet::new();
    let mut check_blocks = |blocks: &[Block], issues: &mut Vec<Issue>, paths: &mut BTreeSet<String>| {
        fn go(
            blocks: &[Block],
            locals: &mut Vec<&'static str>,
            aliases: &mut Vec<String>,
            ids: &mut BTreeSet<String>,
            issues: &mut Vec<Issue>,
            paths: &mut BTreeSet<String>,
        ) {
            for b in blocks {
                if !ids.insert(b.id.clone()) {
                    issues.push(Issue {
                        severity: Severity::Error,
                        block_id: b.id.clone(),
                        field: String::new(),
                        message: "duplicate block id".into(),
                    });
                }
                // A repeated section's title is evaluated inside the loop.
                let section_alias = match &b.kind {
                    BlockKind::Section(s) if s.repeat.is_some() => {
                        Some(if s.alias.trim().is_empty() { "item".to_string() } else { s.alias.trim().to_string() })
                    }
                    _ => None,
                };
                for field in block_fields(b) {
                    let mut all: Vec<&str> = BUILTINS.to_vec();
                    all.extend(locals.iter());
                    all.extend(aliases.iter().map(|s| s.as_str()));
                    all.extend(field.locals.iter());
                    if field.name == "title" {
                        if let Some(a) = &section_alias {
                            all.extend([a.as_str(), "index", "number"]);
                        }
                    }
                    check_field(b, &field, &all, issues, paths);
                }
                structural_checks(b, issues);
                if let BlockKind::Section(s) = &b.kind {
                    if s.repeat.is_some() {
                        let alias =
                            if s.alias.trim().is_empty() { "item".to_string() } else { s.alias.trim().to_string() };
                        aliases.push(alias);
                        locals.extend(["index", "number"]);
                        go(&s.blocks, locals, aliases, ids, issues, paths);
                        locals.truncate(locals.len() - 2);
                        aliases.pop();
                        continue;
                    }
                }
                for c in b.children() {
                    go(c, locals, aliases, ids, issues, paths);
                }
            }
        }
        go(blocks, &mut Vec::new(), &mut Vec::new(), &mut ids, issues, paths);
    };
    check_blocks(&doc.header, &mut issues, &mut paths);
    check_blocks(&doc.body, &mut issues, &mut paths);
    check_blocks(&doc.footer, &mut issues, &mut paths);

    if let Some(w) = &doc.watermark {
        let wb = Block::new("", BlockKind::Text(Text { text: w.text.clone(), style: TextStyle::default() }));
        let fr = FieldRef { name: "watermark.text".into(), text: &w.text, kind: FieldKind::Template, locals: NONE };
        check_field(&wb, &fr, BUILTINS, &mut issues, &mut paths);
        if let Some(c) = &w.visible_if {
            let fr = FieldRef { name: "watermark.visibleIf".into(), text: c, kind: FieldKind::Expr, locals: NONE };
            check_field(&wb, &fr, BUILTINS, &mut issues, &mut paths);
        }
    }

    if doc.body.is_empty() {
        issues.push(Issue {
            severity: Severity::Info,
            block_id: String::new(),
            field: String::new(),
            message: "the report body is empty".into(),
        });
    }

    if let Some(data) = data {
        for p in &paths {
            if !path_resolves(data, p) {
                issues.push(Issue {
                    severity: Severity::Warning,
                    block_id: String::new(),
                    field: String::new(),
                    message: format!("data field '{p}' is missing"),
                });
            }
        }
    }

    Report { issues, referenced_paths: paths.into_iter().collect() }
}

fn check_field(b: &Block, field: &FieldRef, locals: &[&str], issues: &mut Vec<Issue>, paths: &mut BTreeSet<String>) {
    let parsed: Result<Vec<expr::Expr>, expr::ExprError> = match field.kind {
        FieldKind::Expr => expr::parse(field.text).map(|e| vec![e]),
        FieldKind::Template => expr::parse_template(field.text).map(|segs| {
            segs.into_iter()
                .filter_map(|s| match s {
                    expr::Segment::Expr(_, e) => Some(e),
                    _ => None,
                })
                .collect()
        }),
    };
    match parsed {
        Ok(exprs) => {
            for e in exprs {
                expr::referenced_paths(&e, locals, paths);
            }
        }
        Err(e) => issues.push(Issue {
            severity: Severity::Error,
            block_id: b.id.clone(),
            field: field.name.clone(),
            message: format!("{e}"),
        }),
    }
}

fn structural_checks(b: &Block, issues: &mut Vec<Issue>) {
    let mut warn = |field: &str, msg: &str| {
        issues.push(Issue {
            severity: Severity::Warning,
            block_id: b.id.clone(),
            field: field.into(),
            message: msg.into(),
        })
    };
    match &b.kind {
        BlockKind::Table(t) => {
            if t.source.trim().is_empty() {
                warn("source", "table has no data source");
            }
            if t.columns.is_empty() {
                warn("columns", "table has no columns; all fields of the first row will be shown");
            }
        }
        BlockKind::Chart(c) => {
            if c.series.is_empty() {
                warn("series", "chart has no series");
            }
            for (i, s) in c.series.iter().enumerate() {
                if s.source.trim().is_empty() {
                    warn(&format!("series[{i}].source"), "series has no data source");
                }
            }
        }
        BlockKind::Image(i) if i.src.trim().is_empty() => warn("src", "image has no source"),
        BlockKind::Columns(c) if c.columns.is_empty() => warn("columns", "columns block has no columns"),
        _ => {}
    }
}

/// Does a dotted/indexed path resolve in data? `a[]` means "every element".
pub fn path_resolves(data: &Value, path: &str) -> bool {
    let missing = RefCell::new(BTreeSet::new());
    let scope = Scope::new(data, &missing, "");
    let normalized = path.replace("[]", "[0]");
    match expr::parse(&normalized) {
        Ok(e) => {
            let v = scope.eval(&e);
            // Present-but-null values still count as resolved.
            !v.is_null() || missing.borrow().is_empty()
        }
        Err(_) => false,
    }
}

/// Infer a JSON Schema (draft 2020-12) describing a data sample.
pub fn infer_schema(data: &Value) -> Value {
    use serde_json::json;
    fn go(v: &Value) -> Value {
        match v {
            Value::Null => json!({}),
            Value::Bool(_) => json!({"type": "boolean"}),
            Value::Number(n) => {
                if n.is_i64() || n.is_u64() {
                    json!({"type": "integer"})
                } else {
                    json!({"type": "number"})
                }
            }
            Value::String(_) => json!({"type": "string"}),
            Value::Array(a) => match a.first() {
                Some(first) => json!({"type": "array", "items": go(first)}),
                None => json!({"type": "array"}),
            },
            Value::Object(m) => {
                let props: serde_json::Map<String, Value> = m.iter().map(|(k, v)| (k.clone(), go(v))).collect();
                let required: Vec<&String> = m.keys().collect();
                json!({"type": "object", "properties": props, "required": required})
            }
        }
    }
    let mut s = go(data);
    if let Value::Object(m) = &mut s {
        m.insert("$schema".into(), json!("https://json-schema.org/draft/2020-12/schema"));
    }
    s
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn doc(body: Value) -> Document {
        Document::from_json(&json!({"body": body}).to_string()).unwrap()
    }

    #[test]
    fn collects_paths_respecting_locals() {
        let d = doc(json!([
            {"type": "heading", "text": "Report {{ dut.serial }}"},
            {"type": "table", "source": "results", "columns": [{"header": "N", "value": "row.name"}]},
            {"type": "section", "repeat": "channels", "as": "ch", "blocks": [
                {"type": "text", "text": "{{ ch.name }} on {{ station }} #{{ number }}"}
            ]}
        ]));
        let r = validate(&d, None);
        assert!(!r.has_errors(), "{:?}", r.issues);
        assert_eq!(r.referenced_paths, vec!["channels", "dut.serial", "results", "station"]);
    }

    #[test]
    fn reports_parse_errors_with_location() {
        let d = doc(json!([{"id": "t1", "type": "text", "text": "{{ a + }}"}]));
        let r = validate(&d, None);
        let e = r.errors().next().unwrap();
        assert_eq!(e.block_id, "t1");
        assert_eq!(e.field, "text");
    }

    #[test]
    fn reports_missing_data() {
        let d = doc(json!([{"type": "text", "text": "{{ dut.serial }} {{ dut.model }}"}]));
        let r = validate(&d, Some(&json!({"dut": {"serial": "A"}})));
        let msgs: Vec<_> = r.issues.iter().map(|i| i.message.clone()).collect();
        assert_eq!(msgs, vec!["data field 'dut.model' is missing"]);
    }

    #[test]
    fn schema_inference() {
        let s = infer_schema(&json!({"a": 1, "b": [{"c": "x"}]}));
        assert_eq!(s["properties"]["b"]["items"]["properties"]["c"]["type"], "string");
    }
}
