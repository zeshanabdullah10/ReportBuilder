//! The report template document model.
//!
//! A template is a JSON document (`*.rbt.json`) describing page setup, a
//! theme, and three flowing regions (header, body, footer) made of blocks.
//! Blocks never carry absolute coordinates: the layout engine paginates the
//! body, repeats table headers across pages and keeps sections together.

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Current template format version written by this engine.
pub const SCHEMA_VERSION: u32 = 1;

fn schema_version() -> u32 {
    SCHEMA_VERSION
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Document {
    #[serde(default = "schema_version")]
    pub schema_version: u32,
    #[serde(default)]
    pub meta: Meta,
    #[serde(default)]
    pub page: PageSetup,
    #[serde(default)]
    pub theme: Theme,
    #[serde(default)]
    pub header: Vec<Block>,
    #[serde(default)]
    pub footer: Vec<Block>,
    #[serde(default)]
    pub body: Vec<Block>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub watermark: Option<Watermark>,
    /// Example data used by the editor preview and by `validate`.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sample_data: Option<Value>,
    /// Editor-only state (extra data sets, UI preferences). Ignored by the renderer.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub editor: Option<Value>,
}

impl Default for Document {
    fn default() -> Self {
        Self {
            schema_version: SCHEMA_VERSION,
            meta: Meta::default(),
            page: PageSetup::default(),
            theme: Theme::default(),
            header: Vec::new(),
            footer: Vec::new(),
            body: Vec::new(),
            watermark: None,
            sample_data: None,
            editor: None,
        }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Meta {
    pub name: String,
    pub description: String,
    pub author: String,
    /// Free-form template revision, e.g. "B" or "1.4".
    pub revision: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct PageSetup {
    pub size: PaperSize,
    /// Only used when `size` is `custom`.
    pub width_mm: f64,
    /// Only used when `size` is `custom`.
    pub height_mm: f64,
    pub orientation: Orientation,
    pub margins: Margins,
}

impl Default for PageSetup {
    fn default() -> Self {
        Self {
            size: PaperSize::A4,
            width_mm: 210.0,
            height_mm: 297.0,
            orientation: Orientation::Portrait,
            margins: Margins::default(),
        }
    }
}

impl PageSetup {
    /// Page dimensions in millimetres after applying orientation.
    pub fn dimensions_mm(&self) -> (f64, f64) {
        let (w, h) = match self.size {
            PaperSize::A3 => (297.0, 420.0),
            PaperSize::A4 => (210.0, 297.0),
            PaperSize::A5 => (148.0, 210.0),
            PaperSize::Letter => (215.9, 279.4),
            PaperSize::Legal => (215.9, 355.6),
            PaperSize::Custom => (self.width_mm.max(20.0), self.height_mm.max(20.0)),
        };
        match self.orientation {
            Orientation::Portrait => (w, h),
            Orientation::Landscape => (h, w),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PaperSize {
    A3,
    A4,
    A5,
    Letter,
    Legal,
    Custom,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Orientation {
    Portrait,
    Landscape,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(default)]
pub struct Margins {
    pub top: f64,
    pub right: f64,
    pub bottom: f64,
    pub left: f64,
}

impl Default for Margins {
    fn default() -> Self {
        Self { top: 22.0, right: 18.0, bottom: 20.0, left: 18.0 }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum FontFamily {
    Sans,
    Serif,
    Mono,
}

impl FontFamily {
    pub fn typst_name(self) -> &'static str {
        match self {
            FontFamily::Sans => "Inter",
            FontFamily::Serif => "Libertinus Serif",
            FontFamily::Mono => "DejaVu Sans Mono",
        }
    }
}

/// Document-wide brand kit. Blocks inherit these values.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Theme {
    pub font: FontFamily,
    /// Base body size in points.
    pub font_size: f64,
    pub text_color: String,
    pub muted_color: String,
    pub accent_color: String,
    pub border_color: String,
    pub surface_color: String,
    pub pass_color: String,
    pub fail_color: String,
    pub warn_color: String,
    /// Optional logo (data URI or path) shown by `logo` blocks.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub logo: Option<String>,
    /// Company or lab name, available to expressions as `theme.company`.
    pub company: String,
}

impl Default for Theme {
    fn default() -> Self {
        Self {
            font: FontFamily::Sans,
            font_size: 9.5,
            text_color: "#1d1d1f".into(),
            muted_color: "#6e6e73".into(),
            accent_color: "#0a5dc2".into(),
            border_color: "#d2d2d7".into(),
            surface_color: "#f5f5f7".into(),
            pass_color: "#1a7f37".into(),
            fail_color: "#d1242f".into(),
            warn_color: "#9a6700".into(),
            logo: None,
            company: String::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Watermark {
    /// Text; may contain `{{ expressions }}`.
    pub text: String,
    /// Only draw when this expression is truthy (e.g. `status != "RELEASED"`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub visible_if: Option<String>,
    pub color: String,
    /// 0.0 – 1.0
    pub opacity: f64,
    pub angle: f64,
    pub size: f64,
}

impl Default for Watermark {
    fn default() -> Self {
        Self {
            text: "DRAFT".into(),
            visible_if: None,
            color: "#d1242f".into(),
            opacity: 0.12,
            angle: -40.0,
            size: 96.0,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum Align {
    #[default]
    Left,
    Center,
    Right,
}

impl Align {
    pub fn typst(self) -> &'static str {
        match self {
            Align::Left => "left",
            Align::Center => "center",
            Align::Right => "right",
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Weight {
    Regular,
    Medium,
    Semibold,
    Bold,
}

impl Weight {
    pub fn typst(self) -> &'static str {
        match self {
            Weight::Regular => "regular",
            Weight::Medium => "medium",
            Weight::Semibold => "semibold",
            Weight::Bold => "bold",
        }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct TextStyle {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub weight: Option<Weight>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub align: Option<Align>,
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    pub italic: bool,
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    pub mono: bool,
}

/// A single block in a flowing region.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Block {
    #[serde(default)]
    pub id: String,
    /// Expression; block is omitted when it evaluates falsy.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub visible_if: Option<String>,
    #[serde(flatten)]
    pub kind: BlockKind,
}

impl Block {
    pub fn new(id: impl Into<String>, kind: BlockKind) -> Self {
        Self { id: id.into(), visible_if: None, kind }
    }

    /// Child block lists, for traversal.
    pub fn children(&self) -> Vec<&Vec<Block>> {
        match &self.kind {
            BlockKind::Section(s) => vec![&s.blocks],
            BlockKind::Columns(c) => c.columns.iter().map(|c| &c.blocks).collect(),
            _ => Vec::new(),
        }
    }

    pub fn children_mut(&mut self) -> Vec<&mut Vec<Block>> {
        match &mut self.kind {
            BlockKind::Section(s) => vec![&mut s.blocks],
            BlockKind::Columns(c) => c.columns.iter_mut().map(|c| &mut c.blocks).collect(),
            _ => Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum BlockKind {
    Heading(Heading),
    Text(Text),
    Image(Image),
    Logo(Logo),
    Table(Table),
    MeasurementTable(MeasurementTable),
    KeyValue(KeyValue),
    Summary(Summary),
    Status(Status),
    Callout(Callout),
    Chart(Chart),
    Gauge(Gauge),
    Progress(Progress),
    QrCode(QrCode),
    Barcode(Barcode),
    Signatures(Signatures),
    Divider(Divider),
    Spacer(Spacer),
    PageBreak(PageBreak),
    Columns(Columns),
    Section(Section),
}

impl BlockKind {
    pub fn type_name(&self) -> &'static str {
        match self {
            BlockKind::Heading(_) => "heading",
            BlockKind::Text(_) => "text",
            BlockKind::Image(_) => "image",
            BlockKind::Logo(_) => "logo",
            BlockKind::Table(_) => "table",
            BlockKind::MeasurementTable(_) => "measurementTable",
            BlockKind::KeyValue(_) => "keyValue",
            BlockKind::Summary(_) => "summary",
            BlockKind::Status(_) => "status",
            BlockKind::Callout(_) => "callout",
            BlockKind::Chart(_) => "chart",
            BlockKind::Gauge(_) => "gauge",
            BlockKind::Progress(_) => "progress",
            BlockKind::QrCode(_) => "qrCode",
            BlockKind::Barcode(_) => "barcode",
            BlockKind::Signatures(_) => "signatures",
            BlockKind::Divider(_) => "divider",
            BlockKind::Spacer(_) => "spacer",
            BlockKind::PageBreak(_) => "pageBreak",
            BlockKind::Columns(_) => "columns",
            BlockKind::Section(_) => "section",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Heading {
    pub text: String,
    pub level: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub align: Option<Align>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

impl Default for Heading {
    fn default() -> Self {
        Self { text: "Heading".into(), level: 1, align: None, color: None }
    }
}

/// Paragraph text. Supports `{{ expr }}`, `**bold**`, `*italic*` and `` `mono` ``.
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Text {
    pub text: String,
    pub style: TextStyle,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Image {
    /// Data URI, file path relative to the template, or `{{ expr }}`.
    pub src: String,
    /// Width in percent of the available width.
    pub width: f64,
    pub align: Align,
    pub caption: String,
}

impl Default for Image {
    fn default() -> Self {
        Self { src: String::new(), width: 50.0, align: Align::Left, caption: String::new() }
    }
}

/// Renders `theme.logo` at the given height.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Logo {
    pub height_mm: f64,
    pub align: Align,
}

impl Default for Logo {
    fn default() -> Self {
        Self { height_mm: 12.0, align: Align::Left }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct TableColumn {
    pub header: String,
    /// Expression evaluated per row with `row`, `index` and `number` in scope.
    pub value: String,
    /// `auto`, `1fr`, `2fr`, `30mm`, `20%`.
    pub width: String,
    pub align: Align,
}

impl Default for TableColumn {
    fn default() -> Self {
        Self { header: "Column".into(), value: "row".into(), width: "auto".into(), align: Align::Left }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Table {
    /// Expression yielding an array of rows.
    pub source: String,
    pub columns: Vec<TableColumn>,
    pub zebra: bool,
    pub repeat_header: bool,
    pub empty_text: String,
    /// Per-row expression; when it yields "fail"/"pass"/"warn" or a colour the
    /// row is tinted accordingly.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub row_tone: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font_size: Option<f64>,
}

impl Default for Table {
    fn default() -> Self {
        Self {
            source: String::new(),
            columns: Vec::new(),
            zebra: true,
            repeat_header: true,
            empty_text: "No data".into(),
            row_tone: None,
            font_size: None,
        }
    }
}

/// Field names within each measurement row.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct MeasurementFields {
    pub name: String,
    pub value: String,
    pub low: String,
    pub high: String,
    pub nominal: String,
    pub unit: String,
    pub status: String,
}

impl Default for MeasurementFields {
    fn default() -> Self {
        Self {
            name: "name".into(),
            value: "value".into(),
            low: "low".into(),
            high: "high".into(),
            nominal: "nominal".into(),
            unit: "unit".into(),
            status: "status".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct MeasurementTable {
    pub source: String,
    pub fields: MeasurementFields,
    pub decimals: u8,
    pub show_index: bool,
    pub show_nominal: bool,
    pub show_limits: bool,
    pub show_unit: bool,
    pub show_status: bool,
    /// Tint failing rows.
    pub highlight_failures: bool,
    /// Only list failing rows.
    pub failures_only: bool,
    pub repeat_header: bool,
    pub empty_text: String,
}

impl Default for MeasurementTable {
    fn default() -> Self {
        Self {
            source: "measurements".into(),
            fields: MeasurementFields::default(),
            decimals: 3,
            show_index: true,
            show_nominal: false,
            show_limits: true,
            show_unit: true,
            show_status: true,
            highlight_failures: true,
            failures_only: false,
            repeat_header: true,
            empty_text: "No measurements".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct KeyValueItem {
    pub label: String,
    pub value: String,
}

impl Default for KeyValueItem {
    fn default() -> Self {
        Self { label: "Label".into(), value: String::new() }
    }
}

/// Label/value grid: DUT info, station info, specification boxes.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct KeyValue {
    pub title: String,
    pub items: Vec<KeyValueItem>,
    /// Number of label/value pairs per row (1–4).
    pub columns: u8,
    pub boxed: bool,
}

impl Default for KeyValue {
    fn default() -> Self {
        Self { title: String::new(), items: Vec::new(), columns: 2, boxed: true }
    }
}

/// Overall verdict banner with pass/fail counts.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Summary {
    pub title: String,
    /// Array of results; counts are derived from each row's status field.
    pub source: String,
    pub status_field: String,
    /// Optional explicit overall verdict expression (overrides derived).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verdict: Option<String>,
    pub show_counts: bool,
    pub show_rate: bool,
}

impl Default for Summary {
    fn default() -> Self {
        Self {
            title: "Overall result".into(),
            source: "measurements".into(),
            status_field: "status".into(),
            verdict: None,
            show_counts: true,
            show_rate: true,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum StatusStyle {
    #[default]
    Badge,
    Banner,
}

/// A pass/fail/warn indicator bound to a value.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Status {
    pub label: String,
    pub value: String,
    pub style: StatusStyle,
}

impl Default for Status {
    fn default() -> Self {
        Self { label: "Result".into(), value: "status".into(), style: StatusStyle::Badge }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum Tone {
    #[default]
    Info,
    Pass,
    Warn,
    Fail,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Callout {
    pub title: String,
    pub text: String,
    pub tone: Tone,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum ChartKind {
    #[default]
    Line,
    Bar,
    Scatter,
    Histogram,
    Pie,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Series {
    pub label: String,
    /// Expression yielding an array.
    pub source: String,
    /// Per-item expression (`item`, `index` in scope). Empty = index / category.
    pub x: String,
    /// Per-item expression. Empty = the item itself.
    pub y: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

impl Default for Series {
    fn default() -> Self {
        Self { label: "Series".into(), source: String::new(), x: String::new(), y: String::new(), color: None }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct LimitLine {
    pub label: String,
    /// Expression yielding a number.
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

impl Default for LimitLine {
    fn default() -> Self {
        Self { label: "Limit".into(), value: String::new(), color: None }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Chart {
    pub kind: ChartKind,
    pub title: String,
    pub series: Vec<Series>,
    pub x_label: String,
    pub y_label: String,
    pub height_mm: f64,
    /// Horizontal reference lines (spec limits).
    pub limits: Vec<LimitLine>,
    pub bins: u32,
    pub legend: bool,
    pub grid: bool,
}

impl Default for Chart {
    fn default() -> Self {
        Self {
            kind: ChartKind::Line,
            title: String::new(),
            series: Vec::new(),
            x_label: String::new(),
            y_label: String::new(),
            height_mm: 60.0,
            limits: Vec::new(),
            bins: 12,
            legend: true,
            grid: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Gauge {
    pub label: String,
    pub value: String,
    pub min: String,
    pub max: String,
    pub low: String,
    pub high: String,
    pub unit: String,
    pub decimals: u8,
    pub size_mm: f64,
}

impl Default for Gauge {
    fn default() -> Self {
        Self {
            label: "Value".into(),
            value: String::new(),
            min: "0".into(),
            max: "100".into(),
            low: String::new(),
            high: String::new(),
            unit: String::new(),
            decimals: 1,
            size_mm: 40.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Progress {
    pub label: String,
    pub value: String,
    pub max: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    pub show_value: bool,
}

impl Default for Progress {
    fn default() -> Self {
        Self { label: "Progress".into(), value: String::new(), max: "100".into(), color: None, show_value: true }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct QrCode {
    pub value: String,
    pub size_mm: f64,
    pub caption: String,
    pub align: Align,
}

impl Default for QrCode {
    fn default() -> Self {
        Self { value: String::new(), size_mm: 24.0, caption: String::new(), align: Align::Left }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum BarcodeFormat {
    #[default]
    Code128,
    Code39,
    Ean13,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Barcode {
    pub value: String,
    pub format: BarcodeFormat,
    pub height_mm: f64,
    pub width_mm: f64,
    pub show_text: bool,
    pub align: Align,
}

impl Default for Barcode {
    fn default() -> Self {
        Self {
            value: String::new(),
            format: BarcodeFormat::Code128,
            height_mm: 12.0,
            width_mm: 60.0,
            show_text: true,
            align: Align::Left,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct SignatureEntry {
    pub role: String,
    /// Printed name (expression allowed).
    pub name: String,
}

impl Default for SignatureEntry {
    fn default() -> Self {
        Self { role: "Tested by".into(), name: String::new() }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Signatures {
    pub entries: Vec<SignatureEntry>,
    pub show_date: bool,
}

impl Default for Signatures {
    fn default() -> Self {
        Self {
            entries: vec![
                SignatureEntry { role: "Tested by".into(), name: String::new() },
                SignatureEntry { role: "Approved by".into(), name: String::new() },
            ],
            show_date: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Divider {
    pub thickness: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

impl Default for Divider {
    fn default() -> Self {
        Self { thickness: 0.5, color: None }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Spacer {
    pub height_mm: f64,
}

impl Default for Spacer {
    fn default() -> Self {
        Self { height_mm: 6.0 }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct PageBreak {}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Column {
    /// Relative width (fraction units).
    pub width: f64,
    pub blocks: Vec<Block>,
}

impl Default for Column {
    fn default() -> Self {
        Self { width: 1.0, blocks: Vec::new() }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Columns {
    pub columns: Vec<Column>,
    pub gap_mm: f64,
}

impl Default for Columns {
    fn default() -> Self {
        Self { columns: vec![Column::default(), Column::default()], gap_mm: 6.0 }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Section {
    pub title: String,
    pub blocks: Vec<Block>,
    /// Expression yielding an array: the section is repeated once per item.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repeat: Option<String>,
    /// Name of the loop variable when repeating (default `item`).
    #[serde(rename = "as")]
    pub alias: String,
    pub keep_together: bool,
    pub page_break_before: bool,
    pub boxed: bool,
}

impl Default for Section {
    fn default() -> Self {
        Self {
            title: String::new(),
            blocks: Vec::new(),
            repeat: None,
            alias: "item".into(),
            keep_together: false,
            page_break_before: false,
            boxed: false,
        }
    }
}

impl Document {
    /// Parse a template from JSON text.
    pub fn from_json(text: &str) -> Result<Self, serde_json::Error> {
        let mut doc: Document = serde_json::from_str(text)?;
        doc.normalize();
        Ok(doc)
    }

    pub fn to_json_pretty(&self) -> String {
        serde_json::to_string_pretty(self).expect("document serializes")
    }

    /// Visit every block (depth-first) in header, body and footer.
    pub fn walk<'a>(&'a self, f: &mut dyn FnMut(&'a Block, Region)) {
        fn go<'a>(blocks: &'a [Block], region: Region, f: &mut dyn FnMut(&'a Block, Region)) {
            for b in blocks {
                f(b, region);
                for c in b.children() {
                    go(c, region, f);
                }
            }
        }
        go(&self.header, Region::Header, f);
        go(&self.body, Region::Body, f);
        go(&self.footer, Region::Footer, f);
    }

    /// Assign ids to blocks that lack one and de-duplicate clashing ids.
    pub fn normalize(&mut self) {
        let mut seen = std::collections::HashSet::new();
        let mut counter = 0usize;
        fn go(blocks: &mut [Block], seen: &mut std::collections::HashSet<String>, counter: &mut usize) {
            for b in blocks.iter_mut() {
                let valid = !b.id.is_empty() && b.id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_');
                if !valid || seen.contains(&b.id) {
                    loop {
                        *counter += 1;
                        let candidate = format!("b{counter}");
                        if !seen.contains(&candidate) {
                            b.id = candidate;
                            break;
                        }
                    }
                }
                seen.insert(b.id.clone());
                for c in b.children_mut() {
                    go(c, seen, counter);
                }
            }
        }
        go(&mut self.header, &mut seen, &mut counter);
        go(&mut self.body, &mut seen, &mut counter);
        go(&mut self.footer, &mut seen, &mut counter);
        if self.schema_version == 0 {
            self.schema_version = SCHEMA_VERSION;
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Region {
    Header,
    Body,
    Footer,
}
