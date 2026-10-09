//! report-cli — render Report Builder templates without a browser.
//!
//! Exit codes (stable, for LabVIEW / TestStand / scripts):
//!   0  success
//!   1  usage or I/O error
//!   2  template or data validation failed (errors, or warnings with --strict)
//!   3  layout / PDF generation failed
//!
//! `batch` uses the same codes per file and exits with the most severe one.

mod batch;
mod pack;
mod server;

use anyhow::{bail, Context, Result};
use clap::{Args, Parser, Subcommand};
use reportcore::{migrate, validate, Document, PdfStandard, RenderOptions, Severity};
use serde_json::{json, Value};
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::ExitCode;
use std::time::Instant;

#[derive(Parser)]
#[command(
    name = "report-cli",
    version,
    about = "Render Report Builder templates (.rbt.json) to PDF — offline, no browser required."
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Render a template with JSON data to PDF (or SVG pages).
    Render(RenderArgs),
    /// Render one PDF per JSON/CSV file in a folder (optionally watching it).
    Batch(batch::BatchArgs),
    /// Check a template (and optionally data) for problems.
    Validate(ValidateArgs),
    /// Print the data fields a template reads, or infer a JSON Schema from data.
    Schema(SchemaArgs),
    /// Convert a legacy web-builder template (Craft.js JSON) to .rbt.json.
    Migrate(MigrateArgs),
    /// List or create templates from the built-in gallery.
    Starters(StartersArgs),
    /// Convert a CSV file into report data JSON.
    Import(ImportArgs),
    /// Inline the images a template references so it is self-contained.
    Pack(PackArgs),
    /// Serve the JSON API (and optionally the editor UI) on localhost.
    Serve(ServeArgs),
}

#[derive(Args)]
struct RenderArgs {
    /// Template file (.rbt.json)
    #[arg(short, long)]
    template: PathBuf,
    /// Data file (.json, or .csv), or `-` for JSON on stdin. Defaults to the template's sample data.
    #[arg(short, long)]
    data: Option<PathBuf>,
    /// Output PDF path (or directory with --svg)
    #[arg(short, long)]
    output: PathBuf,
    /// Write PDF/A-2b for long-term archival
    #[arg(long)]
    pdfa: bool,
    /// Write one SVG per page into the output directory instead of a PDF
    #[arg(long)]
    svg: bool,
    /// Fail (exit 2) on warnings such as missing data fields
    #[arg(long)]
    strict: bool,
    /// Fixed timestamp (ISO 8601) used for now() — for reproducible output
    #[arg(long)]
    now: Option<String>,
    /// Extra font directory (.ttf/.otf); may be repeated
    #[arg(long = "fonts")]
    fonts: Vec<PathBuf>,
    /// Print a machine-readable JSON result on stdout
    #[arg(long)]
    json: bool,
    /// Accepted for compatibility with the legacy Chrome-based CLI; ignored.
    #[arg(short, long, hide = true)]
    wait: Option<u64>,
    #[arg(short, long, hide = true)]
    format: Option<String>,
    #[arg(short, long, hide = true)]
    margin: Option<f64>,
    #[arg(long, hide = true)]
    no_header_footer: bool,
    #[arg(short, long, hide = true)]
    verbose: bool,
}

#[derive(Args)]
struct ValidateArgs {
    #[arg(short, long)]
    template: PathBuf,
    #[arg(short, long)]
    data: Option<PathBuf>,
    #[arg(long)]
    strict: bool,
    #[arg(long)]
    json: bool,
}

#[derive(Args)]
struct SchemaArgs {
    /// Print the data paths this template reads
    #[arg(short, long, conflicts_with = "infer")]
    template: Option<PathBuf>,
    /// With --template: print the data contract as a JSON Schema
    #[arg(long, requires = "template", conflicts_with = "types")]
    json_schema: bool,
    /// With --template: print typed data structures (csharp, python, typescript, labview)
    #[arg(long, requires = "template", value_name = "LANG")]
    types: Option<String>,
    /// With --template: sample data for field types (default: the template's sampleData)
    #[arg(short, long, requires = "template")]
    data: Option<PathBuf>,
    /// Infer a JSON Schema from a data file
    #[arg(long)]
    infer: Option<PathBuf>,
}

#[derive(Args)]
struct MigrateArgs {
    /// Legacy template JSON (canvas_state, template row, or Craft.js node map)
    input: PathBuf,
    #[arg(short, long)]
    output: PathBuf,
}

#[derive(Args)]
struct StartersArgs {
    /// Create a template from this starter id
    #[arg(long)]
    create: Option<String>,
    /// Output template path (sample data is written next to it)
    #[arg(short, long)]
    output: Option<PathBuf>,
}

#[derive(Args)]
struct ImportArgs {
    /// CSV file (`,` `;` or tab separated, optional key/value preamble)
    input: PathBuf,
    /// Output JSON file (default: stdout)
    #[arg(short, long)]
    output: Option<PathBuf>,
}

#[derive(Args)]
struct PackArgs {
    /// Template file (.rbt.json)
    #[arg(short, long)]
    template: PathBuf,
    /// Packed template to write
    #[arg(short, long)]
    output: PathBuf,
    /// Exit with code 2 when an image could not be inlined
    #[arg(long)]
    strict: bool,
    /// Print a JSON report on stdout
    #[arg(long)]
    json: bool,
}

#[derive(Args)]
struct ServeArgs {
    #[arg(long, default_value_t = 7878)]
    port: u16,
    /// Also serve a built editor UI from this folder
    #[arg(long = "static")]
    static_dir: Option<PathBuf>,
}

fn main() -> ExitCode {
    // Legacy form without a subcommand: `report-cli -t x -d y -o z`.
    let mut args: Vec<String> = std::env::args().collect();
    if args.len() > 1 && args[1].starts_with('-') && !matches!(args[1].as_str(), "-h" | "--help" | "-V" | "--version") {
        args.insert(1, "render".into());
    }
    let cli = Cli::parse_from(args);
    match run(cli) {
        Ok(code) => code,
        Err(e) => {
            eprintln!("error: {e:#}");
            ExitCode::from(1)
        }
    }
}

fn run(cli: Cli) -> Result<ExitCode> {
    match cli.command {
        Command::Render(a) => render(a),
        Command::Batch(a) => batch::batch(a),
        Command::Validate(a) => validate_cmd(a),
        Command::Schema(a) => schema(a),
        Command::Migrate(a) => migrate_cmd(a),
        Command::Starters(a) => starters(a),
        Command::Import(a) => import_cmd(a),
        Command::Pack(a) => pack_cmd(a),
        Command::Serve(a) => {
            server::serve(a.port, a.static_dir)?;
            Ok(ExitCode::SUCCESS)
        }
    }
}

pub fn load_template(path: &Path) -> Result<Document> {
    let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("").to_ascii_lowercase();
    if ext == "html" || ext == "htm" {
        bail!(
            "'{}' is an HTML export from the legacy web builder. Templates are now .rbt.json files: \
             open it in the desktop app, or convert the legacy JSON with `report-cli migrate`.",
            path.display()
        );
    }
    let text = std::fs::read_to_string(path).with_context(|| format!("cannot read template {}", path.display()))?;
    Document::from_json(&text).with_context(|| format!("{} is not a valid template", path.display()))
}

/// Load data: JSON (bare NaN/Infinity tolerated) or, for `.csv`/`.tsv` files, CSV.
fn load_data(path: Option<&Path>, doc: &Document) -> Result<Value> {
    match path {
        None => Ok(doc.sample_data.clone().unwrap_or_else(|| json!({}))),
        Some(p) if p.as_os_str() == "-" => {
            let mut bytes = Vec::new();
            std::io::stdin().read_to_end(&mut bytes).context("cannot read stdin")?;
            reportcore::import::parse_data_bytes(&bytes, "").context("stdin")
        }
        Some(p) => {
            let bytes = std::fs::read(p).with_context(|| format!("cannot read data {}", p.display()))?;
            // UTF-8 (with or without BOM) or Windows-1252, as LabVIEW writes it.
            reportcore::import::parse_data_bytes(&bytes, &p.to_string_lossy())
        }
    }
}

/// Non-info issues as `{severity, blockId, field, message}` objects (same shape as the C API's `issuesDetail`).
fn issues_detail(issues: &[reportcore::Issue]) -> Vec<&reportcore::Issue> {
    issues.iter().filter(|i| i.severity != Severity::Info).collect()
}

fn print_issues(issues: &[reportcore::Issue]) {
    for i in issues {
        if i.severity != Severity::Info {
            eprintln!("{i}");
        }
    }
}

fn render(a: RenderArgs) -> Result<ExitCode> {
    let json = a.json;
    // I/O problems still produce one JSON line with --json.
    let fail = |stage: &str, e: anyhow::Error| -> Result<ExitCode> {
        eprintln!("error: {e:#}");
        if json {
            println!("{}", json!({"ok": false, "stage": stage, "error": format!("{e:#}")}));
        }
        Ok(ExitCode::from(1))
    };
    let started = Instant::now();
    let _ = (&a.wait, &a.format, &a.margin, a.no_header_footer, a.verbose);
    let doc = match load_template(&a.template) {
        Ok(d) => d,
        Err(e) => return fail("template", e),
    };
    let data = match load_data(a.data.as_deref(), &doc) {
        Ok(d) => d,
        Err(e) => return fail("data", e),
    };
    let report = validate::validate(&doc, Some(&data));
    if report.has_errors() {
        print_issues(&report.issues);
        if json {
            println!(
                "{}",
                json!({"ok": false, "stage": "validate", "error": "template or data has errors", "issues": report.issues, "issuesDetail": issues_detail(&report.issues)})
            );
        }
        return Ok(ExitCode::from(2));
    }
    let opts = RenderOptions {
        base_dir: a.template.parent().map(Path::to_path_buf),
        now: a.now.clone(),
        pdf_standard: if a.pdfa { PdfStandard::A2b } else { PdfStandard::None },
        font_dirs: a.fonts.clone(),
        preview: false,
    };
    let compiled = match reportcore::compile(&doc, &data, &opts) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("error: {e}");
            if json {
                println!("{}", json!({"ok": false, "stage": "layout", "error": e.to_string()}));
            }
            return Ok(ExitCode::from(3));
        }
    };
    let issues = compiled.issues.clone();
    let warnings = issues.iter().filter(|i| i.severity == Severity::Warning).count();
    print_issues(&issues);
    if a.strict && warnings > 0 {
        if json {
            println!(
                "{}",
                json!({"ok": false, "stage": "strict", "error": format!("{warnings} warning(s)"), "issues": issues, "issuesDetail": issues_detail(&issues)})
            );
        }
        return Ok(ExitCode::from(2));
    }
    let mut bytes = 0usize;
    if a.svg {
        let written = std::fs::create_dir_all(&a.output).and_then(|_| {
            for (i, svg) in compiled.to_svg_pages().iter().enumerate() {
                std::fs::write(a.output.join(format!("page-{:03}.svg", i + 1)), svg)?;
                bytes += svg.len();
            }
            Ok(())
        });
        if let Err(e) = written {
            return fail("io", anyhow::anyhow!("cannot write {}: {e}", a.output.display()));
        }
    } else {
        let pdf = match compiled.to_pdf(opts.pdf_standard) {
            Ok(p) => p,
            Err(e) => {
                eprintln!("error: {e}");
                if json {
                    println!("{}", json!({"ok": false, "stage": "pdf", "error": e.to_string()}));
                }
                return Ok(ExitCode::from(3));
            }
        };
        if let Some(parent) = a.output.parent().filter(|p| !p.as_os_str().is_empty()) {
            if let Err(e) = std::fs::create_dir_all(parent) {
                return fail("io", anyhow::anyhow!("cannot create {}: {e}", parent.display()));
            }
        }
        if let Err(e) = write_atomic(&a.output, &pdf) {
            return fail("io", e);
        }
        bytes = pdf.len();
    }
    let ms = started.elapsed().as_millis();
    if json {
        println!(
            "{}",
            json!({"ok": true, "output": a.output, "pages": compiled.page_count(), "bytes": bytes, "warnings": warnings, "elapsedMs": ms, "issues": issues, "issuesDetail": issues_detail(&issues)})
        );
    } else {
        eprintln!(
            "✓ {} ({} page{}, {ms} ms)",
            a.output.display(),
            compiled.page_count(),
            if compiled.page_count() == 1 { "" } else { "s" }
        );
    }
    Ok(ExitCode::SUCCESS)
}

/// Write via a temp file + rename so a crash never leaves a half-written PDF.
fn write_atomic(path: &Path, bytes: &[u8]) -> Result<()> {
    let tmp = path.with_extension("pdf.partial");
    std::fs::write(&tmp, bytes).with_context(|| format!("cannot write {}", tmp.display()))?;
    if path.exists() {
        let _ = std::fs::remove_file(path);
    }
    std::fs::rename(&tmp, path).with_context(|| format!("cannot write {}", path.display()))?;
    Ok(())
}

fn sanitize_file_name(s: &str) -> String {
    let cleaned: String =
        s.chars().map(|c| if c.is_alphanumeric() || matches!(c, '-' | '_' | '.' | ' ') { c } else { '_' }).collect();
    let t = cleaned.trim().trim_matches('.').to_string();
    if t.is_empty() {
        "report".into()
    } else {
        t.chars().take(150).collect()
    }
}

fn validate_cmd(a: ValidateArgs) -> Result<ExitCode> {
    let doc = load_template(&a.template)?;
    let data = match &a.data {
        Some(p) => Some(load_data(Some(p), &doc)?),
        None => None,
    };
    let mut report = validate::validate(&doc, data.as_ref());
    // Settings the engine doesn't know (typos) are only visible in the raw JSON.
    if let Ok(raw) = std::fs::read_to_string(&a.template)
        .map_err(anyhow::Error::from)
        .and_then(|t| Ok(serde_json::from_str::<Value>(t.trim_start_matches('\u{feff}'))?))
    {
        report.issues.extend(validate::unknown_keys(&raw));
    }
    let warnings = report.issues.iter().filter(|i| i.severity == Severity::Warning).count();
    let failed = report.has_errors() || (a.strict && warnings > 0);
    if a.json {
        println!(
            "{}",
            serde_json::to_string_pretty(
                &json!({"ok": !failed, "issues": report.issues, "referencedPaths": report.referenced_paths})
            )?
        );
    } else {
        for i in &report.issues {
            eprintln!("{i}");
        }
        if !failed {
            eprintln!(
                "✓ {} is valid ({} data field{} referenced)",
                a.template.display(),
                report.referenced_paths.len(),
                if report.referenced_paths.len() == 1 { "" } else { "s" }
            );
        }
    }
    Ok(if failed { ExitCode::from(2) } else { ExitCode::SUCCESS })
}

fn schema(a: SchemaArgs) -> Result<ExitCode> {
    if let Some(t) = a.template {
        let doc = load_template(&t)?;
        let data = match &a.data {
            Some(p) => Some(load_data(Some(p), &doc)?),
            None => doc.sample_data.clone(),
        };
        let report = validate::validate(&doc, data.as_ref());
        if a.json_schema || a.types.is_some() {
            let schema = validate::contract_schema(&report, &doc.meta.name);
            match &a.types {
                Some(lang) => print!(
                    "{}",
                    reportcore::codegen::typedefs(&schema, lang, &doc.meta.name).map_err(anyhow::Error::msg)?
                ),
                None => println!("{}", serde_json::to_string_pretty(&schema)?),
            }
            return Ok(ExitCode::SUCCESS);
        }
        // One field per line, in the data's names (types and optional fields: --json-schema).
        for c in report.contract {
            println!("{}", c.path);
        }
    } else if let Some(d) = a.infer {
        let text = std::fs::read_to_string(&d)?;
        let v: Value = serde_json::from_str(text.trim_start_matches('\u{feff}'))?;
        println!("{}", serde_json::to_string_pretty(&validate::infer_schema(&v))?);
    } else {
        bail!("pass --template or --infer");
    }
    Ok(ExitCode::SUCCESS)
}

fn migrate_cmd(a: MigrateArgs) -> Result<ExitCode> {
    let text = std::fs::read_to_string(&a.input)?;
    let v: Value = serde_json::from_str(&text)?;
    let m = migrate::migrate_legacy(&v).map_err(|e| anyhow::anyhow!(e))?;
    std::fs::write(&a.output, m.document.to_json_pretty())?;
    for n in &m.notes {
        eprintln!("note: {n}");
    }
    eprintln!("✓ wrote {} ({} blocks)", a.output.display(), m.document.body.len());
    Ok(ExitCode::SUCCESS)
}

fn starters(a: StartersArgs) -> Result<ExitCode> {
    match a.create {
        None => {
            for s in reportcore::gallery::starters() {
                println!("{:<28} {}", s.id, s.description);
            }
        }
        Some(id) => {
            let s = reportcore::gallery::starter(&id).with_context(|| format!("unknown starter '{id}'"))?;
            let out = a.output.unwrap_or_else(|| PathBuf::from(format!("{id}.rbt.json")));
            // Embed the sample data so previews and `render` without -d work out of the box.
            let mut doc = Document::from_json(s.template)?;
            doc.sample_data = Some(serde_json::from_str(s.data)?);
            std::fs::write(&out, doc.to_json_pretty())?;
            let data_path = PathBuf::from(out.to_string_lossy().replace(".rbt.json", ".data.json"));
            let data_path = if data_path == out { out.with_extension("data.json") } else { data_path };
            std::fs::write(&data_path, s.data)?;
            eprintln!("✓ wrote {} and {}", out.display(), data_path.display());
        }
    }
    Ok(ExitCode::SUCCESS)
}

fn import_cmd(a: ImportArgs) -> Result<ExitCode> {
    let bytes = std::fs::read(&a.input).with_context(|| format!("cannot read {}", a.input.display()))?;
    let name = a.input.to_string_lossy();
    let data = reportcore::import::csv_to_data(&reportcore::encoding::decode_text(&bytes), &name)?;
    let text = serde_json::to_string_pretty(&data)? + "\n";
    match &a.output {
        Some(out) => {
            std::fs::write(out, text).with_context(|| format!("cannot write {}", out.display()))?;
            let list = if data.get("measurements").is_some() { "measurements" } else { "rows" };
            let n = data.get(list).and_then(Value::as_array).map_or(0, Vec::len);
            eprintln!("✓ wrote {} ({n} {list})", out.display());
        }
        None => print!("{text}"),
    }
    Ok(ExitCode::SUCCESS)
}

fn pack_cmd(a: PackArgs) -> Result<ExitCode> {
    let report = pack::pack_file(&a.template, &a.output)?;
    let failed = a.strict && !report.skipped.is_empty();
    if a.json {
        let mut v = report.to_json();
        v["ok"] = json!(!failed);
        v["output"] = json!(a.output);
        println!("{v}");
    } else {
        for (at, src, n) in &report.inlined {
            eprintln!("inlined {at}: {src} ({} KB)", n.div_ceil(1024));
        }
        for (at, src, reason) in &report.skipped {
            eprintln!("warning: not inlined {at}: {src}: {reason}");
        }
        eprintln!(
            "✓ wrote {} ({} image{} inlined, {} not inlined)",
            a.output.display(),
            report.inlined.len(),
            if report.inlined.len() == 1 { "" } else { "s" },
            report.skipped.len()
        );
    }
    Ok(if failed { ExitCode::from(2) } else { ExitCode::SUCCESS })
}
