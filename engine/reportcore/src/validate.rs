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
use std::collections::{BTreeMap, BTreeSet};

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
    /// For per-row fields: the expression giving the list that `row` / `item` iterate.
    pub source: Option<&'a str>,
}

const ROW: &[&str] = &["row", "index", "number"];
const ITEM: &[&str] = &["item", "index", "number"];
const NONE: &[&str] = &[];

fn f<'a>(name: impl Into<String>, text: &'a str, kind: FieldKind, locals: &'static [&'static str]) -> FieldRef<'a> {
    FieldRef { name: name.into(), text, kind, locals, source: None }
}

fn per_row<'a>(
    name: impl Into<String>,
    text: &'a str,
    locals: &'static [&'static str],
    source: &'a str,
) -> FieldRef<'a> {
    FieldRef { name: name.into(), text, kind: FieldKind::Expr, locals, source: Some(source) }
}

/// Measurement-table fields in order, as (slot, value).
pub fn measurement_slots(m: &MeasurementTable) -> [(&'static str, &str); 7] {
    let f = &m.fields;
    [
        ("name", f.name.as_str()),
        ("value", f.value.as_str()),
        ("low", f.low.as_str()),
        ("high", f.high.as_str()),
        ("nominal", f.nominal.as_str()),
        ("unit", f.unit.as_str()),
        ("status", f.status.as_str()),
    ]
}

/// A measurement field is a key of the row unless it is an expression.
pub fn is_field_name(s: &str) -> bool {
    let mut c = s.chars();
    c.next().is_some_and(|f| f.is_alphabetic() || f == '_') && c.all(|x| x.is_alphanumeric() || x == '_')
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
                v.push(per_row(format!("columns[{i}].value"), &c.value, ROW, &t.source));
            }
            if let Some(r) = &t.row_tone {
                v.push(per_row("rowTone", r, ROW, &t.source));
            }
            v.push(f("emptyText", &t.empty_text, Template, NONE));
        }
        BlockKind::MeasurementTable(m) => {
            v.push(f("source", &m.source, Expr, NONE));
            for (slot, src) in measurement_slots(m) {
                if !src.trim().is_empty() && !is_field_name(src.trim()) {
                    v.push(per_row(format!("fields.{slot}"), src, ROW, &m.source));
                }
            }
            v.push(f("emptyText", &m.empty_text, Template, NONE));
        }
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
                v.push(per_row(format!("series[{i}].x"), &s.x, ITEM, &s.source));
                v.push(per_row(format!("series[{i}].y"), &s.y, ITEM, &s.source));
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

/// One field of the template's data contract.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContractField {
    /// Path in the data as the station must send it (after `dataMap`). Fields of
    /// list items look like `measurements[].value`.
    pub path: String,
    /// Read only in ways that tolerate absence (`x ?? y`, optional measurement columns).
    pub optional: bool,
    /// `string`, `number`, `boolean`, `array`, `object`, or `any` when no sample says.
    pub kind: &'static str,
    /// First block and field that read it.
    pub block_id: String,
    pub field: String,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Report {
    pub issues: Vec<Issue>,
    /// Data paths the template reads, in the template's own names. Fields of list
    /// items are included as `list[].field`.
    pub referenced_paths: Vec<String>,
    /// The typed data contract: what the data must contain, in the data's names.
    pub contract: Vec<ContractField>,
}

impl Report {
    pub fn errors(&self) -> impl Iterator<Item = &Issue> {
        self.issues.iter().filter(|i| i.severity == Severity::Error)
    }
    pub fn has_errors(&self) -> bool {
        self.errors().next().is_some()
    }
}

/// A loop variable in scope, and the list it walks when that is a plain path.
#[derive(Debug, Clone)]
struct Local {
    name: String,
    list: Option<String>,
}

fn local(name: &str, list: Option<String>) -> Local {
    Local { name: name.to_string(), list }
}

#[derive(Debug, Clone)]
struct Use {
    optional: bool,
    block_id: String,
    field: String,
}

struct Checker<'a> {
    issues: Vec<Issue>,
    uses: BTreeMap<String, Use>,
    ids: BTreeSet<String>,
    data: Option<&'a Value>,
}

/// Rewrite a path read through loop variables into a data path: with `row` walking
/// `results`, `row.value` is `results[].value`. None for builtins and unbound locals.
fn resolve(path: &str, locals: &[Local]) -> Option<String> {
    let head = path.split(['.', '[']).next().unwrap_or("");
    if let Some(l) = locals.iter().rev().find(|l| l.name == head) {
        let rest = &path[head.len()..];
        return l.list.as_ref().map(|list| format!("{list}[]{rest}"));
    }
    if BUILTINS.contains(&head) {
        return None;
    }
    Some(path.to_string())
}

/// The list an expression iterates, when it is a path or a filter of one
/// (`where(results, 'status', 'FAIL')`).
fn list_path(src: &str, locals: &[Local]) -> Option<String> {
    fn go(e: &expr::Expr) -> Option<String> {
        if let Some(p) = expr::path_of(e) {
            return Some(p.strip_prefix("data.").map(str::to_string).unwrap_or(p));
        }
        match e {
            expr::Expr::Call(name, args)
                if matches!(
                    name.as_str(),
                    "where" | "filter" | "select" | "sort" | "reverse" | "slice" | "unique" | "default" | "coalesce"
                ) =>
            {
                args.first().and_then(go)
            }
            expr::Expr::Binary("??", a, _) => go(a),
            _ => None,
        }
    }
    if src.trim().is_empty() {
        return None;
    }
    let e = expr::parse(src).ok()?;
    resolve(&go(&e)?, locals)
}

impl Checker<'_> {
    fn issue(&mut self, severity: Severity, block_id: &str, field: &str, message: impl Into<String>) {
        self.issues.push(Issue { severity, block_id: block_id.into(), field: field.into(), message: message.into() });
    }

    fn record(&mut self, path: String, optional: bool, block_id: &str, field: &str) {
        self.uses.entry(path).and_modify(|u| u.optional &= optional).or_insert_with(|| Use {
            optional,
            block_id: block_id.into(),
            field: field.into(),
        });
    }

    /// Parse a field and record what it reads.
    fn field(&mut self, block_id: &str, field: &FieldRef, locals: &[Local]) {
        let parsed: Result<Vec<(String, expr::Expr)>, expr::ExprError> = match field.kind {
            FieldKind::Expr => expr::parse(field.text).map(|e| vec![(field.text.trim().to_string(), e)]),
            FieldKind::Template => expr::parse_template(field.text).map(|segs| {
                segs.into_iter()
                    .filter_map(|s| match s {
                        expr::Segment::Expr(raw, e) => Some((raw, e)),
                        _ => None,
                    })
                    .collect()
            }),
        };
        let exprs = match parsed {
            Ok(e) => e,
            Err(e) => {
                self.issue(Severity::Error, block_id, &field.name, format!("{e}"));
                return;
            }
        };
        // Loop variables for this field: `row` / `item` walk the field's source list.
        let mut scope: Vec<Local> = locals.to_vec();
        for n in field.locals {
            let list = match *n {
                "row" | "item" => field.source.and_then(|s| list_path(s, locals)),
                _ => None,
            };
            scope.push(local(n, list));
        }
        for (raw, e) in exprs {
            let mut body = Vec::new();
            expr::body_errors(&e, &mut body);
            for err in body {
                self.issue(Severity::Error, block_id, &field.name, err.message);
            }
            let mut names = BTreeSet::new();
            expr::function_names(&e, &mut names);
            for n in names {
                if !expr::FUNCTIONS.contains(&n.as_str()) {
                    let hint = expr::suggest(&n, expr::FUNCTIONS.iter().copied())
                        .map(|s| format!("; did you mean {s}()?"))
                        .unwrap_or_default();
                    self.issue(
                        Severity::Warning,
                        block_id,
                        &field.name,
                        format!("unknown function '{n}()' always gives an empty value{hint}"),
                    );
                }
            }
            let mut uses = Vec::new();
            expr::path_uses(&e, &mut uses);
            let page_ref = uses.iter().any(|u| matches!(u.path.as_str(), "page" | "pages"));
            if page_ref && !(field.kind == FieldKind::Template && matches!(raw.trim(), "page" | "pages")) {
                self.issue(
                    Severity::Warning,
                    block_id,
                    &field.name,
                    "page numbers are only known at layout time: use {{ page }} or {{ pages }} on their own in a text, heading or footer",
                );
            }
            for u in uses {
                if let Some(p) = resolve(&u.path, &scope) {
                    self.record(p, u.optional, block_id, &field.name);
                }
            }
        }
        // Bare paths in text fields print literally: `dut.serial` instead of its value.
        if field.kind == FieldKind::Template && !expr::has_template(field.text) {
            let t = field.text.trim();
            let looks_like_path =
                t.contains('.') && !t.contains(' ') && expr::parse(t).ok().and_then(|e| expr::path_of(&e)).is_some();
            if looks_like_path && self.data.is_some_and(|d| path_resolves(d, t)) {
                self.issue(
                    Severity::Warning,
                    block_id,
                    &field.name,
                    format!("this prints the text '{t}'; write {{{{ {t} }}}} to show the value"),
                );
            }
        }
    }

    fn blocks(&mut self, blocks: &[Block], locals: &mut Vec<Local>) {
        for b in blocks {
            if !self.ids.insert(b.id.clone()) {
                self.issue(Severity::Error, &b.id, "", "duplicate block id");
            }
            let repeat = match &b.kind {
                BlockKind::Section(s) => s.repeat.as_deref().filter(|r| !r.trim().is_empty()).map(|r| {
                    let alias = if s.alias.trim().is_empty() { "item" } else { s.alias.trim() };
                    (alias.to_string(), list_path(r, locals))
                }),
                _ => None,
            };
            for field in block_fields(b) {
                // A repeated section's title is evaluated inside the loop.
                if field.name == "title" {
                    if let Some((alias, list)) = &repeat {
                        let mut inner = locals.clone();
                        inner.extend([local(alias, list.clone()), local("index", None), local("number", None)]);
                        self.field(&b.id, &field, &inner);
                        continue;
                    }
                }
                self.field(&b.id, &field, locals);
            }
            self.measurement_fields(b, locals);
            structural_checks(b, &mut self.issues);
            if let Some((alias, list)) = repeat {
                let n = locals.len();
                locals.extend([local(&alias, list), local("index", None), local("number", None)]);
                for c in b.children() {
                    self.blocks(c, locals);
                }
                locals.truncate(n);
                continue;
            }
            for c in b.children() {
                self.blocks(c, locals);
            }
        }
    }

    /// Plain field names of measurement tables and verdicts read per row.
    fn measurement_fields(&mut self, b: &Block, locals: &[Local]) {
        match &b.kind {
            BlockKind::MeasurementTable(m) => {
                let Some(list) = list_path(&m.source, locals) else { return };
                for (slot, key) in measurement_slots(m) {
                    let key = key.trim();
                    if !key.is_empty() && is_field_name(key) {
                        // Only the measured value is required; the rest are optional columns.
                        self.record(format!("{list}[].{key}"), slot != "value", &b.id, &format!("fields.{slot}"));
                    }
                }
            }
            BlockKind::Summary(s) => {
                let key = s.status_field.trim();
                if let Some(list) = list_path(&s.source, locals) {
                    if is_field_name(key) {
                        self.record(format!("{list}[].{key}"), true, &b.id, "statusField");
                    }
                }
            }
            _ => {}
        }
    }
}

/// Validate a template, optionally against data. The template's `dataMap` is applied
/// to the data first, as the renderer does.
pub fn validate(doc: &Document, data: Option<&Value>) -> Report {
    let mapped = data.map(|d| apply_data_map(&doc.data_map, d));
    let data = mapped.as_ref();
    let mut cx = Checker { issues: Vec::new(), uses: BTreeMap::new(), ids: BTreeSet::new(), data };

    if doc.schema_version > SCHEMA_VERSION {
        cx.issue(
            Severity::Error,
            "",
            "",
            format!(
                "template format version {} is newer than this engine supports ({SCHEMA_VERSION}); please update",
                doc.schema_version
            ),
        );
    }

    // Computed fields: each sees the ones before it.
    let mut locals: Vec<Local> = Vec::new();
    for (i, v) in doc.vars.iter().enumerate() {
        let name = v.name.trim();
        let field = format!("vars[{i}]");
        if name.is_empty() || !is_field_name(name) {
            cx.issue(Severity::Error, "", &field, format!("'{name}' is not a valid name: use letters, digits and _"));
            continue;
        }
        if BUILTINS.contains(&name) {
            cx.issue(Severity::Error, "", &field, format!("'{name}' is reserved"));
        }
        let fr = FieldRef {
            name: format!("{field}.value"),
            text: &v.value,
            kind: FieldKind::Expr,
            locals: NONE,
            source: None,
        };
        if v.value.trim().is_empty() {
            cx.issue(Severity::Warning, "", &fr.name, format!("computed field '{name}' has no value"));
        } else {
            cx.field("", &fr, &locals);
        }
        locals.push(local(name, None));
    }

    cx.blocks(&doc.header, &mut locals.clone());
    cx.blocks(&doc.body, &mut locals.clone());
    cx.blocks(&doc.footer, &mut locals.clone());

    if let Some(w) = &doc.watermark {
        let fr = FieldRef {
            name: "watermark.text".into(),
            text: &w.text,
            kind: FieldKind::Template,
            locals: NONE,
            source: None,
        };
        cx.field("", &fr, &locals);
        if let Some(c) = &w.visible_if {
            let fr = FieldRef {
                name: "watermark.visibleIf".into(),
                text: c,
                kind: FieldKind::Expr,
                locals: NONE,
                source: None,
            };
            cx.field("", &fr, &locals);
        }
    }

    if doc.body.is_empty() {
        cx.issue(Severity::Info, "", "", "the report body is empty");
    }

    if let Some(data) = data {
        let known = data_path_list(data);
        let missing: Vec<(String, Use)> = cx
            .uses
            .iter()
            .filter(|(p, u)| !u.optional && path_present(data, p) == Some(false))
            .map(|(p, u)| (p.clone(), u.clone()))
            .collect();
        for (p, u) in missing {
            cx.issue(Severity::Warning, &u.block_id, &u.field, missing_message(&p, &known));
        }
    }

    let sample = data.or(doc.sample_data.as_ref());
    let contract = cx
        .uses
        .iter()
        .map(|(p, u)| {
            let path = to_data_name(&doc.data_map, p);
            let kind = sample.and_then(|d| kind_at(d, &path)).unwrap_or("any");
            ContractField { path, optional: u.optional, kind, block_id: u.block_id.clone(), field: u.field.clone() }
        })
        .collect();

    Report { issues: cx.issues, referenced_paths: cx.uses.keys().cloned().collect(), contract }
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

/// "data field 'x' is missing", with the closest field the data has.
pub fn missing_message(path: &str, known: &[String]) -> String {
    match expr::suggest(path, known.iter().map(String::as_str)) {
        Some(s) => format!("data field '{path}' is missing; did you mean '{s}'?"),
        None => format!("data field '{path}' is missing"),
    }
}

/// Every path in a data set, in contract notation (`dut.serial`, `measurements[].value`).
pub fn data_path_list(data: &Value) -> Vec<String> {
    fn go(v: &Value, prefix: &str, out: &mut Vec<String>) {
        match v {
            Value::Object(m) => {
                for (k, x) in m {
                    let p = if prefix.is_empty() { k.clone() } else { format!("{prefix}.{k}") };
                    out.push(p.clone());
                    go(x, &p, out);
                }
            }
            Value::Array(a) => {
                let p = format!("{prefix}[]");
                let mut seen = BTreeSet::new();
                for item in a.iter().take(25) {
                    let mut inner = Vec::new();
                    go(item, &p, &mut inner);
                    for i in inner {
                        if seen.insert(i.clone()) {
                            out.push(i);
                        }
                    }
                }
            }
            _ => {}
        }
    }
    let mut out = Vec::new();
    go(data, "", &mut out);
    out
}

/// Split a contract path into segments; `[]` marks "each element".
fn segments(path: &str) -> Vec<String> {
    let mut out = Vec::new();
    for part in path.split('.') {
        let mut p = part;
        while let Some(i) = p.find('[') {
            if i > 0 {
                out.push(p[..i].to_string());
            }
            let Some(j) = p[i..].find(']') else { break };
            out.push(p[i..i + j + 1].to_string());
            p = &p[i + j + 1..];
        }
        if !p.is_empty() {
            out.push(p.to_string());
        }
    }
    out
}

/// Is a contract path present? `[]` matches when any element has the rest. None when
/// that can't be told (an empty or missing list).
pub fn path_present(data: &Value, path: &str) -> Option<bool> {
    fn go(v: &Value, segs: &[String]) -> Option<bool> {
        let Some((head, rest)) = segs.split_first() else { return Some(true) };
        if head == "[]" {
            let Value::Array(a) = v else { return Some(false) };
            if a.is_empty() {
                return None;
            }
            let mut unknown = false;
            for item in a {
                match go(item, rest) {
                    Some(true) => return Some(true),
                    None => unknown = true,
                    _ => {}
                }
            }
            return if unknown { None } else { Some(false) };
        }
        if let Some(idx) = head.strip_prefix('[').and_then(|h| h.strip_suffix(']')) {
            let Value::Array(a) = v else { return Some(false) };
            let Ok(i) = idx.parse::<i64>() else { return Some(true) };
            let i = if i < 0 { i + a.len() as i64 } else { i };
            return match a.get(i as usize) {
                Some(x) => go(x, rest),
                None => Some(false),
            };
        }
        match v {
            Value::Object(m) => match m.get(head.as_str()) {
                // Present-but-null still counts: the station sent the field.
                Some(Value::Null) => Some(true),
                Some(x) => go(x, rest),
                None => Some(false),
            },
            Value::Array(_) if head == "length" => Some(true),
            Value::String(_) if head == "length" => Some(true),
            _ => Some(false),
        }
    }
    go(data, &segments(path))
}

/// Does a dotted/indexed path resolve in data? `a[]` means "any element".
pub fn path_resolves(data: &Value, path: &str) -> bool {
    path_present(data, path) != Some(false)
}

/// The JSON type at a contract path in sample data.
fn kind_at(data: &Value, path: &str) -> Option<&'static str> {
    fn go<'v>(v: &'v Value, segs: &[String]) -> Option<&'v Value> {
        let Some((head, rest)) = segs.split_first() else { return Some(v) };
        if head.starts_with('[') {
            let Value::Array(a) = v else { return None };
            return a.iter().find_map(|x| go(x, rest).filter(|x| !x.is_null()));
        }
        match v {
            Value::Object(m) => go(m.get(head.as_str())?, rest),
            _ => None,
        }
    }
    Some(match go(data, &segments(path))? {
        Value::Null => return None,
        Value::Bool(_) => "boolean",
        Value::Number(_) => "number",
        Value::String(_) => "string",
        Value::Array(_) => "array",
        Value::Object(_) => "object",
    })
}

// ---------------------------------------------------------------------------
// Data mapping
// ---------------------------------------------------------------------------

fn eval_in(root: &Value, src: &str) -> Value {
    let missing = RefCell::new(BTreeSet::new());
    Scope::new(root, &missing, "").eval_str(src).unwrap_or(Value::Null)
}

fn set_path(target: &mut Value, path: &str, value: Value) {
    let parts: Vec<&str> = path.split('.').collect();
    let mut cur = target;
    for (i, p) in parts.iter().enumerate() {
        if !cur.is_object() {
            *cur = Value::Object(Default::default());
        }
        let Value::Object(m) = cur else { return };
        if i + 1 == parts.len() {
            m.insert(p.to_string(), value);
            return;
        }
        cur = m.entry(p.to_string()).or_insert_with(|| Value::Object(Default::default()));
    }
}

/// Call `f` on every element of the list at `list` (`results`, `channels[].readings`).
fn each_item(v: &mut Value, segs: &[String], f: &mut dyn FnMut(&mut Value)) {
    let Some((head, rest)) = segs.split_first() else {
        if let Value::Array(a) = v {
            a.iter_mut().for_each(f);
        }
        return;
    };
    if head == "[]" {
        if let Value::Array(a) = v {
            for x in a.iter_mut() {
                each_item(x, rest, f);
            }
        }
    } else if let Value::Object(m) = v {
        if let Some(x) = m.get_mut(head.as_str()) {
            each_item(x, rest, f);
        }
    }
}

/// Apply a template's `dataMap` (template path → data path or expression). Only fills
/// fields the data lacks, so data that already matches is never changed.
pub fn apply_data_map(map: &BTreeMap<String, String>, data: &Value) -> Value {
    if map.is_empty() {
        return data.clone();
    }
    let mut out = data.clone();
    for (need, have) in map.iter().filter(|(n, h)| !n.contains("[]") && !h.trim().is_empty()) {
        if path_present(&out, need) == Some(true) {
            continue;
        }
        let v = eval_in(data, have);
        if !v.is_null() {
            set_path(&mut out, need, v);
        }
    }
    // Item fields: `measurements[].value` ← `reading` (or `results[].reading`).
    let mut items: Vec<(&String, &String)> =
        map.iter().filter(|(n, h)| n.contains("[]") && !h.trim().is_empty()).collect();
    items.sort_by_key(|(n, _)| n.matches("[]").count());
    for (need, have) in items {
        let Some((list, field)) = need.rsplit_once("[].") else { continue };
        let rel = have.rsplit_once("[].").map(|(_, r)| r).unwrap_or(have).trim().to_string();
        let field = field.to_string();
        each_item(&mut out, &segments(list), &mut |item| {
            if path_present(item, &field) == Some(true) {
                return;
            }
            let v = eval_in(item, &rel);
            if !v.is_null() {
                set_path(item, &field, v);
            }
        });
    }
    out
}

/// A template path in the data's own names, following the `dataMap`.
pub fn to_data_name(map: &BTreeMap<String, String>, path: &str) -> String {
    let is_path = |s: &str| expr::parse(s).ok().and_then(|e| expr::path_of(&e)).is_some() || s.contains("[]");
    let mut best: Option<(&String, &String)> = None;
    for (need, have) in map {
        let matches =
            path == need || path.strip_prefix(need.as_str()).is_some_and(|r| r.starts_with('.') || r.starts_with('['));
        if matches && is_path(have.trim()) && best.is_none_or(|(n, _)| need.len() > n.len()) {
            best = Some((need, have));
        }
    }
    let Some((need, have)) = best else { return path.to_string() };
    let rest = &path[need.len()..];
    let have = have.trim();
    if let Some((list, _)) = need.rsplit_once("[].") {
        // Item field: the data's name is relative to the (possibly renamed) list.
        let list = to_data_name(map, list);
        let rel = have.rsplit_once("[].").map(|(_, r)| r).unwrap_or(have);
        return format!("{list}[].{rel}{rest}");
    }
    format!("{have}{rest}")
}

// ---------------------------------------------------------------------------
// Unknown keys
// ---------------------------------------------------------------------------

/// Keys the model writes only when set; their absence after a round trip is not a typo.
const OPTIONAL_KEYS: &[&str] = &[
    "visibleIf",
    "align",
    "color",
    "rowTone",
    "fontSize",
    "verdict",
    "repeat",
    "logo",
    "size",
    "weight",
    "italic",
    "mono",
    "watermark",
    "sampleData",
    "editor",
    "status",
    "labels",
    "vars",
    "dataMap",
    "lang",
    "id",
];

/// Keys in a template that the engine does not know (typos like `sorce`), which would
/// otherwise silently fall back to defaults.
pub fn unknown_keys(raw: &Value) -> Vec<Issue> {
    let Ok(doc) = serde_json::from_value::<Document>(raw.clone()) else { return Vec::new() };
    let Ok(round) = serde_json::to_value(&doc) else { return Vec::new() };
    let mut out = Vec::new();
    fn go(raw: &Value, known: &Value, block: &str, at: &str, out: &mut Vec<Issue>) {
        match (raw, known) {
            (Value::Object(r), Value::Object(k)) => {
                let block = match (r.get("type"), r.get("id")) {
                    (Some(_), Some(Value::String(id))) => id.as_str(),
                    _ => block,
                };
                let local_at = if r.contains_key("type") { "" } else { at };
                for (key, v) in r {
                    if matches!(key.as_str(), "sampleData" | "editor" | "labels" | "dataMap") {
                        continue;
                    }
                    let field = if local_at.is_empty() { key.clone() } else { format!("{local_at}.{key}") };
                    match k.get(key) {
                        Some(kv) => go(v, kv, block, &field, out),
                        None if OPTIONAL_KEYS.contains(&key.as_str()) => {}
                        None => {
                            let hint = expr::suggest(key, k.keys().map(String::as_str))
                                .map(|s| format!("; did you mean '{s}'?"))
                                .unwrap_or_default();
                            out.push(Issue {
                                severity: Severity::Warning,
                                block_id: block.to_string(),
                                field: field.clone(),
                                message: format!("unknown setting '{key}' is ignored{hint}"),
                            });
                        }
                    }
                }
            }
            (Value::Array(r), Value::Array(k)) => {
                for (i, (rv, kv)) in r.iter().zip(k.iter()).enumerate() {
                    let field = if at.is_empty() { format!("[{i}]") } else { format!("{at}[{i}]") };
                    // Block lists restart the field path at each block.
                    let is_block = rv.get("type").is_some();
                    go(rv, kv, block, if is_block { "" } else { &field }, out);
                }
            }
            _ => {}
        }
    }
    go(raw, &round, "", "", &mut out);
    out
}

/// Validate template JSON as written: model checks plus unknown keys.
pub fn validate_value(raw: &Value, doc: &Document, data: Option<&Value>) -> Report {
    let mut r = validate(doc, data);
    r.issues.extend(unknown_keys(raw));
    r
}

/// A JSON Schema (draft 2020-12) for the data a template needs, built from its
/// contract: the station's data can be checked against it, and typed structures
/// generated from it.
pub fn contract_schema(report: &Report, title: &str) -> Value {
    use serde_json::{json, Map};
    fn node<'a>(root: &'a mut Map<String, Value>, segs: &[String]) -> &'a mut Map<String, Value> {
        let mut cur = root;
        for s in segs {
            if s == "[]" {
                if cur.get("type").and_then(Value::as_str) != Some("array") {
                    cur.insert("type".into(), json!("array"));
                }
                let items = cur.entry("items").or_insert_with(|| json!({}));
                cur = items.as_object_mut().expect("items is an object");
            } else if s.starts_with('[') {
                continue;
            } else {
                cur.entry("type").or_insert_with(|| json!("object"));
                let props = cur.entry("properties").or_insert_with(|| json!({}));
                let props = props.as_object_mut().expect("properties is an object");
                let child = props.entry(s.clone()).or_insert_with(|| json!({}));
                cur = child.as_object_mut().expect("property is an object");
            }
        }
        cur
    }
    let mut root = Map::new();
    root.insert("$schema".into(), json!("https://json-schema.org/draft/2020-12/schema"));
    if !title.is_empty() {
        root.insert("title".into(), json!(format!("{title} data")));
    }
    root.insert("type".into(), json!("object"));
    for c in &report.contract {
        let segs = segments(&c.path);
        let leaf = node(&mut root, &segs);
        if c.kind != "any" && !leaf.contains_key("type") {
            leaf.insert("type".into(), json!(c.kind));
        }
        if c.kind == "any" && !leaf.contains_key("type") {
            leaf.insert("description".into(), json!("read by the template; type unknown without sample data"));
        }
        // A required field is required in its parent object, and so are its ancestors.
        if !c.optional {
            for end in 1..=segs.len() {
                let name = &segs[end - 1];
                if name.starts_with('[') {
                    continue;
                }
                let p = node(&mut root, &segs[..end - 1]);
                let req = p.entry("required").or_insert_with(|| json!([]));
                if let Value::Array(a) = req {
                    if !a.iter().any(|x| x == name) {
                        a.push(json!(name));
                    }
                }
            }
        }
    }
    Value::Object(root)
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
        assert_eq!(
            r.referenced_paths,
            vec!["channels", "channels[].name", "dut.serial", "results", "results[].name", "station"]
        );
    }

    #[test]
    fn row_fields_are_checked_against_the_data() {
        let d = doc(json!([
            {"id": "t", "type": "table", "source": "results", "columns": [
                {"header": "V", "value": "row.vaule"},
                {"header": "N", "value": "row.note ?? ''"}
            ]},
            {"id": "m", "type": "measurementTable", "source": "results", "fields": {"value": "reading"}}
        ]));
        let data = json!({"results": [{"value": 1, "low": 0}, {"value": 2}]});
        let r = validate(&d, Some(&data));
        let msgs: Vec<_> =
            r.issues.iter().map(|i| (i.block_id.as_str(), i.field.as_str(), i.message.as_str())).collect();
        assert!(msgs.contains(&(
            "t",
            "columns[0].value",
            "data field 'results[].vaule' is missing; did you mean 'results[].value'?"
        )));
        assert!(msgs.contains(&("m", "fields.value", "data field 'results[].reading' is missing")));
        // Optional reads and optional measurement columns are not reported.
        assert_eq!(msgs.len(), 2, "{msgs:?}");
    }

    #[test]
    fn unknown_functions_and_bodies() {
        let d = doc(json!([
            {"id": "a", "type": "text", "text": "{{ fixd(x, 2) }}"},
            {"id": "b", "type": "text", "text": "{{ each(list, 'it.v *') }}"}
        ]));
        let r = validate(&d, None);
        let a = r.issues.iter().find(|i| i.block_id == "a").unwrap();
        assert!(a.message.contains("did you mean fixed()"), "{}", a.message);
        let b = r.issues.iter().find(|i| i.block_id == "b").unwrap();
        assert_eq!(b.severity, Severity::Error);
    }

    #[test]
    fn missing_fields_point_at_the_block_and_suggest() {
        let d = doc(json!([{"id": "k", "type": "keyValue", "items": [{"label": "SN", "value": "{{ dut.serail }}"}]}]));
        let r = validate(&d, Some(&json!({"dut": {"serial": "A"}})));
        let i = &r.issues[0];
        assert_eq!((i.block_id.as_str(), i.field.as_str()), ("k", "items[0].value"));
        assert!(i.message.ends_with("did you mean 'dut.serial'?"), "{}", i.message);
    }

    #[test]
    fn bare_paths_in_text_fields_are_flagged() {
        let d = doc(json!([{"id": "k", "type": "keyValue", "items": [{"label": "SN", "value": "dut.serial"}]}]));
        let r = validate(&d, Some(&json!({"dut": {"serial": "A"}})));
        assert!(r.issues.iter().any(|i| i.message.contains("{{ dut.serial }}")), "{:?}", r.issues);
    }

    #[test]
    fn unknown_keys_are_reported() {
        let raw = json!({"body": [
            {"id": "t", "type": "table", "sorce": "x", "columns": [{"header": "A", "valeu": "row.a"}]}
        ]});
        let issues = unknown_keys(&raw);
        let msgs: Vec<_> = issues.iter().map(|i| (i.block_id.as_str(), i.field.as_str(), i.message.as_str())).collect();
        assert!(
            msgs.contains(&("t", "sorce", "unknown setting 'sorce' is ignored; did you mean 'source'?")),
            "{msgs:?}"
        );
        assert!(msgs.iter().any(|m| m.1 == "columns[0].valeu"), "{msgs:?}");
        // A clean template has none.
        let clean = json!({"body": [{"type": "text", "text": "x", "visibleIf": "a"}]});
        assert!(unknown_keys(&clean).is_empty());
    }

    #[test]
    fn vars_are_in_scope_and_validated() {
        let d = Document::from_json(
            &json!({
                "vars": [{"name": "fails", "value": "count_if(results, 'status', 'FAIL')"}, {"name": "any", "value": "fails > 0"}],
                "body": [{"type": "text", "text": "{{ fails }} {{ any }}"}]
            })
            .to_string(),
        )
        .unwrap();
        let r = validate(&d, Some(&json!({"results": []})));
        assert!(r.issues.is_empty(), "{:?}", r.issues);
        assert_eq!(r.referenced_paths, vec!["results", "results[].status"]);
    }

    #[test]
    fn data_map_fills_and_renames() {
        let map: BTreeMap<String, String> =
            [("dut.serial", "uut.sn"), ("measurements", "results"), ("measurements[].value", "reading")]
                .into_iter()
                .map(|(a, b)| (a.to_string(), b.to_string()))
                .collect();
        let data = json!({"uut": {"sn": "X"}, "results": [{"reading": 1.5}]});
        let out = apply_data_map(&map, &data);
        assert_eq!(out["dut"]["serial"], "X");
        assert_eq!(out["measurements"][0]["value"], 1.5);
        assert_eq!(to_data_name(&map, "measurements[].value"), "results[].reading");
        assert_eq!(to_data_name(&map, "measurements[].low"), "results[].low");
        assert_eq!(to_data_name(&map, "dut.serial"), "uut.sn");
        // Data that already matches is left alone.
        let same = json!({"dut": {"serial": "Y"}});
        assert_eq!(apply_data_map(&map, &same)["dut"]["serial"], "Y");
    }

    #[test]
    fn contract_and_schema() {
        let d = doc(json!([
            {"type": "text", "text": "{{ dut.serial }} {{ note ?? '' }}"},
            {"type": "measurementTable", "source": "measurements"}
        ]));
        let data = json!({"dut": {"serial": "A"}, "measurements": [{"name": "v", "value": 1.0, "low": 0}]});
        let r = validate(&d, Some(&data));
        let c: Vec<_> = r.contract.iter().map(|c| (c.path.as_str(), c.optional, c.kind)).collect();
        assert!(c.contains(&("dut.serial", false, "string")));
        assert!(c.contains(&("note", true, "any")));
        assert!(c.contains(&("measurements[].value", false, "number")));
        assert!(c.contains(&("measurements[].low", true, "number")));
        let s = contract_schema(&r, "T");
        assert_eq!(s["properties"]["measurements"]["type"], "array");
        assert_eq!(s["properties"]["measurements"]["items"]["properties"]["value"]["type"], "number");
        assert_eq!(s["properties"]["measurements"]["items"]["required"], json!(["value"]));
        assert_eq!(s["properties"]["dut"]["required"], json!(["serial"]));
        assert_eq!(s["required"], json!(["dut", "measurements"]));
    }

    #[test]
    fn page_numbers_in_expressions_warn() {
        let d = doc(json!([{"id": "f", "type": "text", "text": "{{ page + 1 }}"}]));
        let r = validate(&d, None);
        assert!(r.issues.iter().any(|i| i.message.starts_with("page numbers")));
        let ok = doc(json!([{"type": "text", "text": "Page {{ page }} of {{ pages }}"}]));
        assert!(validate(&ok, None).issues.is_empty());
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
