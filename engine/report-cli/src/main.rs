//! report-cli — render Report Builder templates without a browser.
//!
//! Exit codes (stable, for LabVIEW / TestStand / scripts):
//!   0  success
//!   1  usage or I/O error
//!   2  template or data validation failed (errors, or warnings with --strict)
//!   3  layout / PDF generation failed

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
    /// Render one PDF per JSON file in a folder.
    Batch(BatchArgs),
    /// Check a template (and optionally data) for problems.
    Validate(ValidateArgs),
    /// Print the data fields a template reads, or infer a JSON Schema from data.
    Schema(SchemaArgs),
    /// Convert a legacy web-builder template (Craft.js JSON) to .rbt.json.
    Migrate(MigrateArgs),
    /// List or create templates from the built-in gallery.
    Starters(StartersArgs),
    /// Serve the JSON API (and optionally the editor UI) on localhost.
    Serve(ServeArgs),
}

#[derive(Args)]
struct RenderArgs {
    /// Template file (.rbt.json)
    #[arg(short, long)]
    template: PathBuf,
    /// JSON data file, or `-` for stdin. Defaults to the template's sample data.
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
struct BatchArgs {
    #[arg(short, long)]
    template: PathBuf,
    /// Folder containing *.json data files
    #[arg(long)]
    data_dir: PathBuf,
    /// Output folder
    #[arg(long)]
    out_dir: PathBuf,
    /// File name template, e.g. "{{ dut.serial }}_{{ date(test.start, 'YYYYMMDD') }}". Defaults to the data file name.
    #[arg(long)]
    name: Option<String>,
    #[arg(long)]
    pdfa: bool,
    #[arg(long)]
    strict: bool,
    /// Parallel workers (default: CPU count)
    #[arg(short, long)]
    jobs: Option<usize>,
    #[arg(long)]
    json: bool,
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
        Command::Batch(a) => batch(a),
        Command::Validate(a) => validate_cmd(a),
        Command::Schema(a) => schema(a),
        Command::Migrate(a) => migrate_cmd(a),
        Command::Starters(a) => starters(a),
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

fn load_data(path: Option<&Path>, doc: &Document) -> Result<Value> {
    match path {
        None => Ok(doc.sample_data.clone().unwrap_or_else(|| json!({}))),
        Some(p) if p.as_os_str() == "-" => {
            let mut bytes = Vec::new();
            std::io::stdin().read_to_end(&mut bytes)?;
            serde_json::from_str(&reportcore::encoding::decode_text(&bytes)).context("stdin is not valid JSON")
        }
        Some(p) => {
            let bytes = std::fs::read(p).with_context(|| format!("cannot read data {}", p.display()))?;
            // UTF-8 (with or without BOM) or Windows-1252, as LabVIEW writes it.
            serde_json::from_str(&reportcore::encoding::decode_text(&bytes))
                .with_context(|| format!("{} is not valid JSON", p.display()))
        }
    }
}

fn print_issues(issues: &[reportcore::Issue]) {
    for i in issues {
        if i.severity != Severity::Info {
            eprintln!("{i}");
        }
    }
}

fn render(a: RenderArgs) -> Result<ExitCode> {
    let started = Instant::now();
    let _ = (&a.wait, &a.format, &a.margin, a.no_header_footer, a.verbose);
    let doc = load_template(&a.template)?;
    let data = load_data(a.data.as_deref(), &doc)?;
    let report = validate::validate(&doc, Some(&data));
    if report.has_errors() {
        print_issues(&report.issues);
        if a.json {
            println!("{}", json!({"ok": false, "stage": "validate", "issues": report.issues}));
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
            if a.json {
                println!("{}", json!({"ok": false, "stage": "layout", "error": e.to_string()}));
            }
            return Ok(ExitCode::from(3));
        }
    };
    let issues = compiled.issues.clone();
    let warnings = issues.iter().filter(|i| i.severity == Severity::Warning).count();
    print_issues(&issues);
    if a.strict && warnings > 0 {
        if a.json {
            println!("{}", json!({"ok": false, "stage": "strict", "issues": issues}));
        }
        return Ok(ExitCode::from(2));
    }
    if a.svg {
        std::fs::create_dir_all(&a.output)?;
        for (i, svg) in compiled.to_svg_pages().iter().enumerate() {
            std::fs::write(a.output.join(format!("page-{:03}.svg", i + 1)), svg)?;
        }
    } else {
        let pdf = match compiled.to_pdf(opts.pdf_standard) {
            Ok(p) => p,
            Err(e) => {
                eprintln!("error: {e}");
                if a.json {
                    println!("{}", json!({"ok": false, "stage": "pdf", "error": e.to_string()}));
                }
                return Ok(ExitCode::from(3));
            }
        };
        if let Some(parent) = a.output.parent().filter(|p| !p.as_os_str().is_empty()) {
            std::fs::create_dir_all(parent)?;
        }
        write_atomic(&a.output, &pdf)?;
    }
    let ms = started.elapsed().as_millis();
    if a.json {
        println!(
            "{}",
            json!({"ok": true, "output": a.output, "pages": compiled.page_count(), "warnings": warnings, "elapsedMs": ms, "issues": issues})
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

fn batch(a: BatchArgs) -> Result<ExitCode> {
    let started = Instant::now();
    let doc = load_template(&a.template)?;
    let static_report = validate::validate(&doc, None);
    if static_report.has_errors() {
        print_issues(&static_report.issues);
        return Ok(ExitCode::from(2));
    }
    let mut files: Vec<PathBuf> = std::fs::read_dir(&a.data_dir)
        .with_context(|| format!("cannot read {}", a.data_dir.display()))?
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.extension().and_then(|e| e.to_str()).is_some_and(|e| e.eq_ignore_ascii_case("json")))
        .collect();
    files.sort();
    std::fs::create_dir_all(&a.out_dir)?;
    let jobs = a.jobs.unwrap_or_else(|| std::thread::available_parallelism().map(|n| n.get()).unwrap_or(2)).max(1);
    let base_dir = a.template.parent().map(Path::to_path_buf);
    let std_ = if a.pdfa { PdfStandard::A2b } else { PdfStandard::None };

    let results = std::sync::Mutex::new(Vec::new());
    let next = std::sync::atomic::AtomicUsize::new(0);
    std::thread::scope(|scope| {
        for _ in 0..jobs.min(files.len().max(1)) {
            scope.spawn(|| loop {
                let i = next.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
                let Some(file) = files.get(i) else { break };
                let outcome = (|| -> Result<(PathBuf, usize, usize)> {
                    let data = load_data(Some(file), &doc)?;
                    let stem = match &a.name {
                        Some(tpl) => {
                            let missing = std::cell::RefCell::new(Default::default());
                            let scope = reportcore::expr::Scope::new(&data, &missing, "");
                            scope.render_template(tpl).map_err(|e| anyhow::anyhow!("--name: {e}"))?
                        }
                        None => file.file_stem().and_then(|s| s.to_str()).unwrap_or("report").to_string(),
                    };
                    let out = a.out_dir.join(format!("{}.pdf", sanitize_file_name(&stem)));
                    let opts = RenderOptions { base_dir: base_dir.clone(), pdf_standard: std_, ..Default::default() };
                    let c = reportcore::compile(&doc, &data, &opts)?;
                    let warnings = c.issues.iter().filter(|i| i.severity == Severity::Warning).count();
                    if a.strict && warnings > 0 {
                        bail!(
                            "{} warning(s): {}",
                            warnings,
                            c.issues.iter().map(|i| i.to_string()).collect::<Vec<_>>().join("; ")
                        );
                    }
                    write_atomic(&out, &c.to_pdf(std_)?)?;
                    Ok((out, c.page_count(), warnings))
                })();
                results.lock().unwrap().push((file.clone(), outcome));
            });
        }
    });
    let mut results = results.into_inner().unwrap();
    results.sort_by(|a, b| a.0.cmp(&b.0));
    let failed = results.iter().filter(|r| r.1.is_err()).count();
    if a.json {
        let items: Vec<Value> = results
            .iter()
            .map(|(f, r)| match r {
                Ok((out, pages, w)) => json!({"data": f, "ok": true, "output": out, "pages": pages, "warnings": w}),
                Err(e) => json!({"data": f, "ok": false, "error": format!("{e:#}")}),
            })
            .collect();
        println!(
            "{}",
            json!({"ok": failed == 0, "count": results.len(), "failed": failed, "elapsedMs": started.elapsed().as_millis(), "results": items})
        );
    } else {
        for (f, r) in &results {
            match r {
                Ok((out, pages, _)) => eprintln!("✓ {} → {} ({pages} p)", f.display(), out.display()),
                Err(e) => eprintln!("✗ {}: {e:#}", f.display()),
            }
        }
        eprintln!("{} rendered, {} failed in {} ms", results.len() - failed, failed, started.elapsed().as_millis());
    }
    Ok(if failed > 0 { ExitCode::from(3) } else { ExitCode::SUCCESS })
}

fn validate_cmd(a: ValidateArgs) -> Result<ExitCode> {
    let doc = load_template(&a.template)?;
    let data = match &a.data {
        Some(p) => Some(load_data(Some(p), &doc)?),
        None => None,
    };
    let report = validate::validate(&doc, data.as_ref());
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
        for p in validate::validate(&doc, None).referenced_paths {
            println!("{p}");
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
