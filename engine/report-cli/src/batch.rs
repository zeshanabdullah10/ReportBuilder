//! `report-cli batch`: one PDF per data file in a folder, optionally watching
//! the folder for new files (std only: the folder is polled).
//!
//! Per-file failures use the same codes as `render`: 1 unreadable data or an
//! output that cannot be written, 2 template/data validation (or `--strict`
//! warnings), 3 layout/PDF generation. The batch exits with the most severe
//! code seen (3 > 2 > 1), or 0 when every file rendered.

use crate::{load_template, print_issues, sanitize_file_name, write_atomic};
use anyhow::{bail, Result};
use clap::Args;
use reportcore::{validate, Document, PdfStandard, RenderOptions, Severity};
use serde_json::{json, Value};
use std::cell::RefCell;
use std::collections::{BTreeSet, HashMap};
use std::io::Write as _;
use std::path::{Path, PathBuf};
use std::process::ExitCode;
use std::sync::Mutex;
use std::time::{Duration, Instant, SystemTime};

#[derive(Args)]
pub struct BatchArgs {
    #[arg(short, long)]
    pub template: PathBuf,
    /// Folder containing *.json / *.csv data files
    #[arg(long)]
    pub data_dir: PathBuf,
    /// Output folder
    #[arg(long)]
    pub out_dir: PathBuf,
    /// File name template, e.g. "{{ dut.serial ?? __file }}_{{ date(test.start, 'YYYYMMDD') }}".
    /// `__file` is the data file name without extension. Defaults to the data file name.
    #[arg(long)]
    pub name: Option<String>,
    #[arg(long)]
    pub pdfa: bool,
    /// Fail a file (exit 2) on warnings such as missing data fields
    #[arg(long)]
    pub strict: bool,
    /// Fixed timestamp (ISO 8601) used for now() — for reproducible output
    #[arg(long)]
    pub now: Option<String>,
    /// Extra font directory (.ttf/.otf); may be repeated
    #[arg(long = "fonts")]
    pub fonts: Vec<PathBuf>,
    /// Also process data files in sub-folders
    #[arg(short, long)]
    pub recursive: bool,
    /// Keep running and render new or changed files as they appear
    #[arg(long)]
    pub watch: bool,
    /// Polling interval for --watch, in milliseconds
    #[arg(long, default_value_t = 1000)]
    pub interval: u64,
    /// Move each successfully rendered data file into this folder
    #[arg(long)]
    pub done_dir: Option<PathBuf>,
    /// Replace PDFs that already exist in --out-dir (by default a suffix -2, -3, … is added)
    #[arg(long)]
    pub overwrite: bool,
    /// Parallel workers (default: CPU count)
    #[arg(short, long)]
    pub jobs: Option<usize>,
    /// Print JSON on stdout (one summary object; with --watch, one line per file)
    #[arg(long)]
    pub json: bool,
}

/// A per-file failure: render-compatible exit code, stage and message.
#[derive(Debug)]
struct Failure {
    code: u8,
    stage: &'static str,
    error: String,
    issues: Vec<reportcore::Issue>,
}

fn failure(code: u8, stage: &'static str, error: impl Into<String>) -> Failure {
    Failure { code, stage, error: error.into(), issues: Vec::new() }
}

#[derive(Debug)]
struct Done {
    output: PathBuf,
    pages: usize,
    warnings: usize,
    /// The name the output would have had without collision handling.
    renamed_from: Option<PathBuf>,
    moved_to: Option<PathBuf>,
}

type Outcome = (Result<Done, Failure>, Vec<String>);

/// Output names claimed in this run: output path → data file that owns it.
#[derive(Default)]
struct Claims(Mutex<HashMap<PathBuf, PathBuf>>);

impl Claims {
    /// Pick `<stem>.pdf`, or `<stem>-2.pdf`, `-3`, … when another data file (or,
    /// without `overwrite`, an existing file) already has that name.
    fn claim(&self, dir: &Path, stem: &str, owner: &Path, overwrite: bool) -> PathBuf {
        let mut map = self.0.lock().unwrap();
        for n in 1.. {
            let candidate = if n == 1 { dir.join(format!("{stem}.pdf")) } else { dir.join(format!("{stem}-{n}.pdf")) };
            match map.get(&candidate) {
                Some(o) if o == owner => return candidate,
                Some(_) => continue,
                None if !overwrite && candidate.exists() => continue,
                None => {
                    map.insert(candidate.clone(), owner.to_path_buf());
                    return candidate;
                }
            }
        }
        unreachable!()
    }

    /// Give back a name whose render failed (unless an earlier render wrote it).
    fn release(&self, output: &Path, owner: &Path) {
        let mut map = self.0.lock().unwrap();
        if map.get(output).is_some_and(|o| o == owner) && !output.exists() {
            map.remove(output);
        }
    }

    /// The data file moved: names it owned now belong to its new location, so a
    /// new file arriving under the old name gets its own output.
    fn moved(&self, from: &Path, to: &Path) {
        for owner in self.0.lock().unwrap().values_mut() {
            if owner == from {
                *owner = to.to_path_buf();
            }
        }
    }
}

struct Ctx<'a> {
    a: &'a BatchArgs,
    doc: Document,
    opts: RenderOptions,
    claims: Claims,
    /// Canonical folders never scanned for input (outputs, processed files).
    exclude: Vec<PathBuf>,
}

fn is_data_file(p: &Path) -> bool {
    let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
    let lower = name.to_ascii_lowercase();
    !name.starts_with('.')
        && !lower.ends_with(".rbt.json")
        && (lower.ends_with(".json") || lower.ends_with(".csv") || lower.ends_with(".tsv"))
}

fn scan(ctx: &Ctx, dir: &Path, out: &mut Vec<PathBuf>) -> std::io::Result<()> {
    for entry in std::fs::read_dir(dir)? {
        let Ok(entry) = entry else { continue };
        let path = entry.path();
        let Ok(ft) = entry.file_type() else { continue };
        if ft.is_dir() {
            if ctx.a.recursive {
                let canon = path.canonicalize().unwrap_or_else(|_| path.clone());
                if !ctx.exclude.contains(&canon) {
                    let _ = scan(ctx, &path, out);
                }
            }
        } else if is_data_file(&path) && path != ctx.a.template {
            out.push(path);
        }
    }
    Ok(())
}

fn list_files(ctx: &Ctx) -> Result<Vec<PathBuf>> {
    let mut files = Vec::new();
    scan(ctx, &ctx.a.data_dir, &mut files)
        .map_err(|e| anyhow::anyhow!("cannot read {}: {e}", ctx.a.data_dir.display()))?;
    files.sort();
    Ok(files)
}

fn file_stem(file: &Path) -> String {
    let name = file.file_name().and_then(|s| s.to_str()).unwrap_or("report");
    let lower = name.to_ascii_lowercase();
    for ext in [".data.json", ".json", ".csv", ".tsv"] {
        if lower.ends_with(ext) && name.len() > ext.len() {
            return name[..name.len() - ext.len()].to_string();
        }
    }
    name.to_string()
}

/// Evaluate `--name` for one data file. `__file` (the data file stem) is
/// visible to the template; missing fields produce a note.
fn output_stem(tpl: Option<&str>, data: &Value, file: &Path, now: &str, notes: &mut Vec<String>) -> String {
    let stem = file_stem(file);
    let Some(tpl) = tpl else { return sanitize_file_name(&stem) };
    let mut named = data.clone();
    if let Value::Object(m) = &mut named {
        m.entry("__file").or_insert_with(|| Value::String(stem.clone()));
    }
    let missing = RefCell::new(BTreeSet::new());
    let scope = reportcore::expr::Scope::new(&named, &missing, now);
    match scope.render_template(tpl) {
        Ok(s) if !s.trim().is_empty() => {
            let missing = missing.into_inner();
            if !missing.is_empty() {
                let list: Vec<_> = missing.into_iter().collect();
                notes.push(format!(
                    "--name: data field{} '{}' missing (tip: '{{{{ field ?? __file }}}}')",
                    if list.len() == 1 { "" } else { "s" },
                    list.join("', '")
                ));
            }
            sanitize_file_name(&s)
        }
        Ok(_) => {
            notes.push(format!("--name produced an empty name; using '{stem}'"));
            sanitize_file_name(&stem)
        }
        Err(e) => {
            notes.push(format!("--name: {e}; using '{stem}'"));
            sanitize_file_name(&stem)
        }
    }
}

/// Move `file` into the done folder, keeping its path relative to the data folder.
fn move_done(ctx: &Ctx, file: &Path, done: &Path) -> std::io::Result<PathBuf> {
    let rel = file.strip_prefix(&ctx.a.data_dir).unwrap_or(Path::new(file.file_name().unwrap_or_default()));
    let mut dest = done.join(rel);
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let stem = file_stem(&dest);
    let ext = dest.file_name().and_then(|n| n.to_str()).map(|n| n[stem.len()..].to_string()).unwrap_or_default();
    let mut n = 2;
    while dest.exists() {
        dest = dest.with_file_name(format!("{stem}-{n}{ext}"));
        n += 1;
    }
    if std::fs::rename(file, &dest).is_err() {
        // Different volume: copy, then remove.
        std::fs::copy(file, &dest)?;
        std::fs::remove_file(file)?;
    }
    Ok(dest)
}

fn read_data(file: &Path) -> Result<Value, Failure> {
    let bytes = std::fs::read(file).map_err(|e| failure(1, "data", format!("cannot read data: {e}")))?;
    let name = file.file_name().and_then(|n| n.to_str()).unwrap_or("");
    reportcore::import::parse_data_bytes(&bytes, name).map_err(|e| failure(1, "data", format!("{e:#}")))
}

/// Phase 1 (sequential, in file order so collision suffixes are deterministic):
/// read and validate the data, then claim the output name.
fn prepare(ctx: &Ctx, file: &Path, notes: &mut Vec<String>) -> Result<(PathBuf, Option<PathBuf>), Failure> {
    let a = ctx.a;
    let data = read_data(file)?;
    let report = validate::validate(&ctx.doc, Some(&data));
    if report.has_errors() {
        return Err(Failure {
            code: 2,
            stage: "validate",
            error: "template or data has errors".into(),
            issues: report.issues,
        });
    }
    let now = a.now.clone().unwrap_or_else(|| chrono::Local::now().fixed_offset().to_rfc3339());
    let stem = output_stem(a.name.as_deref(), &data, file, &now, notes);
    let output = ctx.claims.claim(&a.out_dir, &stem, file, a.overwrite);
    let wanted = a.out_dir.join(format!("{stem}.pdf"));
    let renamed_from = (output != wanted).then_some(wanted);
    if let Some(w) = &renamed_from {
        notes.push(format!(
            "{} is already taken; writing {}",
            w.file_name().unwrap_or_default().to_string_lossy(),
            output.file_name().unwrap_or_default().to_string_lossy()
        ));
    }
    Ok((output, renamed_from))
}

/// Phase 2 (parallel): lay out, write the PDF and move the data file.
fn render_one(ctx: &Ctx, file: &Path, output: PathBuf, notes: &mut Vec<String>) -> Result<Done, Failure> {
    let a = ctx.a;
    let data = read_data(file)?;
    let c = reportcore::compile(&ctx.doc, &data, &ctx.opts).map_err(|e| failure(3, "layout", e.to_string()))?;
    let warnings: Vec<_> = c.issues.iter().filter(|i| i.severity == Severity::Warning).collect();
    if a.strict && !warnings.is_empty() {
        return Err(Failure {
            code: 2,
            stage: "strict",
            error: format!(
                "{} warning(s): {}",
                warnings.len(),
                warnings.iter().map(|i| i.to_string()).collect::<Vec<_>>().join("; ")
            ),
            issues: c.issues.clone(),
        });
    }
    let warnings = warnings.len();
    let pdf = c.to_pdf(ctx.opts.pdf_standard).map_err(|e| failure(3, "pdf", e.to_string()))?;
    write_atomic(&output, &pdf).map_err(|e| failure(1, "io", format!("{e:#}")))?;
    let moved_to = match &a.done_dir {
        Some(done) => match move_done(ctx, file, done) {
            Ok(dest) => {
                ctx.claims.moved(file, &dest);
                Some(dest)
            }
            Err(e) => {
                notes.push(format!("cannot move to {}: {e}", done.display()));
                None
            }
        },
        None => None,
    };
    Ok(Done { output, pages: c.page_count(), warnings, renamed_from: None, moved_to })
}

/// Render `files` on `jobs` worker threads; results in input order.
fn run_files(ctx: &Ctx, files: &[PathBuf], jobs: usize) -> Vec<(PathBuf, Outcome)> {
    let mut outcomes: Vec<Option<Result<Done, Failure>>> = Vec::with_capacity(files.len());
    let mut notes: Vec<Vec<String>> = vec![Vec::new(); files.len()];
    let mut work = Vec::new();
    for (i, file) in files.iter().enumerate() {
        match prepare(ctx, file, &mut notes[i]) {
            Ok(claim) => {
                work.push((i, claim));
                outcomes.push(None);
            }
            Err(f) => outcomes.push(Some(Err(f))),
        }
    }
    let results = Mutex::new(Vec::new());
    let next = std::sync::atomic::AtomicUsize::new(0);
    std::thread::scope(|scope| {
        for _ in 0..jobs.min(work.len()).max(1) {
            scope.spawn(|| loop {
                let k = next.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
                let Some((i, (output, renamed_from))) = work.get(k) else { break };
                let file = &files[*i];
                let mut notes = Vec::new();
                let r = render_one(ctx, file, output.clone(), &mut notes)
                    .map(|d| Done { renamed_from: renamed_from.clone(), ..d });
                if r.is_err() {
                    ctx.claims.release(output, file);
                }
                results.lock().unwrap().push((*i, r, notes));
            });
        }
    });
    for (i, r, more) in results.into_inner().unwrap() {
        notes[i].extend(more);
        outcomes[i] = Some(r);
    }
    files
        .iter()
        .cloned()
        .zip(outcomes.into_iter().zip(notes).map(|(r, n)| (r.expect("every file has an outcome"), n)))
        .collect()
}

fn item_json(file: &Path, (r, notes): &Outcome) -> Value {
    match r {
        Ok(d) => json!({
            "data": file,
            "ok": true,
            "output": d.output,
            "pages": d.pages,
            "warnings": d.warnings,
            "renamedFrom": d.renamed_from,
            "movedTo": d.moved_to,
            "notes": notes,
        }),
        Err(f) => json!({
            "data": file,
            "ok": false,
            "code": f.code,
            "stage": f.stage,
            "error": f.error,
            "issues": f.issues.iter().filter(|i| i.severity != Severity::Info).collect::<Vec<_>>(),
            "notes": notes,
        }),
    }
}

fn print_item(file: &Path, (r, notes): &Outcome) {
    for n in notes {
        eprintln!("warning: {}: {n}", file.display());
    }
    match r {
        Ok(d) => eprintln!("✓ {} → {} ({} p)", file.display(), d.output.display(), d.pages),
        Err(f) => {
            print_issues(&f.issues);
            eprintln!("✗ {} [{}]: {}", file.display(), f.stage, f.error);
        }
    }
}

fn exit_code(results: &[(PathBuf, Outcome)]) -> u8 {
    let codes: Vec<u8> = results.iter().filter_map(|(_, (r, _))| r.as_ref().err().map(|f| f.code)).collect();
    [3u8, 2, 1].into_iter().find(|c| codes.contains(c)).unwrap_or(0)
}

pub fn batch(a: BatchArgs) -> Result<ExitCode> {
    let started = Instant::now();
    let doc = load_template(&a.template)?;
    let static_report = validate::validate(&doc, None);
    if static_report.has_errors() {
        print_issues(&static_report.issues);
        if a.json {
            println!(
                "{}",
                json!({"ok": false, "stage": "validate", "error": "template has errors", "issues": static_report.issues})
            );
        }
        return Ok(ExitCode::from(2));
    }
    if let Some(tpl) = &a.name {
        // A broken --name is a usage error, reported once up front.
        let missing = RefCell::new(BTreeSet::new());
        if let Err(e) = reportcore::expr::Scope::new(&json!({}), &missing, "").render_template(tpl) {
            bail!("--name: {e}");
        }
    }
    if !a.data_dir.is_dir() {
        bail!("{} is not a folder", a.data_dir.display());
    }
    std::fs::create_dir_all(&a.out_dir)?;
    let mut exclude = vec![a.out_dir.canonicalize()?];
    if let Some(d) = &a.done_dir {
        std::fs::create_dir_all(d)?;
        exclude.push(d.canonicalize()?);
    }
    let jobs = a.jobs.unwrap_or_else(|| std::thread::available_parallelism().map(|n| n.get()).unwrap_or(2)).max(1);
    let pdf_standard = if a.pdfa { PdfStandard::A2b } else { PdfStandard::None };
    let opts = RenderOptions {
        base_dir: a.template.parent().map(Path::to_path_buf),
        now: a.now.clone(),
        pdf_standard,
        font_dirs: a.fonts.clone(),
        preview: false,
    };
    let ctx = Ctx { a: &a, doc, opts, claims: Claims::default(), exclude };

    if a.watch {
        return watch(&ctx, jobs);
    }

    let files = list_files(&ctx)?;
    let results = run_files(&ctx, &files, jobs);
    let failed = results.iter().filter(|r| r.1 .0.is_err()).count();
    let code = exit_code(&results);
    if a.json {
        let items: Vec<Value> = results.iter().map(|(f, o)| item_json(f, o)).collect();
        println!(
            "{}",
            json!({"ok": failed == 0, "count": results.len(), "failed": failed, "exitCode": code, "elapsedMs": started.elapsed().as_millis(), "results": items})
        );
    } else {
        for (f, o) in &results {
            print_item(f, o);
        }
        if results.is_empty() {
            eprintln!("warning: no .json or .csv data files in {}", a.data_dir.display());
        }
        eprintln!("{} rendered, {} failed in {} ms", results.len() - failed, failed, started.elapsed().as_millis());
    }
    Ok(ExitCode::from(code))
}

type Signature = (u64, Option<SystemTime>);

fn signature(p: &Path) -> Option<Signature> {
    let m = std::fs::metadata(p).ok()?;
    Some((m.len(), m.modified().ok()))
}

/// Poll the data folder forever. A file is rendered once its size and
/// modification time are unchanged between two polls, and again only if it changes.
fn watch(ctx: &Ctx, jobs: usize) -> Result<ExitCode> {
    let a = ctx.a;
    let interval = Duration::from_millis(a.interval.max(50));
    if !a.json {
        eprintln!("Watching {} every {} ms (Ctrl+C to stop)", a.data_dir.display(), interval.as_millis());
    }
    let mut seen: HashMap<PathBuf, Signature> = HashMap::new();
    let mut processed: HashMap<PathBuf, Signature> = HashMap::new();
    loop {
        let files = match list_files(ctx) {
            Ok(f) => f,
            Err(e) => {
                eprintln!("warning: {e:#}");
                std::thread::sleep(interval);
                continue;
            }
        };
        let mut ready = Vec::new();
        let mut ready_sigs = Vec::new();
        for f in &files {
            let Some(sig) = signature(f) else { continue };
            if seen.get(f) == Some(&sig) && processed.get(f) != Some(&sig) {
                ready.push(f.clone());
                ready_sigs.push(sig);
            }
            seen.insert(f.clone(), sig);
        }
        seen.retain(|k, _| files.contains(k));
        processed.retain(|k, _| files.contains(k));
        if !ready.is_empty() {
            let results = run_files(ctx, &ready, jobs);
            for ((f, o), sig) in results.iter().zip(ready_sigs) {
                processed.insert(f.clone(), sig);
                if a.json {
                    println!("{}", item_json(f, o));
                    let _ = std::io::stdout().flush();
                } else {
                    print_item(f, o);
                }
            }
        }
        std::thread::sleep(interval);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stems() {
        assert_eq!(file_stem(Path::new("a/SN1.json")), "SN1");
        assert_eq!(file_stem(Path::new("SN1.data.json")), "SN1");
        assert_eq!(file_stem(Path::new("run.CSV")), "run");
        assert_eq!(file_stem(Path::new(".json")), ".json");
    }

    #[test]
    fn name_template_sees_file_and_warns_on_missing() {
        let mut notes = Vec::new();
        let f = Path::new("runs/UUT 7.json");
        assert_eq!(output_stem(Some("{{ dut.serial ?? __file }}"), &json!({}), f, "", &mut notes), "UUT 7");
        assert!(notes.is_empty(), "{notes:?}");
        assert_eq!(
            output_stem(Some("{{ dut.serial ?? __file }}"), &json!({"dut": {"serial": "A/1"}}), f, "", &mut notes),
            "A_1"
        );
        assert_eq!(output_stem(Some("SN {{ dut.serial }}"), &json!({}), f, "", &mut notes), "SN");
        assert_eq!(notes.len(), 1);
        assert!(notes[0].contains("dut"), "{notes:?}");
        notes.clear();
        assert_eq!(output_stem(Some("{{ x }}"), &json!({}), f, "", &mut notes), "UUT 7");
        assert_eq!(notes.len(), 1);
        assert_eq!(output_stem(None, &json!({}), f, "", &mut notes), "UUT 7");
    }

    #[test]
    fn claims_add_suffixes() {
        let dir = tempfile::tempdir().unwrap();
        let c = Claims::default();
        let (a, b) = (Path::new("a.json"), Path::new("b.json"));
        assert_eq!(c.claim(dir.path(), "X", a, false), dir.path().join("X.pdf"));
        assert_eq!(c.claim(dir.path(), "X", b, false), dir.path().join("X-2.pdf"));
        assert_eq!(c.claim(dir.path(), "X", a, false), dir.path().join("X.pdf"));
        std::fs::write(dir.path().join("Y.pdf"), b"old").unwrap();
        assert_eq!(c.claim(dir.path(), "Y", a, false), dir.path().join("Y-2.pdf"));
        assert_eq!(c.claim(dir.path(), "Y", b, true), dir.path().join("Y.pdf"));
        c.moved(a, Path::new("done/a.json"));
        assert_eq!(c.claim(dir.path(), "X", a, false), dir.path().join("X-3.pdf"));
    }
}
