//! Typst world and the public render API.

use crate::model::Document;
use crate::typst_gen::{GenOptions, Generator};
use crate::validate::{Issue, Severity};
use serde::Serialize;
use serde_json::Value;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::OnceLock;
use typst::diag::{FileError, FileResult, SourceDiagnostic};
use typst::foundations::{Bytes, Datetime};
use typst::introspection::{Introspector, MetadataElem};
use typst::syntax::{FileId, RootedPath, Source, VirtualPath, VirtualRoot};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Library, LibraryExt, World};
use typst_layout::PagedDocument;

/// Bundled fonts: identical output on every machine, no system font lookup.
/// Inter (sans), Libertinus Serif (serif), DejaVu Sans Mono (mono). See fonts/*-LICENSE.txt.
static BUNDLED_FONTS: [&[u8]; 14] = [
    include_bytes!("../fonts/Inter-Regular.ttf"),
    include_bytes!("../fonts/Inter-Italic.ttf"),
    include_bytes!("../fonts/Inter-Medium.ttf"),
    include_bytes!("../fonts/Inter-SemiBold.ttf"),
    include_bytes!("../fonts/Inter-Bold.ttf"),
    include_bytes!("../fonts/Inter-BoldItalic.ttf"),
    include_bytes!("../fonts/LibertinusSerif-Regular.otf"),
    include_bytes!("../fonts/LibertinusSerif-Italic.otf"),
    include_bytes!("../fonts/LibertinusSerif-Semibold.otf"),
    include_bytes!("../fonts/LibertinusSerif-Bold.otf"),
    include_bytes!("../fonts/LibertinusSerif-BoldItalic.otf"),
    include_bytes!("../fonts/DejaVuSansMono.ttf"),
    include_bytes!("../fonts/DejaVuSansMono-Bold.ttf"),
    include_bytes!("../fonts/DejaVuSansMono-Oblique.ttf"),
];

struct FontSet {
    book: LazyHash<FontBook>,
    fonts: Vec<Font>,
}

fn load_fonts(extra_dirs: &[PathBuf]) -> FontSet {
    let mut fonts = Vec::new();
    for data in BUNDLED_FONTS.iter() {
        fonts.extend(Font::iter(Bytes::new(*data)));
    }
    for dir in extra_dirs {
        if let Ok(entries) = std::fs::read_dir(dir) {
            let mut paths: Vec<PathBuf> = entries.filter_map(|e| e.ok().map(|e| e.path())).collect();
            paths.sort();
            for p in paths {
                let ext = p.extension().and_then(|e| e.to_str()).map(|e| e.to_ascii_lowercase());
                if matches!(ext.as_deref(), Some("ttf" | "otf" | "ttc" | "otc")) {
                    if let Ok(bytes) = std::fs::read(&p) {
                        fonts.extend(Font::iter(Bytes::new(bytes)));
                    }
                }
            }
        }
    }
    let book = FontBook::from_fonts(&fonts);
    FontSet { book: LazyHash::new(book), fonts }
}

fn default_fonts() -> &'static FontSet {
    static FONTS: OnceLock<FontSet> = OnceLock::new();
    FONTS.get_or_init(|| load_fonts(&[]))
}

fn library() -> &'static LazyHash<Library> {
    static LIB: OnceLock<LazyHash<Library>> = OnceLock::new();
    LIB.get_or_init(|| LazyHash::new(Library::default()))
}

fn file_id(path: &str) -> FileId {
    let vp = VirtualPath::new(path).expect("valid virtual path");
    FileId::new(RootedPath::new(VirtualRoot::Project, vp))
}

struct ReportWorld<'a> {
    fonts: &'a FontSet,
    main: Source,
    files: HashMap<FileId, Bytes>,
    today: (i32, u8, u8),
}

impl World for ReportWorld<'_> {
    fn library(&self) -> &LazyHash<Library> {
        library()
    }
    fn book(&self) -> &LazyHash<FontBook> {
        &self.fonts.book
    }
    fn main(&self) -> FileId {
        self.main.id()
    }
    fn source(&self, id: FileId) -> FileResult<Source> {
        if id == self.main.id() {
            Ok(self.main.clone())
        } else {
            Err(FileError::NotSource)
        }
    }
    fn file(&self, id: FileId) -> FileResult<Bytes> {
        self.files.get(&id).cloned().ok_or_else(|| FileError::NotFound(PathBuf::from(format!("{id:?}"))))
    }
    fn font(&self, index: usize) -> Option<Font> {
        self.fonts.fonts.get(index).cloned()
    }
    fn today(&self, _offset: Option<typst::foundations::Duration>) -> Option<Datetime> {
        Datetime::from_ymd(self.today.0, self.today.1, self.today.2)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, serde::Deserialize, Default)]
#[serde(rename_all = "kebab-case")]
pub enum PdfStandard {
    #[default]
    None,
    /// PDF/A-2b — long-term archival (recommended for test records).
    A2b,
    /// PDF/A-3b — archival with embedded attachments allowed.
    A3b,
}

#[derive(Debug, Clone, Default)]
pub struct RenderOptions {
    /// Directory relative image paths are resolved against (the template's folder).
    pub base_dir: Option<PathBuf>,
    /// Editor preview mode (placeholders + block markers).
    pub preview: bool,
    /// Fixed "now" (ISO 8601) for reproducible output.
    pub now: Option<String>,
    pub pdf_standard: PdfStandard,
    /// Additional directories with .ttf/.otf fonts.
    pub font_dirs: Vec<PathBuf>,
}

#[derive(Debug, thiserror::Error)]
pub enum RenderError {
    #[error("layout failed: {0}")]
    Layout(String),
    #[error("PDF export failed: {0}")]
    Pdf(String),
}

/// Where a block landed on the rendered pages (for click-to-select in the editor).
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BlockRegion {
    pub id: String,
    /// 0-based page index.
    pub page: usize,
    /// Vertical extent in points from the top of the page.
    pub top: f64,
    pub bottom: f64,
    /// Left edge (points) where the block starts; blocks inside columns start
    /// at their column's left edge.
    pub left: f64,
}

pub struct Compiled {
    pub document: PagedDocument,
    pub issues: Vec<Issue>,
    pub source: String,
    pub title: String,
    /// Render time; written as the PDF creation date.
    pub now: chrono::DateTime<chrono::FixedOffset>,
    /// Top and bottom page margins in points (for regions that span pages).
    pub margins_pt: (f64, f64),
}

fn diag_text(diags: &[SourceDiagnostic]) -> String {
    diags
        .iter()
        .map(|d| {
            let mut s = d.message.to_string();
            for h in &d.hints {
                s.push_str(&format!(" (hint: {})", h.v));
            }
            s
        })
        .collect::<Vec<_>>()
        .join("; ")
}

/// Lay out a template with data.
pub fn compile(doc: &Document, data: &Value, opts: &RenderOptions) -> Result<Compiled, RenderError> {
    let gen_opts = GenOptions { base_dir: opts.base_dir.clone(), preview: opts.preview, now: opts.now.clone() };
    let generated = Generator::new(doc, &gen_opts).generate(data);

    let custom;
    let fonts = if opts.font_dirs.is_empty() {
        default_fonts()
    } else {
        custom = load_fonts(&opts.font_dirs);
        &custom
    };
    let now = opts
        .now
        .as_deref()
        .and_then(|n| crate::datetime::parse(&Value::String(n.to_string())))
        .unwrap_or_else(|| chrono::Local::now().fixed_offset());
    let today = {
        use chrono::Datelike;
        (now.year(), now.month() as u8, now.day() as u8)
    };
    let main = Source::new(file_id("/main.typ"), generated.source.clone());
    let files = generated.files.into_iter().map(|(k, v)| (file_id(&format!("/{k}")), Bytes::new(v))).collect();
    let world = ReportWorld { fonts, main, files, today };

    let warned = typst::compile::<PagedDocument>(&world);
    let mut issues = generated.issues;
    for w in warned.warnings.iter() {
        let msg = w.message.to_string();
        // Font fallback chatter is expected for symbol glyphs.
        if msg.contains("unknown font family") {
            continue;
        }
        issues.push(Issue {
            severity: Severity::Info,
            block_id: String::new(),
            field: String::new(),
            message: format!("layout: {msg}"),
        });
    }
    let document = warned.output.map_err(|e| {
        use typst::WorldExt;
        let mut msg = diag_text(&e);
        if let Some(range) = e.first().and_then(|d| world.range(d.span)) {
            let text = world.main.text();
            let line = text[..range.start.min(text.len())].matches('\n').count() + 1;
            let snippet: String =
                text[range.start.saturating_sub(60)..(range.end + 60).min(text.len())].chars().collect();
            msg = format!("{msg} at generated line {line}: …{snippet}…");
        }
        RenderError::Layout(msg)
    })?;
    let title = if doc.meta.name.is_empty() { "Report".into() } else { doc.meta.name.clone() };
    let mm = 72.0 / 25.4;
    let margins_pt = (doc.page.margins.top * mm, doc.page.margins.bottom * mm);
    Ok(Compiled { document, issues, source: generated.source, title, now, margins_pt })
}

impl Compiled {
    pub fn page_count(&self) -> usize {
        self.document.pages().len()
    }

    /// Page size in points.
    pub fn page_size(&self, index: usize) -> Option<(f64, f64)> {
        self.document.pages().get(index).map(|p| {
            let s = p.frame.size();
            (s.x.to_pt(), s.y.to_pt())
        })
    }

    pub fn to_pdf(&self, standard: PdfStandard) -> Result<Vec<u8>, RenderError> {
        let list: Vec<typst_pdf::PdfStandard> = match standard {
            PdfStandard::None => vec![],
            PdfStandard::A2b => vec![typst_pdf::PdfStandard::A_2b],
            PdfStandard::A3b => vec![typst_pdf::PdfStandard::A_3b],
        };
        let standards = typst_pdf::PdfStandards::new(&list).map_err(|e| RenderError::Pdf(e.message().to_string()))?;
        let timestamp = {
            use chrono::{Datelike, Timelike};
            let n = self.now;
            Datetime::from_ymd_hms(
                n.year(),
                n.month() as u8,
                n.day() as u8,
                n.hour() as u8,
                n.minute() as u8,
                n.second() as u8,
            )
            .and_then(|d| typst_pdf::Timestamp::new_local(d, n.offset().local_minus_utc() / 60))
        };
        let options = typst_pdf::PdfOptions {
            timestamp,
            ident: typst::foundations::Smart::Custom(self.title.clone()),
            creator: typst::foundations::Smart::Custom(Some(format!("Report Builder {}", env!("CARGO_PKG_VERSION")))),
            standards,
            ..Default::default()
        };
        typst_pdf::pdf(&self.document, &options).map_err(|e| RenderError::Pdf(diag_text(&e)))
    }

    /// One standalone SVG per page.
    pub fn to_svg_pages(&self) -> Vec<String> {
        let opts = typst_svg::SvgOptions::default();
        self.document.pages().iter().map(|p| typst_svg::svg(p, &opts)).collect()
    }

    /// Vertical extents of top-level blocks (requires `preview: true`).
    pub fn block_regions(&self) -> Vec<BlockRegion> {
        use typst::foundations::{Label, Selector};
        let intro = self.document.introspector();
        let collect = |name: &str| -> Vec<(String, usize, f64, f64)> {
            let Some(label) = Label::construct(name.into()).ok() else { return vec![] };
            intro
                .query(&Selector::Label(label))
                .iter()
                .filter_map(|c: &typst::foundations::Content| {
                    let meta = c.to_packed::<MetadataElem>()?;
                    let id = match &meta.value {
                        typst::foundations::Value::Str(s) => s.to_string(),
                        _ => return None,
                    };
                    let loc = c.location()?;
                    let pos = intro.position(loc)?;
                    Some((id, pos.page.get() - 1, pos.point.y.to_pt(), pos.point.x.to_pt()))
                })
                .collect()
        };
        let starts = collect("rb-start");
        let ends = collect("rb-end");
        let mut out = Vec::new();
        let mut used = vec![false; ends.len()];
        for (id, page, top, left) in starts {
            // Match the next unused end marker with the same id.
            let Some(j) = ends
                .iter()
                .enumerate()
                .position(|(j, e)| !used[j] && e.0 == id && (e.1 > page || (e.1 == page && e.2 >= top)))
            else {
                continue;
            };
            used[j] = true;
            let (_, end_page, bottom, _) = ends[j].clone();
            let page_h = self.page_size(page).map(|s| s.1).unwrap_or(842.0);
            let (margin_top, margin_bottom) = self.margins_pt;
            if end_page == page {
                out.push(BlockRegion { id: id.clone(), page, top, bottom: bottom.max(top + 2.0), left });
            } else {
                out.push(BlockRegion { id: id.clone(), page, top, bottom: page_h - margin_bottom, left });
                for p in page + 1..end_page {
                    let h = self.page_size(p).map(|s| s.1).unwrap_or(page_h);
                    out.push(BlockRegion { id: id.clone(), page: p, top: margin_top, bottom: h - margin_bottom, left });
                }
                out.push(BlockRegion { id: id.clone(), page: end_page, top: margin_top, bottom, left });
            }
        }
        out
    }
}

/// Convenience: template + data → PDF bytes and issues.
pub fn render_pdf(doc: &Document, data: &Value, opts: &RenderOptions) -> Result<(Vec<u8>, Vec<Issue>), RenderError> {
    let c = compile(doc, data, opts)?;
    let pdf = c.to_pdf(opts.pdf_standard)?;
    Ok((pdf, c.issues))
}
