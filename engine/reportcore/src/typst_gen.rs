//! Document + data → Typst source.
//!
//! All data evaluation happens here in Rust; the generated Typst code only
//! contains string *literals*, so user data can never inject markup or code.
//! The generated source is in code mode: every block becomes one content
//! expression.

use crate::charts::{self, ChartData, LimitData, SeriesData, XVal};
use crate::codes;
use crate::expr::{self, as_num, to_text, verdict_of, Scope, Segment};
use crate::model::*;
use crate::validate::{Issue, Severity};
use base64::Engine as _;
use serde_json::{json, Value};
use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};
use std::fmt::Write;
use std::path::PathBuf;

const PT_PER_MM: f64 = 72.0 / 25.4;

/// Typst string literal (safe against injection).
pub fn lit(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for c in s.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '"' => out.push_str("\\\""),
            '\n' => out.push_str("\\n"),
            '\r' => {}
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => {
                let _ = write!(out, "\\u{{{:x}}}", c as u32);
            }
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

fn is_hex_color(s: &str) -> bool {
    let h = s.trim_start_matches('#');
    s.starts_with('#') && matches!(h.len(), 3 | 4 | 6 | 8) && h.chars().all(|c| c.is_ascii_hexdigit())
}

fn named_color(s: &str) -> Option<&'static str> {
    Some(match s.to_ascii_lowercase().as_str() {
        "black" => "#000000",
        "white" => "#ffffff",
        "red" => "#d1242f",
        "green" => "#1a7f37",
        "blue" => "#0a5dc2",
        "orange" => "#eb6834",
        "yellow" => "#eda100",
        "gray" | "grey" => "#6e6e73",
        _ => return None,
    })
}

fn num_lit(n: f64) -> String {
    let s = format!("{n:.3}");
    let s = s.trim_end_matches('0').trim_end_matches('.');
    if s.is_empty() || s == "-" || s == "-0" {
        "0".into()
    } else {
        s.to_string()
    }
}

#[derive(Debug, Clone, Default)]
pub struct GenOptions {
    pub base_dir: Option<PathBuf>,
    /// Editor preview: emit block position markers and placeholders.
    pub preview: bool,
    /// ISO timestamp used for `now()`; defaults to the current time.
    pub now: Option<String>,
}

pub struct Generated {
    pub source: String,
    pub files: BTreeMap<String, Vec<u8>>,
    pub issues: Vec<Issue>,
}

pub struct Generator<'a> {
    doc: &'a Document,
    t: &'a Theme,
    opts: &'a GenOptions,
    files: BTreeMap<String, Vec<u8>>,
    issues: Vec<Issue>,
    counter: usize,
    avail_pt: f64,
    in_container: usize,
}

/// Inline tokens for rich text.
enum Tok {
    Text(String),
    Code(String),
    Bold,
    Italic,
    Mono,
    Line,
    Par,
}

impl<'a> Generator<'a> {
    pub fn new(doc: &'a Document, opts: &'a GenOptions) -> Self {
        let (w, _) = doc.page.dimensions_mm();
        let m = &doc.page.margins;
        Self {
            doc,
            t: &doc.theme,
            opts,
            files: BTreeMap::new(),
            issues: Vec::new(),
            counter: 0,
            avail_pt: (w - m.left - m.right).max(20.0) * PT_PER_MM,
            in_container: 0,
        }
    }

    fn issue(&mut self, sev: Severity, id: &str, field: &str, msg: impl Into<String>) {
        let msg = msg.into();
        if self.issues.iter().any(|i| i.block_id == id && i.field == field && i.message == msg) {
            return;
        }
        self.issues.push(Issue { severity: sev, block_id: id.into(), field: field.into(), message: msg });
    }

    fn color(&self, c: &str, fallback: &str) -> String {
        let c = c.trim();
        let resolved = match c.to_ascii_lowercase().as_str() {
            "pass" => self.t.pass_color.as_str(),
            "fail" => self.t.fail_color.as_str(),
            "warn" => self.t.warn_color.as_str(),
            "accent" => self.t.accent_color.as_str(),
            "muted" => self.t.muted_color.as_str(),
            "text" => self.t.text_color.as_str(),
            _ => c,
        };
        if is_hex_color(resolved) {
            format!("rgb({})", lit(resolved))
        } else if let Some(n) = named_color(resolved) {
            format!("rgb({})", lit(n))
        } else if is_hex_color(fallback) {
            format!("rgb({})", lit(fallback))
        } else {
            "black".into()
        }
    }

    fn verdict_color(&self, v: &str) -> String {
        match v {
            "PASS" => self.color(&self.t.pass_color, "#1a7f37"),
            "FAIL" => self.color(&self.t.fail_color, "#d1242f"),
            "WARN" => self.color(&self.t.warn_color, "#9a6700"),
            _ => self.color(&self.t.muted_color, "#6e6e73"),
        }
    }

    fn file(&mut self, prefix: &str, ext: &str, bytes: Vec<u8>) -> String {
        self.counter += 1;
        let name = format!("{prefix}-{}.{ext}", self.counter);
        self.files.insert(name.clone(), bytes);
        name
    }

    // ---------------------------------------------------------------------
    // Evaluation helpers
    // ---------------------------------------------------------------------

    fn eval(&mut self, scope: &Scope, src: &str, id: &str, field: &str) -> Value {
        if src.trim().is_empty() {
            return Value::Null;
        }
        match scope.eval_binding(src) {
            Ok(v) => v,
            Err(e) => {
                self.issue(Severity::Error, id, field, e.to_string());
                Value::Null
            }
        }
    }

    fn text(&mut self, scope: &Scope, src: &str, id: &str, field: &str) -> String {
        if !expr::has_template(src) {
            return src.to_string();
        }
        match scope.render_template(src) {
            Ok(s) => s,
            Err(e) => {
                self.issue(Severity::Error, id, field, e.to_string());
                src.to_string()
            }
        }
    }

    fn num(&mut self, scope: &Scope, src: &str, id: &str, field: &str) -> Option<f64> {
        let v = self.eval(scope, src, id, field);
        as_num(&v)
    }

    /// Rich text → Typst content expression.
    fn rich(&mut self, scope: &Scope, src: &str, id: &str, field: &str) -> String {
        let segs = match expr::parse_template(src) {
            Ok(s) => s,
            Err(e) => {
                self.issue(Severity::Error, id, field, e.to_string());
                vec![Segment::Lit(src.to_string())]
            }
        };
        // Lex markdown over the whole string with expressions as placeholders,
        // so `**{{ x }}**` sees its neighbours across segment boundaries.
        let mut flat = String::new();
        let mut values: Vec<Tok> = Vec::new();
        for seg in segs {
            match seg {
                Segment::Lit(s) => flat.push_str(&s.replace(PLACEHOLDER, "")),
                Segment::Expr(raw, e) => {
                    let r = raw.trim();
                    values.push(if r == "page" {
                        Tok::Code("context counter(page).display(\"1\")".into())
                    } else if r == "pages" {
                        Tok::Code("context str(counter(page).final().first())".into())
                    } else {
                        Tok::Text(to_text(&scope.eval(&e)))
                    });
                    flat.push(PLACEHOLDER);
                }
            }
        }
        let mut toks = Vec::new();
        lex_markdown(&flat, &mut toks, &mut values.into_iter());
        build_inline(toks, self.t.font)
    }

    // ---------------------------------------------------------------------
    // Document
    // ---------------------------------------------------------------------

    pub fn generate(mut self, data: &Value) -> Generated {
        let missing = RefCell::new(BTreeSet::new());
        let now = self.opts.now.clone().unwrap_or_else(|| chrono::Local::now().fixed_offset().to_rfc3339());
        let base = Scope::new(data, &missing, &now);
        let report = json!({
            "name": self.doc.meta.name,
            "revision": self.doc.meta.revision,
            "author": self.doc.meta.author,
            "generatedAt": now,
        });
        let theme = json!({"company": self.t.company});
        let scope = base.with_many(vec![("report", report), ("theme", theme)]);

        let d = self.doc;
        let t = self.t;
        let (w, h) = d.page.dimensions_mm();
        let m = &d.page.margins;
        let mut src = String::new();
        src.push_str("// Generated by Report Builder. Do not edit.\n");
        let title = if d.meta.name.is_empty() { "Report".to_string() } else { d.meta.name.clone() };
        let _ = write!(src, "#set document(title: {}", lit(&title));
        if !d.meta.author.is_empty() {
            let _ = write!(src, ", author: {}", lit(&d.meta.author));
        }
        src.push_str(")\n");

        let header = self.region(&d.header, &scope);
        let footer = self.region(&d.footer, &scope);
        let background = match &d.watermark {
            Some(wm) => {
                let visible = match &wm.visible_if {
                    Some(c) if !c.trim().is_empty() => expr::truthy(&self.eval(&scope, c, "", "watermark.visibleIf")),
                    _ => true,
                };
                let text = self.text(&scope, &wm.text, "", "watermark.text");
                if visible && !text.trim().is_empty() {
                    let alpha = ((1.0 - wm.opacity.clamp(0.0, 1.0)) * 100.0).round();
                    format!(
                        "rotate({}deg, text(size: {}pt, weight: \"bold\", fill: {}.transparentize({}%), {}))",
                        num_lit(wm.angle),
                        num_lit(wm.size.clamp(8.0, 400.0)),
                        self.color(&wm.color, "#d1242f"),
                        num_lit(alpha),
                        lit(&text)
                    )
                } else {
                    "none".into()
                }
            }
            None => "none".into(),
        };
        let _ = writeln!(
            src,
            "#set page(width: {}mm, height: {}mm, margin: (top: {}mm, right: {}mm, bottom: {}mm, left: {}mm), header-ascent: 35%, footer-descent: 35%, header: {}, footer: {}, background: {})",
            num_lit(w),
            num_lit(h),
            num_lit(m.top),
            num_lit(m.right),
            num_lit(m.bottom),
            num_lit(m.left),
            if header.is_empty() { "none".into() } else { format!("{{ set text(size: 0.9em); {header} }}") },
            if footer.is_empty() { "none".into() } else { format!("{{ set text(size: 0.85em); {footer} }}") },
            background
        );
        let _ = writeln!(
            src,
            "#set text(font: ({}, \"Inter\", \"DejaVu Sans Mono\"), size: {}pt, fill: {}, lang: \"en\")",
            lit(t.font.typst_name()),
            num_lit(t.font_size.clamp(5.0, 24.0)),
            self.color(&t.text_color, "#1d1d1f")
        );
        src.push_str("#set par(leading: 0.62em, spacing: 0.95em, justify: false)\n");
        src.push_str("#set block(spacing: 10pt)\n");
        src.push_str("#show table: set text(number-width: \"tabular\")\n");
        src.push_str("#show heading: set block(above: 14pt, below: 8pt)\n");
        src.push_str("#show heading: set text(weight: \"semibold\")\n");
        src.push_str("#show heading.where(level: 1): set text(size: 1.9em, tracking: -0.015em)\n");
        src.push_str("#show heading.where(level: 2): set text(size: 1.3em, tracking: -0.01em)\n");
        src.push_str("#show heading.where(level: 3): set text(size: 1.08em)\n");
        let body = self.blocks(&d.body, &scope, true);
        src.push_str("#{\n");
        src.push_str(&body);
        src.push_str("}\n");

        for p in missing.into_inner() {
            if matches!(p.as_str(), "page" | "pages") {
                continue;
            }
            self.issue(Severity::Warning, "", "", format!("data field '{p}' is missing"));
        }
        Generated { source: src, files: self.files, issues: self.issues }
    }

    fn region(&mut self, blocks: &[Block], scope: &Scope) -> String {
        if blocks.is_empty() {
            return String::new();
        }
        self.in_container += 1;
        let s = self.blocks(blocks, scope, false);
        self.in_container -= 1;
        s.trim().to_string()
    }

    fn blocks(&mut self, blocks: &[Block], scope: &Scope, mark: bool) -> String {
        let mut out = String::new();
        for b in blocks {
            let c = self.block(b, scope);
            if c.is_empty() {
                continue;
            }
            if mark && self.opts.preview {
                let _ = writeln!(out, "[#metadata({}) <rb-start>]", lit(&b.id));
                let _ = writeln!(out, "{c}");
                let _ = writeln!(out, "[#metadata({}) <rb-end>]", lit(&b.id));
            } else {
                let _ = writeln!(out, "{c}");
            }
        }
        out
    }

    fn block(&mut self, b: &Block, scope: &Scope) -> String {
        if let Some(cond) = &b.visible_if {
            if !cond.trim().is_empty() {
                let v = self.eval(scope, cond, &b.id, "visibleIf");
                if !expr::truthy(&v) {
                    return String::new();
                }
            }
        }
        let id = b.id.as_str();
        match &b.kind {
            BlockKind::Heading(h) => {
                let body = self.rich(scope, &h.text, id, "text");
                let level = h.level.clamp(1, 3);
                let mut c = format!("heading(level: {level}, outlined: false, {body})");
                if let Some(col) = &h.color {
                    c = format!("text(fill: {}, {c})", self.color(col, &self.t.text_color));
                }
                if let Some(a) = h.align {
                    if a != Align::Left {
                        c = format!("align({}, {c})", a.typst());
                    }
                }
                c
            }
            BlockKind::Text(tx) => {
                let body = self.rich(scope, &tx.text, id, "text");
                let s = &tx.style;
                let mut args = Vec::new();
                if let Some(sz) = s.size {
                    args.push(format!("size: {}pt", num_lit(sz.clamp(4.0, 96.0))));
                }
                if let Some(w) = s.weight {
                    args.push(format!("weight: \"{}\"", w.typst()));
                }
                if let Some(col) = &s.color {
                    args.push(format!("fill: {}", self.color(col, &self.t.text_color)));
                }
                if s.italic {
                    args.push("style: \"italic\"".into());
                }
                if s.mono {
                    args.push("font: \"DejaVu Sans Mono\"".into());
                }
                let inner = if args.is_empty() { body } else { format!("text({}, {body})", args.join(", ")) };
                let align = s.align.unwrap_or_default();
                format!("block(width: 100%, align({}, par({inner})))", align.typst())
            }
            BlockKind::Image(img) => self.image(scope, b, img),
            BlockKind::Logo(l) => match self.t.logo.clone() {
                Some(src) if !src.trim().is_empty() => match self.load_image(&src) {
                    Ok(name) => format!(
                        "align({}, image({}, height: {}mm))",
                        l.align.typst(),
                        lit(&name),
                        num_lit(l.height_mm.clamp(2.0, 100.0))
                    ),
                    Err(e) => {
                        self.issue(Severity::Warning, id, "theme.logo", e);
                        self.placeholder("Logo", l.height_mm)
                    }
                },
                _ => {
                    if self.opts.preview {
                        self.placeholder("Logo — set it in Brand", l.height_mm)
                    } else {
                        String::new()
                    }
                }
            },
            BlockKind::Table(tb) => self.table(scope, b, tb),
            BlockKind::MeasurementTable(mt) => self.measurement_table(scope, b, mt),
            BlockKind::KeyValue(kv) => self.key_value(scope, b, kv),
            BlockKind::Summary(s) => self.summary(scope, b, s),
            BlockKind::Status(s) => self.status(scope, b, s),
            BlockKind::Callout(c) => {
                let (color, tint) = match c.tone {
                    Tone::Info => (self.color(&self.t.accent_color, "#0a5dc2"), 92),
                    Tone::Pass => (self.color(&self.t.pass_color, "#1a7f37"), 92),
                    Tone::Warn => (self.color(&self.t.warn_color, "#9a6700"), 90),
                    Tone::Fail => (self.color(&self.t.fail_color, "#d1242f"), 92),
                };
                let mut parts = Vec::new();
                if !c.title.trim().is_empty() {
                    let title = self.rich(scope, &c.title, id, "title");
                    parts.push(format!("text(weight: \"semibold\", fill: {color}, {title})"));
                }
                if !c.text.trim().is_empty() {
                    parts.push(self.rich(scope, &c.text, id, "text"));
                }
                format!(
                    "block(width: 100%, fill: {color}.lighten({tint}%), stroke: (left: 2.5pt + {color}), radius: (right: 4pt), inset: (x: 11pt, y: 9pt), stack(spacing: 5pt, {}))",
                    parts.join(", ")
                )
            }
            BlockKind::Chart(ch) => self.chart(scope, b, ch),
            BlockKind::Gauge(g) => {
                let value = self.num(scope, &g.value, id, "value");
                let min = self.num(scope, &g.min, id, "min").unwrap_or(0.0);
                let max = self.num(scope, &g.max, id, "max").unwrap_or(100.0);
                let low = self.num(scope, &g.low, id, "low");
                let high = self.num(scope, &g.high, id, "high");
                let text = match value {
                    Some(v) => format!("{} {}", expr::fixed(v, g.decimals as usize), g.unit).trim().to_string(),
                    None => "—".into(),
                };
                let label = self.text(scope, &g.label, id, "label");
                let svg = codes::gauge_svg(
                    &codes::GaugeData { value, min, max, low, high, text: &text, label: &label },
                    self.t,
                );
                let name = self.file("gauge", "svg", svg.into_bytes());
                format!("image({}, width: {}mm)", lit(&name), num_lit(g.size_mm.clamp(15.0, 160.0)))
            }
            BlockKind::Progress(p) => {
                let v = self.num(scope, &p.value, id, "value");
                let max = self.num(scope, &p.max, id, "max").unwrap_or(100.0);
                let pct = match v {
                    Some(v) if max != 0.0 => (v / max * 100.0).clamp(0.0, 100.0),
                    _ => 0.0,
                };
                let label = self.rich(scope, &p.label, id, "label");
                let color = self.color(p.color.as_deref().unwrap_or(&self.t.accent_color), "#0a5dc2");
                let value_text = if p.show_value { lit(&format!("{} %", expr::fixed(pct, 0))) } else { "[]".into() };
                format!(
                    "block(width: 100%, breakable: false, stack(spacing: 4pt, grid(columns: (1fr, auto), {label}, text(fill: {}, {value_text})), block(width: 100%, height: 6pt, radius: 3pt, fill: rgb(\"#e8e8ed\"), clip: true, align(left, rect(width: {}%, height: 100%, radius: 3pt, fill: {color})))))",
                    self.color(&self.t.muted_color, "#6e6e73"),
                    num_lit(pct)
                )
            }
            BlockKind::QrCode(q) => {
                let value = self.text(scope, &q.value, id, "value");
                if value.trim().is_empty() {
                    if self.opts.preview {
                        return self.placeholder("QR code — no value", q.size_mm);
                    }
                    self.issue(Severity::Warning, id, "value", "QR code value is empty");
                    return String::new();
                }
                match codes::qr_svg(&value) {
                    Ok(svg) => {
                        let name = self.file("qr", "svg", svg.into_bytes());
                        let caption = self.text(scope, &q.caption, id, "caption");
                        let img = format!("image({}, width: {}mm)", lit(&name), num_lit(q.size_mm.clamp(8.0, 120.0)));
                        let body = if caption.trim().is_empty() {
                            img
                        } else {
                            format!(
                                "stack(spacing: 3pt, {img}, text(size: 0.8em, fill: {}, {}))",
                                self.color(&self.t.muted_color, "#6e6e73"),
                                lit(&caption)
                            )
                        };
                        format!("align({}, {body})", q.align.typst())
                    }
                    Err(e) => {
                        self.issue(Severity::Warning, id, "value", e);
                        String::new()
                    }
                }
            }
            BlockKind::Barcode(bc) => {
                let value = self.text(scope, &bc.value, id, "value");
                if value.trim().is_empty() {
                    if self.opts.preview {
                        return self.placeholder("Barcode — no value", bc.height_mm);
                    }
                    self.issue(Severity::Warning, id, "value", "barcode value is empty");
                    return String::new();
                }
                match codes::barcode_bits(&value, bc.format) {
                    Ok(bits) => {
                        let svg = codes::barcode_svg(&bits);
                        let name = self.file("barcode", "svg", svg.into_bytes());
                        let w = bc.width_mm.clamp(10.0, 200.0);
                        let img = format!(
                            "image({}, width: {}mm, height: {}mm, fit: \"stretch\")",
                            lit(&name),
                            num_lit(w),
                            num_lit(bc.height_mm.clamp(4.0, 80.0))
                        );
                        let body = if bc.show_text {
                            format!(
                                "box(width: {}mm, stack(spacing: 2pt, {img}, align(center, text(font: \"DejaVu Sans Mono\", size: 8pt, {}))))",
                                num_lit(w),
                                lit(&value)
                            )
                        } else {
                            img
                        };
                        format!("align({}, {body})", bc.align.typst())
                    }
                    Err(e) => {
                        self.issue(Severity::Warning, id, "value", e);
                        String::new()
                    }
                }
            }
            BlockKind::Signatures(sg) => {
                if sg.entries.is_empty() {
                    return String::new();
                }
                let muted = self.color(&self.t.muted_color, "#6e6e73");
                let text_c = self.color(&self.t.text_color, "#1d1d1f");
                let mut cells = Vec::new();
                for (i, e) in sg.entries.iter().enumerate() {
                    let role = self.text(scope, &e.role, id, &format!("entries[{i}].role"));
                    let name = self.text(scope, &e.name, id, &format!("entries[{i}].name"));
                    let mut parts = vec![
                        "v(26pt)".to_string(),
                        format!("line(length: 100%, stroke: 0.6pt + {text_c})"),
                        format!("text(size: 0.85em, weight: \"semibold\", {})", lit(&role)),
                    ];
                    if !name.trim().is_empty() {
                        parts.push(format!("text(size: 0.85em, fill: {muted}, {})", lit(&name)));
                    }
                    if sg.show_date {
                        parts.push(format!("text(size: 0.8em, fill: {muted}, \"Date\")"));
                    }
                    cells.push(format!("stack(spacing: 4pt, {})", parts.join(", ")));
                }
                format!(
                    "block(width: 100%, breakable: false, grid(columns: ({}), column-gutter: 18pt, {}))",
                    vec!["1fr"; cells.len()].join(", "),
                    cells.join(", ")
                )
            }
            BlockKind::Divider(dv) => format!(
                "line(length: 100%, stroke: {}pt + {})",
                num_lit(dv.thickness.clamp(0.1, 10.0)),
                self.color(dv.color.as_deref().unwrap_or(&self.t.border_color), "#d2d2d7")
            ),
            BlockKind::Spacer(sp) => format!("v({}mm)", num_lit(sp.height_mm.clamp(0.0, 300.0))),
            BlockKind::PageBreak(_) => {
                if self.in_container > 0 {
                    self.issue(
                        Severity::Warning,
                        id,
                        "",
                        "page breaks inside boxed sections, columns, headers or footers are ignored",
                    );
                    String::new()
                } else {
                    "pagebreak(weak: true)".into()
                }
            }
            BlockKind::Columns(cols) => {
                if cols.columns.is_empty() {
                    return String::new();
                }
                let total: f64 = cols.columns.iter().map(|c| c.width.max(0.1)).sum();
                let gap_pt = cols.gap_mm.clamp(0.0, 50.0) * PT_PER_MM;
                let outer = self.avail_pt;
                let usable = (outer - gap_pt * (cols.columns.len() as f64 - 1.0)).max(20.0);
                self.in_container += 1;
                let mut cells = Vec::new();
                for c in &cols.columns {
                    self.avail_pt = usable * c.width.max(0.1) / total;
                    let inner = self.blocks(&c.blocks, scope, true);
                    cells.push(format!("{{\n{inner}}}"));
                }
                self.in_container -= 1;
                self.avail_pt = outer;
                format!(
                    "grid(columns: ({}), column-gutter: {}mm, {})",
                    cols.columns
                        .iter()
                        .map(|c| format!("{}fr", num_lit(c.width.max(0.1))))
                        .collect::<Vec<_>>()
                        .join(", "),
                    num_lit(cols.gap_mm.clamp(0.0, 50.0)),
                    cells.join(", ")
                )
            }
            BlockKind::Section(sec) => self.section(scope, b, sec),
        }
    }

    fn placeholder(&self, label: &str, height_mm: f64) -> String {
        format!(
            "block(width: 100%, height: {}mm, fill: rgb(\"#f5f5f7\"), stroke: (paint: rgb(\"#c7c7cc\"), thickness: 0.6pt, dash: \"dashed\"), radius: 4pt, align(center + horizon, text(size: 0.85em, fill: rgb(\"#8e8e93\"), {})))",
            num_lit(height_mm.clamp(6.0, 200.0)),
            lit(label)
        )
    }

    fn load_image(&mut self, src: &str) -> Result<String, String> {
        let src = src.trim();
        if let Some(rest) = src.strip_prefix("data:") {
            let (meta, payload) = rest.split_once(',').ok_or("malformed data URI")?;
            let mime = meta.split(';').next().unwrap_or("");
            let ext = match mime {
                "image/png" => "png",
                "image/jpeg" | "image/jpg" => "jpg",
                "image/gif" => "gif",
                "image/svg+xml" => "svg",
                "image/webp" => "webp",
                other => return Err(format!("unsupported image type '{other}'")),
            };
            let bytes = if meta.ends_with(";base64") {
                base64::engine::general_purpose::STANDARD
                    .decode(payload.trim())
                    .map_err(|e| format!("invalid base64 image data: {e}"))?
            } else {
                payload.as_bytes().to_vec()
            };
            return Ok(self.file("img", ext, bytes));
        }
        if src.starts_with("http://") || src.starts_with("https://") {
            return Err("remote images are not supported offline; embed the image instead".into());
        }
        let path = PathBuf::from(src);
        let path = if path.is_absolute() {
            path
        } else {
            match &self.opts.base_dir {
                Some(b) => b.join(path),
                None => path,
            }
        };
        let bytes = std::fs::read(&path).map_err(|e| format!("cannot read image '{}': {e}", path.display()))?;
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_ascii_lowercase())
            .filter(|e| matches!(e.as_str(), "png" | "jpg" | "jpeg" | "gif" | "svg" | "webp"))
            .ok_or_else(|| format!("unsupported image file '{}'", path.display()))?;
        Ok(self.file("img", &ext, bytes))
    }

    fn image(&mut self, scope: &Scope, b: &Block, img: &Image) -> String {
        let src = self.text(scope, &img.src, &b.id, "src");
        if src.trim().is_empty() {
            return if self.opts.preview { self.placeholder("Image", 30.0) } else { String::new() };
        }
        match self.load_image(&src) {
            Ok(name) => {
                let mut body = format!("image({}, width: {}%)", lit(&name), num_lit(img.width.clamp(1.0, 100.0)));
                let cap = self.text(scope, &img.caption, &b.id, "caption");
                if !cap.trim().is_empty() {
                    body = format!(
                        "stack(spacing: 4pt, {body}, text(size: 0.8em, fill: {}, {}))",
                        self.color(&self.t.muted_color, "#6e6e73"),
                        lit(&cap)
                    );
                }
                format!("align({}, {body})", img.align.typst())
            }
            Err(e) => {
                self.issue(Severity::Warning, &b.id, "src", e);
                self.placeholder("Image unavailable", 20.0)
            }
        }
    }

    fn rows(&mut self, scope: &Scope, src: &str, id: &str) -> Vec<Value> {
        match self.eval(scope, src, id, "source") {
            Value::Array(a) => a,
            Value::Null => Vec::new(),
            Value::Object(o) => vec![Value::Object(o)],
            other => {
                self.issue(Severity::Warning, id, "source", format!("expected a list but got '{}'", to_text(&other)));
                Vec::new()
            }
        }
    }

    fn tint_for(&self, tone: &Value) -> Option<String> {
        let v = verdict_of(tone);
        match v {
            "FAIL" => Some(format!("{}.lighten(88%)", self.color(&self.t.fail_color, "#d1242f"))),
            "WARN" => Some(format!("{}.lighten(85%)", self.color(&self.t.warn_color, "#9a6700"))),
            "PASS" => None,
            _ => match tone {
                Value::String(s) if is_hex_color(s.trim()) || named_color(s.trim()).is_some() => {
                    Some(self.color(s, "#ffffff"))
                }
                _ => None,
            },
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn emit_table(
        &self,
        widths: &[String],
        aligns: &[Align],
        header: &[String],
        rows: Vec<(Vec<String>, Option<String>)>,
        zebra: bool,
        repeat: bool,
        empty: &str,
        font_size: Option<f64>,
    ) -> String {
        let n = widths.len().max(1);
        let border = self.color(&self.t.border_color, "#d2d2d7");
        let rule = self.color(&self.t.text_color, "#1d1d1f");
        let surface = self.color(&self.t.surface_color, "#f5f5f7");
        let mut s = String::new();
        let _ = write!(
            s,
            "table(columns: ({}), align: ({}), inset: (x: 5pt, y: 3.6pt), stroke: (x, y) => if y == 0 {{ (bottom: 0.7pt + {rule}) }} else {{ (bottom: 0.4pt + {border}) }}, fill: (x, y) => if y == 0 {{ {surface} }} else if {} and calc.even(y) {{ rgb(\"#fafafc\") }} else {{ none }}",
            widths.join(", ") + if n == 1 { "," } else { "" },
            aligns.iter().map(|a| format!("{} + horizon", a.typst())).collect::<Vec<_>>().join(", ") + if n == 1 { "," } else { "" },
            if zebra { "true" } else { "false" }
        );
        let _ = write!(
            s,
            ", table.header(repeat: {repeat}, {})",
            header.iter().map(|h| format!("text(weight: \"semibold\", {})", lit(h))).collect::<Vec<_>>().join(", ")
        );
        if rows.is_empty() {
            let _ = write!(
                s,
                ", table.cell(colspan: {n}, align: center, text(fill: {}, {}))",
                self.color(&self.t.muted_color, "#6e6e73"),
                lit(empty)
            );
        }
        for (cells, fill) in rows {
            for c in cells {
                match &fill {
                    Some(f) => {
                        let _ = write!(s, ", table.cell(fill: {f}, {c})");
                    }
                    None => {
                        let _ = write!(s, ", {c}");
                    }
                }
            }
        }
        s.push(')');
        match font_size {
            Some(sz) => format!("text(size: {}pt, {s})", num_lit(sz.clamp(4.0, 30.0))),
            None => s,
        }
    }

    fn col_width(w: &str) -> String {
        let w = w.trim();
        let ok = w == "auto"
            || w.strip_suffix("fr").is_some_and(|n| n.parse::<f64>().is_ok())
            || w.strip_suffix("mm").is_some_and(|n| n.parse::<f64>().is_ok())
            || w.strip_suffix('%').is_some_and(|n| n.parse::<f64>().is_ok())
            || w.strip_suffix("pt").is_some_and(|n| n.parse::<f64>().is_ok());
        if ok {
            w.to_string()
        } else {
            "auto".into()
        }
    }

    fn table(&mut self, scope: &Scope, b: &Block, tb: &Table) -> String {
        let id = b.id.as_str();
        let rows = self.rows(scope, &tb.source, id);
        let mut columns = tb.columns.clone();
        if columns.is_empty() {
            if let Some(Value::Object(first)) = rows.first() {
                columns = first
                    .keys()
                    .map(|k| TableColumn {
                        header: k.clone(),
                        value: format!("row[{}]", json!(k)),
                        ..Default::default()
                    })
                    .collect();
            }
        }
        if columns.is_empty() {
            columns.push(TableColumn { header: "Value".into(), value: "row".into(), ..Default::default() });
        }
        let parsed: Vec<Result<expr::Expr, expr::ExprError>> = columns.iter().map(|c| expr::parse(&c.value)).collect();
        for (i, p) in parsed.iter().enumerate() {
            if let Err(e) = p {
                self.issue(Severity::Error, id, &format!("columns[{i}].value"), e.to_string());
            }
        }
        let tone = tb.row_tone.as_ref().filter(|t| !t.trim().is_empty()).map(|t| expr::parse(t));
        if let Some(Err(e)) = &tone {
            self.issue(Severity::Error, id, "rowTone", e.to_string());
        }
        let header: Vec<String> = columns
            .iter()
            .enumerate()
            .map(|(i, c)| self.text(scope, &c.header, id, &format!("columns[{i}].header")))
            .collect();
        let mut out_rows = Vec::with_capacity(rows.len());
        for (i, row) in rows.iter().enumerate() {
            let rs = scope.with_many(vec![
                ("row", row.clone()),
                ("index", expr::num(i as f64)),
                ("number", expr::num(i as f64 + 1.0)),
            ]);
            let cells = parsed
                .iter()
                .map(|p| match p {
                    Ok(e) => {
                        let text = to_text(&rs.eval(e));
                        // Verdict words get the same treatment as measurement tables.
                        match text.trim().to_ascii_uppercase().as_str() {
                            v @ ("PASS" | "FAIL" | "WARN" | "PASSED" | "FAILED") => format!(
                                "text(weight: \"bold\", size: 0.9em, fill: {}, {})",
                                self.verdict_color(verdict_of(&Value::String(v.into()))),
                                lit(&text)
                            ),
                            _ => lit(&text),
                        }
                    }
                    Err(_) => "[]".into(),
                })
                .collect();
            let fill = match &tone {
                Some(Ok(e)) => self.tint_for(&rs.eval(e)),
                _ => None,
            };
            out_rows.push((cells, fill));
        }
        let widths: Vec<String> = columns.iter().map(|c| Self::col_width(&c.width)).collect();
        let aligns: Vec<Align> = columns.iter().map(|c| c.align).collect();
        let empty = self.text(scope, &tb.empty_text, id, "emptyText");
        self.emit_table(&widths, &aligns, &header, out_rows, tb.zebra, tb.repeat_header, &empty, tb.font_size)
    }

    fn measurement_table(&mut self, scope: &Scope, b: &Block, mt: &MeasurementTable) -> String {
        let id = b.id.as_str();
        let rows = self.rows(scope, &mt.source, id);
        let f = &mt.fields;
        let dec = mt.decimals.min(12) as usize;
        let mut widths = Vec::new();
        let mut aligns = Vec::new();
        let mut header = Vec::new();
        let mut push = |w: &str, a: Align, h: &str| {
            widths.push(w.to_string());
            aligns.push(a);
            header.push(h.to_string());
        };
        if mt.show_index {
            push("auto", Align::Right, "#");
        }
        push("1fr", Align::Left, "Parameter");
        if mt.show_nominal {
            push("auto", Align::Right, "Nominal");
        }
        if mt.show_limits {
            push("auto", Align::Right, "Low limit");
        }
        push("auto", Align::Right, "Measured");
        if mt.show_limits {
            push("auto", Align::Right, "High limit");
        }
        if mt.show_unit {
            push("auto", Align::Left, "Unit");
        }
        if mt.show_status {
            push("auto", Align::Center, "Result");
        }
        let fmt = |v: &Value| -> String {
            match v {
                Value::Number(n) => expr::fixed(n.as_f64().unwrap_or(0.0), dec),
                Value::String(s) => match s.trim().parse::<f64>() {
                    Ok(n) if !s.trim().is_empty() => expr::fixed(n, dec),
                    _ => s.clone(),
                },
                Value::Null => String::new(),
                other => to_text(other),
            }
        };
        let get = |row: &Value, key: &str| -> Value {
            if key.is_empty() {
                return Value::Null;
            }
            match row {
                Value::Object(m) => m.get(key).cloned().unwrap_or(Value::Null),
                _ => Value::Null,
            }
        };
        let mut out = Vec::new();
        let mut shown = 0usize;
        for row in rows.iter() {
            let value = get(row, &f.value);
            let low = get(row, &f.low);
            let high = get(row, &f.high);
            let explicit = verdict_of(&get(row, &f.status));
            let verdict = if !explicit.is_empty() {
                explicit
            } else {
                expr::limit_verdict(as_num(&value), as_num(&low), as_num(&high))
            };
            if mt.failures_only && verdict != "FAIL" {
                continue;
            }
            shown += 1;
            let mut cells = Vec::new();
            if mt.show_index {
                cells.push(lit(&shown.to_string()));
            }
            cells.push(lit(&to_text(&get(row, &f.name))));
            if mt.show_nominal {
                cells.push(lit(&fmt(&get(row, &f.nominal))));
            }
            if mt.show_limits {
                cells.push(lit(&fmt(&low)));
            }
            let measured = lit(&fmt(&value));
            cells.push(if verdict == "FAIL" {
                format!("text(weight: \"semibold\", fill: {}, {measured})", self.verdict_color("FAIL"))
            } else {
                measured
            });
            if mt.show_limits {
                cells.push(lit(&fmt(&high)));
            }
            if mt.show_unit {
                cells.push(lit(&to_text(&get(row, &f.unit))));
            }
            if mt.show_status {
                let label = if verdict.is_empty() { to_text(&get(row, &f.status)) } else { verdict.to_string() };
                cells.push(format!(
                    "text(weight: \"bold\", size: 0.9em, fill: {}, {})",
                    self.verdict_color(verdict),
                    lit(&label)
                ));
            }
            let fill = if mt.highlight_failures && verdict == "FAIL" { self.tint_for(&json!("FAIL")) } else { None };
            out.push((cells, fill));
        }
        let empty = if mt.failures_only && !rows.is_empty() {
            "No failures".to_string()
        } else {
            self.text(scope, &mt.empty_text, id, "emptyText")
        };
        self.emit_table(&widths, &aligns, &header, out, true, mt.repeat_header, &empty, None)
    }

    fn key_value(&mut self, scope: &Scope, b: &Block, kv: &KeyValue) -> String {
        let id = b.id.as_str();
        let n = kv.columns.clamp(1, 4) as usize;
        let muted = self.color(&self.t.muted_color, "#6e6e73");
        let mut cells = Vec::new();
        for (i, it) in kv.items.iter().enumerate() {
            let label = self.text(scope, &it.label, id, &format!("items[{i}].label"));
            let value = self.rich(scope, &it.value, id, &format!("items[{i}].value"));
            cells.push(format!("text(size: 0.85em, fill: {muted}, {})", lit(&label)));
            cells.push(format!("text(weight: \"medium\", {value})"));
        }
        if cells.is_empty() {
            return String::new();
        }
        let cols = vec!["auto, 1fr"; n].join(", ");
        let mut body = format!(
            "grid(columns: ({cols}), column-gutter: (10pt, 18pt), row-gutter: 7pt, align: left + top, {})",
            cells.join(", ")
        );
        if !kv.title.trim().is_empty() {
            let title = self.text(scope, &kv.title, id, "title");
            body = format!(
                "stack(spacing: 8pt, text(size: 0.78em, weight: \"semibold\", tracking: 0.06em, fill: {muted}, upper({})), {body})",
                lit(&title)
            );
        }
        if kv.boxed {
            format!(
                "block(width: 100%, fill: {}, radius: 6pt, inset: (x: 12pt, y: 10pt), {body})",
                self.color(&self.t.surface_color, "#f5f5f7")
            )
        } else {
            format!("block(width: 100%, {body})")
        }
    }

    fn summary(&mut self, scope: &Scope, b: &Block, s: &Summary) -> String {
        let id = b.id.as_str();
        let rows = if s.source.trim().is_empty() { Vec::new() } else { self.rows(scope, &s.source, id) };
        let field = if s.status_field.trim().is_empty() { "status" } else { s.status_field.trim() };
        let mf = MeasurementFields::default();
        let verdicts: Vec<&'static str> = rows
            .iter()
            .map(|r| {
                let v = match r {
                    Value::Object(m) => m.get(field).cloned().unwrap_or(Value::Null),
                    other => other.clone(),
                };
                let canon = verdict_of(&v);
                if !canon.is_empty() {
                    return canon;
                }
                let g = |k: &str| r.get(k).and_then(as_num);
                expr::limit_verdict(g(&mf.value), g(&mf.low), g(&mf.high))
            })
            .collect();
        let passed = verdicts.iter().filter(|v| **v == "PASS").count();
        let failed = verdicts.iter().filter(|v| **v == "FAIL").count();
        let total = rows.len();
        let verdict: String = match &s.verdict {
            Some(e) if !e.trim().is_empty() => {
                let v = self.eval(scope, e, id, "verdict");
                let c = verdict_of(&v);
                if c.is_empty() {
                    to_text(&v).to_uppercase()
                } else {
                    c.to_string()
                }
            }
            _ => expr::rollup(verdicts.iter().copied()).to_string(),
        };
        let (shown, color) = if verdict.is_empty() {
            ("NO RESULT".to_string(), self.verdict_color(""))
        } else {
            let c = self.verdict_color(&verdict);
            (verdict.clone(), c)
        };
        let muted = self.color(&self.t.muted_color, "#6e6e73");
        let title = self.text(scope, &s.title, id, "title");
        let stat = |label: &str, value: String| -> String {
            format!(
                "stack(spacing: 3pt, text(size: 0.78em, fill: {muted}, {}), text(size: 1.35em, weight: \"semibold\", {}))",
                lit(label),
                lit(&value)
            )
        };
        let mut cells = vec![format!(
            "stack(spacing: 4pt, text(size: 0.78em, weight: \"semibold\", tracking: 0.06em, fill: {muted}, upper({})), text(size: 2.1em, weight: \"bold\", fill: {color}, {}))",
            lit(&title),
            lit(&shown)
        )];
        if s.show_counts && total > 0 {
            cells.push(stat("Total", total.to_string()));
            cells.push(stat("Passed", passed.to_string()));
            cells.push(stat("Failed", failed.to_string()));
        }
        if s.show_rate && passed + failed > 0 {
            cells.push(stat(
                "Pass rate",
                format!("{} %", expr::fixed(passed as f64 / (passed + failed) as f64 * 100.0, 1)),
            ));
        }
        let cols =
            std::iter::once("1fr").chain(std::iter::repeat_n("auto", cells.len() - 1)).collect::<Vec<_>>().join(", ");
        format!(
            "block(width: 100%, breakable: false, fill: {color}.lighten(92%), stroke: (left: 3pt + {color}), radius: (right: 5pt), inset: (x: 14pt, y: 11pt), grid(columns: ({cols},), column-gutter: 22pt, align: horizon, {}))",
            cells.join(", ")
        )
    }

    fn status(&mut self, scope: &Scope, b: &Block, s: &Status) -> String {
        let id = b.id.as_str();
        let v = self.eval(scope, &s.value, id, "value");
        let canon = verdict_of(&v);
        let shown = if canon.is_empty() {
            let t = to_text(&v).to_uppercase();
            if t.is_empty() {
                "—".to_string()
            } else {
                t
            }
        } else {
            canon.to_string()
        };
        let color = self.verdict_color(canon);
        let label = self.text(scope, &s.label, id, "label");
        match s.style {
            StatusStyle::Badge => {
                let badge = format!(
                    "box(fill: {color}, radius: 3pt, inset: (x: 6pt, y: 2.5pt), text(fill: white, weight: \"bold\", size: 0.85em, {}))",
                    lit(&shown)
                );
                if label.trim().is_empty() {
                    badge
                } else {
                    format!("block({{ text(weight: \"medium\", {}); h(6pt); {badge} }})", lit(&label))
                }
            }
            StatusStyle::Banner => format!(
                "block(width: 100%, fill: {color}, radius: 5pt, inset: (x: 14pt, y: 10pt), text(fill: white, size: 1.3em, weight: \"bold\", {}))",
                lit(&if label.trim().is_empty() { shown } else { format!("{label}: {shown}") })
            ),
        }
    }

    fn chart(&mut self, scope: &Scope, b: &Block, ch: &Chart) -> String {
        let id = b.id.as_str();
        let mut series = Vec::new();
        for (si, sr) in ch.series.iter().enumerate() {
            let items = match self.eval(scope, &sr.source, id, &format!("series[{si}].source")) {
                Value::Array(a) => a,
                Value::Null => Vec::new(),
                other => vec![other],
            };
            let xe = if sr.x.trim().is_empty() { None } else { Some(expr::parse(&sr.x)) };
            let ye = if sr.y.trim().is_empty() { None } else { Some(expr::parse(&sr.y)) };
            if let Some(Err(e)) = &xe {
                self.issue(Severity::Error, id, &format!("series[{si}].x"), e.to_string());
            }
            if let Some(Err(e)) = &ye {
                self.issue(Severity::Error, id, &format!("series[{si}].y"), e.to_string());
            }
            let categorical = matches!(ch.kind, ChartKind::Bar | ChartKind::Pie);
            let mut points = Vec::new();
            for (i, item) in items.iter().enumerate() {
                let is = scope.with_many(vec![
                    ("item", item.clone()),
                    ("index", expr::num(i as f64)),
                    ("number", expr::num(i as f64 + 1.0)),
                ]);
                let y = match &ye {
                    Some(Ok(e)) => as_num(&is.eval(e)),
                    Some(Err(_)) => None,
                    None => as_num(item),
                };
                let Some(y) = y.filter(|v| v.is_finite()) else { continue };
                let x = match &xe {
                    Some(Ok(e)) => {
                        let xv = is.eval(e);
                        match (categorical, as_num(&xv), &xv) {
                            (false, Some(n), Value::Number(_)) => XVal::Num(n),
                            _ => XVal::Cat(to_text(&xv)),
                        }
                    }
                    _ => {
                        if categorical {
                            XVal::Cat((i + 1).to_string())
                        } else {
                            XVal::Num(i as f64)
                        }
                    }
                };
                points.push((x, y));
            }
            let label = self.text(scope, &sr.label, id, &format!("series[{si}].label"));
            series.push(SeriesData { label, points, color: sr.color.clone() });
        }
        let mut limits = Vec::new();
        for (i, l) in ch.limits.iter().enumerate() {
            if let Some(v) = self.num(scope, &l.value, id, &format!("limits[{i}].value")) {
                let label = self.text(scope, &l.label, id, &format!("limits[{i}].label"));
                limits.push(LimitData { label, value: v, color: l.color.clone() });
            }
        }
        let data = ChartData {
            kind: ch.kind,
            series,
            limits,
            x_label: self.text(scope, &ch.x_label, id, "xLabel"),
            y_label: self.text(scope, &ch.y_label, id, "yLabel"),
            bins: ch.bins,
            legend: ch.legend,
            grid: ch.grid,
        };
        let h = ch.height_mm.clamp(20.0, 250.0) * PT_PER_MM;
        let svg = charts::render(&data, self.t, self.avail_pt, h);
        let name = self.file("chart", "svg", svg.into_bytes());
        let img = format!("image({}, width: 100%)", lit(&name));
        if ch.title.trim().is_empty() {
            format!("block(width: 100%, breakable: false, {img})")
        } else {
            let title = self.rich(scope, &ch.title, id, "title");
            format!(
                "block(width: 100%, breakable: false, stack(spacing: 6pt, text(weight: \"semibold\", {title}), {img}))"
            )
        }
    }

    fn section(&mut self, scope: &Scope, b: &Block, sec: &Section) -> String {
        let id = b.id.as_str();
        let container = sec.boxed || sec.keep_together;
        let render_once = |g: &mut Self, s: &Scope| -> String {
            let mut parts = String::new();
            if !sec.title.trim().is_empty() {
                let title = g.rich(s, &sec.title, id, "title");
                let _ = writeln!(parts, "heading(level: 2, outlined: false, {title})");
            }
            if container {
                g.in_container += 1;
            }
            parts.push_str(&g.blocks(&sec.blocks, s, true));
            if container {
                g.in_container -= 1;
            }
            let mut body = format!("{{\n{parts}}}");
            if sec.boxed {
                body = format!(
                    "block(width: 100%, stroke: 0.6pt + {}, radius: 6pt, inset: 12pt, breakable: {}, {body})",
                    g.color(&g.t.border_color, "#d2d2d7"),
                    !sec.keep_together
                );
            } else if sec.keep_together {
                body = format!("block(width: 100%, breakable: false, {body})");
            }
            if sec.page_break_before && g.in_container == 0 {
                body = format!("{{ pagebreak(weak: true); {body} }}");
            }
            body
        };
        match &sec.repeat {
            Some(r) if !r.trim().is_empty() => {
                let items = self.rows(scope, r, id);
                let alias = if sec.alias.trim().is_empty() { "item" } else { sec.alias.trim() };
                let mut out = Vec::new();
                for (i, it) in items.iter().enumerate() {
                    let s = scope.with_many(vec![
                        (alias, it.clone()),
                        ("index", expr::num(i as f64)),
                        ("number", expr::num(i as f64 + 1.0)),
                    ]);
                    out.push(render_once(self, &s));
                }
                if out.is_empty() {
                    return String::new();
                }
                format!("{{\n{}\n}}", out.join("\n"))
            }
            _ => render_once(self, scope),
        }
    }
}

/// Stands in for an evaluated expression while lexing markdown.
const PLACEHOLDER: char = '\u{E000}';

fn lex_markdown(s: &str, out: &mut Vec<Tok>, values: &mut dyn Iterator<Item = Tok>) {
    let chars: Vec<char> = s.chars().collect();
    let mut buf = String::new();
    let flush = |buf: &mut String, out: &mut Vec<Tok>| {
        if !buf.is_empty() {
            out.push(Tok::Text(std::mem::take(buf)));
        }
    };
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        let next = chars.get(i + 1).copied();
        let prev = if i > 0 { chars.get(i - 1).copied() } else { None };
        if c == PLACEHOLDER {
            flush(&mut buf, out);
            if let Some(v) = values.next() {
                out.push(v);
            }
            i += 1;
            continue;
        }
        match c {
            '\\' if matches!(next, Some('*') | Some('`') | Some('\\')) => {
                buf.push(next.unwrap());
                i += 2;
                continue;
            }
            '*' if next == Some('*') => {
                let after = chars.get(i + 2).copied();
                let opens = after.is_some_and(|a| !a.is_whitespace());
                let closes = prev.is_some_and(|p| !p.is_whitespace());
                if opens || closes {
                    flush(&mut buf, out);
                    out.push(Tok::Bold);
                    i += 2;
                    continue;
                }
            }
            '*' => {
                let opens = next.is_some_and(|a| !a.is_whitespace());
                let closes = prev.is_some_and(|p| !p.is_whitespace());
                if opens || closes {
                    flush(&mut buf, out);
                    out.push(Tok::Italic);
                    i += 1;
                    continue;
                }
            }
            '`' => {
                flush(&mut buf, out);
                out.push(Tok::Mono);
                i += 1;
                continue;
            }
            '\n' => {
                flush(&mut buf, out);
                if next == Some('\n') {
                    out.push(Tok::Par);
                    while chars.get(i) == Some(&'\n') {
                        i += 1;
                    }
                    continue;
                }
                out.push(Tok::Line);
                i += 1;
                continue;
            }
            _ => {}
        }
        buf.push(c);
        i += 1;
    }
    flush(&mut buf, out);
}

/// Build a Typst content expression from inline tokens with balanced styles.
fn build_inline(toks: Vec<Tok>, _font: FontFamily) -> String {
    #[derive(PartialEq, Clone, Copy)]
    enum K {
        Bold,
        Italic,
        Mono,
    }
    // Styles only apply if closed; unmatched markers become literal text.
    let mut counts = [0usize; 3];
    for t in &toks {
        match t {
            Tok::Bold => counts[0] += 1,
            Tok::Italic => counts[1] += 1,
            Tok::Mono => counts[2] += 1,
            _ => {}
        }
    }
    let mut remaining = counts;
    let mut stack: Vec<(Option<K>, Vec<String>)> = vec![(None, Vec::new())];
    let marker = |k: K| match k {
        K::Bold => "**",
        K::Italic => "*",
        K::Mono => "`",
    };
    let idx = |k: K| match k {
        K::Bold => 0,
        K::Italic => 1,
        K::Mono => 2,
    };
    for t in toks {
        let k = match t {
            Tok::Text(s) => {
                stack.last_mut().unwrap().1.push(lit(&s));
                continue;
            }
            Tok::Code(c) => {
                stack.last_mut().unwrap().1.push(c);
                continue;
            }
            Tok::Line => {
                stack.last_mut().unwrap().1.push("linebreak()".into());
                continue;
            }
            Tok::Par => {
                stack.last_mut().unwrap().1.push("parbreak()".into());
                continue;
            }
            Tok::Bold => K::Bold,
            Tok::Italic => K::Italic,
            Tok::Mono => K::Mono,
        };
        let open_here = stack.iter().any(|(sk, _)| *sk == Some(k));
        if open_here {
            // Close up to and including k, re-opening inner styles is overkill: close all above.
            while let Some((sk, parts)) = stack.pop() {
                let inner = join_parts(parts);
                let wrapped = match sk {
                    Some(K::Bold) => format!("strong({inner})"),
                    Some(K::Italic) => format!("emph({inner})"),
                    Some(K::Mono) => format!("text(font: \"DejaVu Sans Mono\", size: 0.92em, {inner})"),
                    None => unreachable!(),
                };
                stack.last_mut().unwrap().1.push(wrapped);
                remaining[idx(sk.unwrap())] = remaining[idx(sk.unwrap())].saturating_sub(1);
                if sk == Some(k) {
                    break;
                }
            }
            remaining[idx(k)] = remaining[idx(k)].saturating_sub(1);
        } else if remaining[idx(k)] >= 2 {
            remaining[idx(k)] -= 1;
            stack.push((Some(k), Vec::new()));
        } else {
            remaining[idx(k)] = remaining[idx(k)].saturating_sub(1);
            stack.last_mut().unwrap().1.push(lit(marker(k)));
        }
    }
    // Unclosed styles: emit their markers literally.
    while stack.len() > 1 {
        let (sk, parts) = stack.pop().unwrap();
        let top = &mut stack.last_mut().unwrap().1;
        top.push(lit(marker(sk.unwrap())));
        top.extend(parts);
    }
    join_parts(stack.pop().unwrap().1)
}

fn join_parts(parts: Vec<String>) -> String {
    match parts.len() {
        0 => "[]".into(),
        1 => parts.into_iter().next().unwrap(),
        _ => format!("{{ {} }}", parts.join("; ")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn literal_escaping() {
        assert_eq!(lit("a\"b\\c\n#[x]"), "\"a\\\"b\\\\c\\n#[x]\"");
    }

    #[test]
    fn markdown_inline() {
        let mut t = Vec::new();
        lex_markdown("a **b** *c* `d` 5 * 3", &mut t, &mut std::iter::empty());
        let s = build_inline(t, FontFamily::Sans);
        assert!(s.contains("strong(\"b\")"), "{s}");
        assert!(s.contains("emph(\"c\")"), "{s}");
        assert!(s.contains("DejaVu Sans Mono"), "{s}");
        assert!(s.contains("\" 5 \"; \"*\"; \" 3\"") || s.contains("5 * 3") || s.contains("\"*\""), "{s}");
    }

    #[test]
    fn bold_around_expression() {
        let mut t = Vec::new();
        lex_markdown("**\u{E000}** x", &mut t, &mut vec![Tok::Text("V".into())].into_iter());
        let s = build_inline(t, FontFamily::Sans);
        assert!(s.starts_with("{ strong(\"V\")"), "{s}");
    }

    #[test]
    fn unclosed_markers_are_literal() {
        let mut t = Vec::new();
        lex_markdown("**open", &mut t, &mut std::iter::empty());
        let s = build_inline(t, FontFamily::Sans);
        assert!(!s.contains("strong"), "{s}");
        assert!(s.contains("\"**\""), "{s}");
    }
}
