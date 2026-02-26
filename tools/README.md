# PDF Generation Tool

A self-contained batch script to generate PDFs from HTML templates with JSON data injection.

## Requirements

- Windows 7 or later (PowerShell built-in)
- Chrome, Edge, or Chromium browser installed

## Usage

```batch
generate-pdf.bat <html_file> <json_file> <output_pdf>
```

### Examples

```batch
# Basic usage (files in current directory)
generate-pdf.bat report.html report_data.json output.pdf

# With full paths
generate-pdf.bat "C:\Reports\Template.html" "C:\Data\test_data.json" "C:\Output\Report.pdf"

# Called from LabVIEW (use System Exec.vi)
cmd /c "C:\Path\to\generate-pdf.bat" "report.html" "data.json" "report.pdf"
```

## How It Works

1. **Port Detection** - Automatically finds an available port (8080-8100)
2. **Browser Detection** - Finds Chrome, Edge, or Chromium installation
3. **HTTP Server** - Starts a lightweight PowerShell HTTP server
4. **PDF Generation** - Uses headless Chrome to print to PDF
5. **Cleanup** - Automatically closes the server

## HTML Template Requirements

The HTML template should use the `?data=` query parameter to load JSON data:

```javascript
// The runtime automatically reads ?data=filename.json from the URL
// and fetches that file for data binding
```

For exported templates from LabVIEW Report Builder, this is handled automatically.

## Integration with LabVIEW

Use the **System Exec.vi** to call the batch script:

1. Place `generate-pdf.bat` in a known location
2. In LabVIEW, use System Exec.vi with command:
   ```
   cmd /c "C:\path\to\generate-pdf.bat" "template.html" "data.json" "output.pdf"
   ```
3. Check the return code (0 = success, non-zero = error)

## Troubleshooting

### "Could not find Chrome or Edge browser"
- Install Chrome or Edge browser
- Or modify the script to include your browser path

### "PDF generation failed"
- Ensure the HTML file exists and is valid
- Check that the JSON file is valid JSON
- Try opening the HTML in a browser manually to debug

### "Could not find available port"
- Close applications using ports 8080-8100
- Or modify the `MAX_PORT` variable in the script

## Files

| File | Description |
|------|-------------|
| `generate-pdf.bat` | Main batch script |
| `README.md` | This documentation |
