use std::process::Command;

fn cli() -> Command {
    Command::new(env!("CARGO_BIN_EXE_report-cli"))
}

fn starter(dir: &std::path::Path) -> std::path::PathBuf {
    let t = dir.join("ate.rbt.json");
    let st = cli().args(["starters", "--create", "ate-final-test", "-o"]).arg(&t).status().unwrap();
    assert!(st.success());
    t
}

#[test]
fn render_legacy_flags_and_json() {
    let dir = tempfile::tempdir().unwrap();
    let t = starter(dir.path());
    let data = dir.path().join("ate.data.json");
    let out = dir.path().join("sub/out.pdf");
    let o = cli().arg("-t").arg(&t).arg("-d").arg(&data).arg("-o").arg(&out).arg("--json").output().unwrap();
    assert!(o.status.success(), "{}", String::from_utf8_lossy(&o.stderr));
    let v: serde_json::Value = serde_json::from_slice(&o.stdout).unwrap();
    assert_eq!(v["ok"], true);
    assert_eq!(v["pages"], 2);
    assert!(std::fs::read(&out).unwrap().starts_with(b"%PDF"));
    assert!(!dir.path().join("sub/out.pdf.partial").exists());
}

#[test]
fn exit_codes() {
    let dir = tempfile::tempdir().unwrap();
    let t = starter(dir.path());
    let partial = dir.path().join("partial.json");
    // Windows-1252 bytes (µ = 0xB5), as LabVIEW writes them, must be accepted.
    std::fs::write(&partial, b"{\"dut\": {\"model\": \"5 \xb5A\"}}").unwrap();
    let out = dir.path().join("p.pdf");
    // Missing data renders (exit 0) but fails under --strict (exit 2).
    assert_eq!(
        cli().arg("render").arg("-t").arg(&t).arg("-d").arg(&partial).arg("-o").arg(&out).status().unwrap().code(),
        Some(0)
    );
    assert_eq!(
        cli()
            .arg("render")
            .arg("-t")
            .arg(&t)
            .arg("-d")
            .arg(&partial)
            .arg("-o")
            .arg(&out)
            .arg("--strict")
            .status()
            .unwrap()
            .code(),
        Some(2)
    );
    let bad = dir.path().join("bad.rbt.json");
    std::fs::write(&bad, r#"{"body":[{"type":"text","text":"{{ 1 + }}"}]}"#).unwrap();
    assert_eq!(cli().arg("validate").arg("-t").arg(&bad).status().unwrap().code(), Some(2));
    assert_eq!(
        cli()
            .arg("render")
            .arg("-t")
            .arg(dir.path().join("nope.rbt.json"))
            .arg("-o")
            .arg(&out)
            .status()
            .unwrap()
            .code(),
        Some(1)
    );
}

#[test]
fn batch_names_files_from_data() {
    let dir = tempfile::tempdir().unwrap();
    let t = starter(dir.path());
    let runs = dir.path().join("runs");
    std::fs::create_dir(&runs).unwrap();
    for sn in ["A1", "B2", "C3"] {
        std::fs::write(
            runs.join(format!("{sn}.json")),
            format!(r#"{{"dut": {{"serial": "{sn}/x"}}, "measurements": []}}"#),
        )
        .unwrap();
    }
    let pdfs = dir.path().join("pdfs");
    let o = cli()
        .arg("batch")
        .arg("-t")
        .arg(&t)
        .arg("--data-dir")
        .arg(&runs)
        .arg("--out-dir")
        .arg(&pdfs)
        .args(["--name", "SN {{ dut.serial }}", "--json", "-j", "2"])
        .output()
        .unwrap();
    assert!(o.status.success(), "{}", String::from_utf8_lossy(&o.stderr));
    let mut names: Vec<String> =
        std::fs::read_dir(&pdfs).unwrap().map(|e| e.unwrap().file_name().into_string().unwrap()).collect();
    names.sort();
    assert_eq!(names, vec!["SN A1_x.pdf", "SN B2_x.pdf", "SN C3_x.pdf"]);
}

#[test]
fn migrate_and_schema() {
    let dir = tempfile::tempdir().unwrap();
    let legacy = dir.path().join("legacy.json");
    std::fs::write(&legacy, r#"{"ROOT":{"type":{"resolvedName":"Page"},"nodes":["a"]},"a":{"type":{"resolvedName":"Text"},"props":{"text":"Serial {{data.sn}}"}}}"#).unwrap();
    let out = dir.path().join("new.rbt.json");
    assert!(cli().arg("migrate").arg(&legacy).arg("-o").arg(&out).status().unwrap().success());
    let o = cli().arg("schema").arg("-t").arg(&out).output().unwrap();
    assert_eq!(String::from_utf8_lossy(&o.stdout).trim(), "sn");
}

const SIMPLE: &str = r#"{"body":[{"id":"h","type":"heading","text":"SN {{ dut.serial }}"}]}"#;

fn simple_template(dir: &std::path::Path) -> std::path::PathBuf {
    let t = dir.join("simple.rbt.json");
    std::fs::write(&t, SIMPLE).unwrap();
    t
}

fn json_line(o: &std::process::Output) -> serde_json::Value {
    serde_json::from_slice(&o.stdout).unwrap_or_else(|e| panic!("{e}: {}", String::from_utf8_lossy(&o.stdout)))
}

#[test]
fn render_csv_nan_and_json_io_errors() {
    let dir = tempfile::tempdir().unwrap();
    let t = starter(dir.path());
    let out = dir.path().join("o.pdf");
    // CSV data with a preamble and measurement columns.
    let csv = dir.path().join("run.csv");
    std::fs::write(&csv, "Serial,SN-77\nParameter,Measured,Min,Max,Units\nVBUS,5.01,4.75,5.25,V\n").unwrap();
    let o =
        cli().arg("render").arg("-t").arg(&t).arg("-d").arg(&csv).arg("-o").arg(&out).arg("--json").output().unwrap();
    assert_eq!(o.status.code(), Some(0), "{}", String::from_utf8_lossy(&o.stderr));
    assert_eq!(json_line(&o)["ok"], true);
    // Bare NaN / -Infinity, as LabVIEW writes them.
    let nan = dir.path().join("nan.json");
    std::fs::write(
        &nan,
        r#"{"dut": {"serial": "N1"}, "measurements": [{"name": "x", "value": NaN, "low": -Infinity, "high": 1}]}"#,
    )
    .unwrap();
    let o =
        cli().arg("render").arg("-t").arg(&t).arg("-d").arg(&nan).arg("-o").arg(&out).arg("--json").output().unwrap();
    assert_eq!(o.status.code(), Some(0), "{}", String::from_utf8_lossy(&o.stderr));
    assert!(json_line(&o)["issuesDetail"].is_array());

    // I/O errors still print one JSON line with a stage.
    let o = cli()
        .arg("render")
        .arg("-t")
        .arg(dir.path().join("nope.rbt.json"))
        .arg("-o")
        .arg(&out)
        .arg("--json")
        .output()
        .unwrap();
    assert_eq!(o.status.code(), Some(1));
    let v = json_line(&o);
    assert_eq!((v["ok"].clone(), v["stage"].clone()), (serde_json::json!(false), serde_json::json!("template")));
    let o = cli()
        .arg("render")
        .arg("-t")
        .arg(&t)
        .arg("-d")
        .arg(dir.path().join("missing.json"))
        .arg("-o")
        .arg(&out)
        .arg("--json")
        .output()
        .unwrap();
    assert_eq!(o.status.code(), Some(1));
    assert_eq!(json_line(&o)["stage"], "data");
    // Output path under a file → io
    let o = cli().arg("render").arg("-t").arg(&t).arg("-o").arg(csv.join("x.pdf")).arg("--json").output().unwrap();
    assert_eq!(o.status.code(), Some(1));
    assert_eq!(json_line(&o)["stage"], "io");
}

#[test]
fn batch_collisions_csv_recursive_done_dir_and_exit_codes() {
    let dir = tempfile::tempdir().unwrap();
    let t = simple_template(dir.path());
    let runs = dir.path().join("runs");
    std::fs::create_dir_all(runs.join("sub")).unwrap();
    std::fs::write(runs.join("a.json"), r#"{"dut": {"serial": "S1"}}"#).unwrap();
    std::fs::write(runs.join("b.json"), r#"{"dut": {"serial": "S1"}}"#).unwrap();
    std::fs::write(runs.join("sub/c.csv"), "a,b,c\n1,2,3\n").unwrap();
    std::fs::write(runs.join("simple.rbt.json"), SIMPLE).unwrap(); // templates are never data
    let pdfs = dir.path().join("pdfs");
    let done = dir.path().join("done");
    let o = cli()
        .arg("batch")
        .arg("-t")
        .arg(&t)
        .arg("--data-dir")
        .arg(&runs)
        .arg("--out-dir")
        .arg(&pdfs)
        .arg("--done-dir")
        .arg(&done)
        .args(["--name", "{{ dut.serial ?? __file }}", "--recursive", "--json", "--now", "2026-03-01T10:00:00Z"])
        .output()
        .unwrap();
    assert_eq!(o.status.code(), Some(0), "{}", String::from_utf8_lossy(&o.stderr));
    let v = json_line(&o);
    assert_eq!(v["count"], 3);
    let mut names: Vec<String> =
        std::fs::read_dir(&pdfs).unwrap().map(|e| e.unwrap().file_name().into_string().unwrap()).collect();
    names.sort();
    assert_eq!(names, vec!["S1-2.pdf", "S1.pdf", "c.pdf"]);
    assert_eq!(v["results"][1]["renamedFrom"].as_str().map(|p| p.ends_with("S1.pdf")), Some(true));
    assert!(done.join("a.json").exists() && done.join("b.json").exists() && done.join("sub/c.csv").exists());
    assert!(!runs.join("a.json").exists());

    // A second run never overwrites earlier PDFs.
    std::fs::write(runs.join("a.json"), r#"{"dut": {"serial": "S1"}}"#).unwrap();
    let o = cli()
        .arg("batch")
        .arg("-t")
        .arg(&t)
        .arg("--data-dir")
        .arg(&runs)
        .arg("--out-dir")
        .arg(&pdfs)
        .args(["--name", "{{ dut.serial }}"])
        .output()
        .unwrap();
    assert_eq!(o.status.code(), Some(0));
    assert!(pdfs.join("S1-3.pdf").exists());
    assert!(String::from_utf8_lossy(&o.stderr).contains("already taken"));

    // Missing --name field warns; strict failure → 2; bad JSON → 1; most severe wins.
    std::fs::remove_file(runs.join("a.json")).unwrap();
    std::fs::write(runs.join("empty.json"), "{}").unwrap();
    let base = || {
        let mut c = cli();
        c.arg("batch").arg("-t").arg(&t).arg("--data-dir").arg(&runs).arg("--out-dir").arg(&pdfs);
        c
    };
    let o = base().args(["--name", "SN{{ dut.serial }}", "--json"]).output().unwrap();
    assert_eq!(o.status.code(), Some(0));
    assert!(json_line(&o)["results"][0]["notes"][0].as_str().unwrap().contains("missing"));
    assert_eq!(base().arg("--strict").status().unwrap().code(), Some(2));
    std::fs::write(runs.join("bad.json"), "{oops").unwrap();
    std::fs::remove_file(runs.join("empty.json")).unwrap();
    let o = base().arg("--json").output().unwrap();
    assert_eq!(o.status.code(), Some(1));
    assert_eq!(json_line(&o)["results"][0]["stage"], "data");
    // Broken --name is a usage error.
    assert_eq!(base().args(["--name", "{{ 1 + }}"]).status().unwrap().code(), Some(1));
}

#[test]
fn batch_watch_renders_new_files_once() {
    let dir = tempfile::tempdir().unwrap();
    let t = simple_template(dir.path());
    let runs = dir.path().join("in");
    let pdfs = dir.path().join("out");
    std::fs::create_dir_all(&runs).unwrap();
    let mut child = cli()
        .arg("batch")
        .arg("-t")
        .arg(&t)
        .arg("--data-dir")
        .arg(&runs)
        .arg("--out-dir")
        .arg(&pdfs)
        .args(["--watch", "--interval", "100", "--json"])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null())
        .spawn()
        .unwrap();
    std::thread::sleep(std::time::Duration::from_millis(300));
    std::fs::write(runs.join("w1.json"), r#"{"dut": {"serial": "W1"}}"#).unwrap();
    let pdf = pdfs.join("w1.pdf");
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(30);
    while !pdf.exists() && std::time::Instant::now() < deadline {
        std::thread::sleep(std::time::Duration::from_millis(50));
    }
    assert!(pdf.exists(), "watch did not render the new file");
    let first = std::fs::metadata(&pdf).unwrap().modified().unwrap();
    std::thread::sleep(std::time::Duration::from_millis(600));
    assert_eq!(std::fs::metadata(&pdf).unwrap().modified().unwrap(), first, "unchanged file was re-rendered");
    child.kill().unwrap();
    let out = child.wait_with_output().unwrap();
    let lines: Vec<serde_json::Value> =
        String::from_utf8_lossy(&out.stdout).lines().map(|l| serde_json::from_str(l).unwrap()).collect();
    assert_eq!(lines.len(), 1, "{lines:?}");
    assert_eq!(lines[0]["ok"], true);
}

#[test]
fn import_and_pack() {
    let dir = tempfile::tempdir().unwrap();
    let csv = dir.path().join("m.csv");
    std::fs::write(&csv, "\u{feff}Serial;SN1\nName;Value;Low;High\nV;1,5;1;2\n").unwrap();
    let o = cli().arg("import").arg(&csv).output().unwrap();
    assert!(o.status.success());
    assert_eq!(
        json_line(&o),
        serde_json::json!({"serial": "SN1", "measurements": [{"name": "V", "value": 1.5, "low": 1, "high": 2}]})
    );
    let out = dir.path().join("m.json");
    assert!(cli().arg("import").arg(&csv).arg("-o").arg(&out).status().unwrap().success());
    assert!(std::fs::read_to_string(&out).unwrap().contains("measurements"));

    std::fs::write(dir.path().join("logo.svg"), "<svg xmlns='http://www.w3.org/2000/svg'/>").unwrap();
    let t = dir.path().join("t.rbt.json");
    std::fs::write(
        &t,
        r#"{"theme":{"logo":"logo.svg"},"body":[{"id":"i","type":"image","src":"logo.svg"},{"id":"d","type":"image","src":"{{ pic }}"}]}"#,
    )
    .unwrap();
    let packed = dir.path().join("dist/packed.rbt.json");
    let o = cli().arg("pack").arg("-t").arg(&t).arg("-o").arg(&packed).arg("--json").output().unwrap();
    assert!(o.status.success(), "{}", String::from_utf8_lossy(&o.stderr));
    let v = json_line(&o);
    assert_eq!(v["inlined"].as_array().unwrap().len(), 2);
    assert_eq!(v["skipped"][0]["at"], "d.src");
    let p: serde_json::Value = serde_json::from_str(&std::fs::read_to_string(&packed).unwrap()).unwrap();
    assert!(p["body"][0]["src"].as_str().unwrap().starts_with("data:image/svg+xml;base64,"));
    assert_eq!(
        cli().arg("pack").arg("-t").arg(&t).arg("-o").arg(&packed).arg("--strict").status().unwrap().code(),
        Some(2)
    );
    // The packed template renders from anywhere.
    let pdf = dir.path().join("p.pdf");
    let o = cli().arg("render").arg("-t").arg(&packed).arg("-o").arg(&pdf).output().unwrap();
    assert!(o.status.success(), "{}", String::from_utf8_lossy(&o.stderr));
}

#[test]
fn schema_types_and_unknown_settings() {
    let dir = tempfile::tempdir().unwrap();
    let t = dir.path().join("t.rbt.json");
    std::fs::write(
        &t,
        r#"{"sampleData":{"dut":{"serial":"A"},"m":[{"value":1.5}]},"body":[
            {"id":"h","type":"heading","text":"SN {{ dut.serial }}"},
            {"id":"m","type":"measurementTable","source":"m","sorce":"x"}]}"#,
    )
    .unwrap();
    let o = cli().arg("schema").arg("-t").arg(&t).arg("--json-schema").output().unwrap();
    let s: serde_json::Value = serde_json::from_slice(&o.stdout).unwrap();
    assert_eq!(s["properties"]["m"]["items"]["properties"]["value"]["type"], "number");
    let o = cli().arg("schema").arg("-t").arg(&t).args(["--types", "csharp"]).output().unwrap();
    assert!(String::from_utf8_lossy(&o.stdout).contains("public class"));
    let o = cli().arg("validate").arg("-t").arg(&t).output().unwrap();
    let all = format!("{}{}", String::from_utf8_lossy(&o.stdout), String::from_utf8_lossy(&o.stderr));
    assert!(all.contains("unknown setting 'sorce'"), "{all}");
}
