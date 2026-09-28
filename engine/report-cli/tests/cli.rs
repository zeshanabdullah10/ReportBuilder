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
