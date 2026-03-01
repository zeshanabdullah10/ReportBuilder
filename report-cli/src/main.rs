//! Report CLI - Generate PDF reports from HTML templates and JSON data
//!
//! Usage:
//!   report-cli --template Report.html --data test_results.json --output Report.pdf
//!
//! The CLI reads an HTML template with a placeholder, injects JSON data,
//! and generates a PDF using a headless Chrome browser.

use anyhow::{Context, Result};
use clap::Parser;
use headless_chrome::{Browser, types::PrintToPdfOptions};
use regex::Regex;
use std::fs;
use std::path::PathBuf;
use std::time::Duration;

/// Generate PDF reports from HTML templates and JSON data
#[derive(Parser, Debug)]
#[command(name = "report-cli")]
#[command(author, version, about, long_about = None)]
struct Args {
    /// HTML template file path
    #[arg(short, long, value_name = "FILE")]
    template: PathBuf,

    /// JSON data file path
    #[arg(short, long, value_name = "FILE")]
    data: PathBuf,

    /// Output PDF file path
    #[arg(short, long, value_name = "FILE")]
    output: PathBuf,

    /// Wait time for JavaScript rendering in milliseconds
    #[arg(short, long, default_value = "2000")]
    wait: u64,

    /// Page format (A4, Letter, Legal)
    #[arg(short, long, default_value = "A4")]
    format: String,

    /// Page margin in millimeters
    #[arg(short, long, default_value = "20")]
    margin: f64,

    /// Exclude page headers and footers
    #[arg(long)]
    no_header_footer: bool,

    /// Verbose output
    #[arg(short, long)]
    verbose: bool,
}

fn main() -> Result<()> {
    let args = Args::parse();

    if args.verbose {
        println!("[report-cli] Starting report generation...");
        println!("[report-cli] Template: {:?}", args.template);
        println!("[report-cli] Data: {:?}", args.data);
        println!("[report-cli] Output: {:?}", args.output);
    }

    // 1. Read HTML template
    if args.verbose {
        println!("[report-cli] Reading HTML template...");
    }
    let html = fs::read_to_string(&args.template)
        .with_context(|| format!("Failed to read template file: {:?}", args.template))?;

    // 2. Read JSON data
    if args.verbose {
        println!("[report-cli] Reading JSON data...");
    }
    let json_data = fs::read_to_string(&args.data)
        .with_context(|| format!("Failed to read data file: {:?}", args.data))?;

    // Validate JSON
    serde_json::from_str::<serde_json::Value>(&json_data)
        .with_context(|| "Invalid JSON data file")?;

    // 3. Inject data into HTML
    if args.verbose {
        println!("[report-cli] Injecting data into HTML...");
    }
    let filled_html = inject_data(&html, &json_data)?;

    // 4. Create temporary HTML file
    let temp_html_path = args.output.with_extension("tmp.html");
    fs::write(&temp_html_path, &filled_html)
        .with_context(|| format!("Failed to write temporary file: {:?}", temp_html_path))?;

    if args.verbose {
        println!("[report-cli] Temporary HTML written to: {:?}", temp_html_path);
    }

    // 5. Generate PDF using headless Chrome
    if args.verbose {
        println!("[report-cli] Launching headless browser...");
    }

    let result = generate_pdf(&temp_html_path, &args);

    // 6. Cleanup temporary file
    if args.verbose {
        println!("[report-cli] Cleaning up temporary file...");
    }
    let _ = fs::remove_file(&temp_html_path);

    result?;

    println!("Report generated: {:?}", args.output);
    Ok(())
}

/// Inject JSON data into HTML by replacing the placeholder
fn inject_data(html: &str, json_data: &str) -> Result<String> {
    // Pattern: window.REPORT_DATA = null; // {{REPORT_DATA_PLACEHOLDER}}
    let pattern = r#"window\.REPORT_DATA\s*=\s*null;\s*//\s*\{\{REPORT_DATA_PLACEHOLDER\}\}"#;
    let regex = Regex::new(pattern)
        .with_context(|| "Failed to compile placeholder regex")?;

    // Replace with actual data
    let replacement = format!("window.REPORT_DATA = {};", json_data.trim());
    let filled_html = regex.replace(html, &replacement).to_string();

    // Verify replacement happened
    if !html.contains("REPORT_DATA_PLACEHOLDER") {
        anyhow::bail!(
            "Template does not contain the data placeholder. \
             Add this to your HTML template:\n\
             window.REPORT_DATA = null; // {{REPORT_DATA_PLACEHOLDER}}"
        );
    }

    Ok(filled_html)
}

/// Generate PDF using headless Chrome
fn generate_pdf(temp_html_path: &PathBuf, args: &Args) -> Result<()> {
    // Get absolute path for file:// URL
    let abs_path = fs::canonicalize(temp_html_path)
        .with_context(|| "Failed to get absolute path")?;
    
    // Convert to proper file:// URL format for Windows
    let path_str = abs_path.to_string_lossy();
    // Remove Windows \\?\ prefix if present
    let clean_path = path_str
        .strip_prefix(r"\\?\")
        .unwrap_or(&path_str)
        .replace('\\', "/");
    let file_url = format!("file:///{}", clean_path);

    if args.verbose {
        println!("[report-cli] Loading URL: {}", file_url);
    }

    // Launch browser
    let browser = Browser::default()
        .with_context(|| "Failed to launch headless browser. Make sure Chrome is installed.")?;

    let tab = browser.new_tab()
        .with_context(|| "Failed to create browser tab")?;

    // Navigate to the HTML file
    tab.navigate_to(&file_url)
        .with_context(|| "Failed to navigate to HTML file")?;

    // Wait for page to load
    tab.wait_for_element("body")
        .with_context(|| "Failed to wait for page load")?;

    // Additional wait for JavaScript to complete
    if args.verbose {
        println!("[report-cli] Waiting {}ms for JavaScript to render...", args.wait);
    }
    std::thread::sleep(Duration::from_millis(args.wait));

    // Calculate page dimensions (in inches)
    let (paper_width, paper_height) = match args.format.to_uppercase().as_str() {
        "A4" => (8.27, 11.69),      // A4 in inches
        "LETTER" => (8.5, 11.0),    // Letter in inches
        "LEGAL" => (8.5, 14.0),     // Legal in inches
        _ => (8.27, 11.69),         // default to A4
    };

    let margin_inches = args.margin / 25.4;

    if args.verbose {
        println!("[report-cli] Generating PDF...");
    }

    // PDF options
    let pdf_options = PrintToPdfOptions {
        paper_width: Some(paper_width),
        paper_height: Some(paper_height),
        margin_top: Some(margin_inches),
        margin_bottom: Some(margin_inches),
        margin_left: Some(margin_inches),
        margin_right: Some(margin_inches),
        print_background: Some(true),
        display_header_footer: Some(!args.no_header_footer),
        ..Default::default()
    };

    // Generate PDF
    let pdf_data = tab.print_to_pdf(Some(pdf_options))
        .with_context(|| "Failed to generate PDF")?;

    // Save PDF
    fs::write(&args.output, &pdf_data)
        .with_context(|| format!("Failed to write PDF file: {:?}", args.output))?;

    if args.verbose {
        println!("[report-cli] PDF saved successfully");
    }

    Ok(())
}
