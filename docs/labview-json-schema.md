# LabVIEW JSON Data Schema

This document describes the JSON data structure that LabVIEW should generate to populate report templates. The Report Builder uses this data to render components with actual test values.

## Quick Start

1. Create a JSON file with the structure below
2. Save it as `report_data.json` in the same directory as the exported HTML template
3. Open the HTML file in Chrome - it will automatically load and display the data

## Data Binding Syntax

Components use the `{{data.path}}` syntax to reference values from the JSON:

```
{{data.meta.reportTitle}}     → "PCB Assembly Test Report"
{{data.testInfo.operator}}    → "John Smith"
{{data.summary.passed}}       → 142
```

## Complete JSON Schema

```json
{
  "meta": {
    "reportTitle": "string",
    "reportVersion": "string",
    "generatedBy": "string",
    "projectName": "string"
  },
  "testInfo": {
    "testName": "string",
    "testDate": "ISO 8601 date string",
    "operator": "string",
    "workOrder": "string",
    "serialNumber": "string",
    "stationId": "string"
  },
  "summary": {
    "totalTests": "number",
    "passed": "number",
    "failed": "number",
    "skipped": "number",
    "passRate": "number (percentage)",
    "overallStatus": "'pass' | 'fail' | 'warning'",
    "testDuration": "string (HH:MM:SS)"
  },
  "measurements": [
    {
      "id": "number",
      "name": "string",
      "nominal": "number",
      "measured": "number",
      "unit": "string",
      "tolerance": "string",
      "status": "'pass' | 'fail' | 'warning'"
    }
  ],
  "chartData": {
    "labels": ["string", "..."],
    "values": ["number", "..."]
  },
  "scatterData": [
    {
      "x": "number",
      "y": "number",
      "label": "string (optional)"
    }
  ],
  "histogramData": {
    "bins": ["string", "..."],
    "counts": ["number", "..."]
  },
  "status": {
    "overall": "'pass' | 'fail' | 'warning'",
    "voltageTest": "'pass' | 'fail' | 'warning'",
    "currentTest": "'pass' | 'fail' | 'warning'"
  },
  "progress": {
    "completion": "number (0-100)",
    "currentStep": "string",
    "totalSteps": "number",
    "completedSteps": "number"
  },
  "specifications": {
    "title": "string",
    "items": [
      {
        "parameter": "string",
        "spec": "string",
        "actual": "string",
        "status": "'pass' | 'fail' | 'warning'"
      }
    ]
  },
  "revisions": [
    {
      "rev": "string",
      "date": "string",
      "author": "string",
      "description": "string"
    }
  ],
  "notes": "string",
  "approval": {
    "testedBy": "string",
    "testedDate": "string",
    "approvedBy": "string",
    "approvedDate": "string",
    "status": "'pending' | 'approved' | 'rejected'"
  }
}
```

## Component Binding Reference

### Text Component
| Property | Binding Path | Example Value |
|----------|-------------|---------------|
| Text Content | `{{data.meta.reportTitle}}` | "PCB Assembly Test Report" |
| Inline Text | `Test: {{data.testInfo.testName}}` | "Test: PCB Functional Test" |

### DateTime Component
| Property | Binding Path | Example Value |
|----------|-------------|---------------|
| Date Value | `{{data.testInfo.testDate}}` | "2026-02-24T14:30:00" |

### Table Component
| Property | Binding Path | Data Type |
|----------|-------------|-----------|
| Data Source | `{{data.measurements}}` | Array of objects |
| Data Source | `{{data.specifications.items}}` | Array of objects |

### Chart Component (Bar/Line)
| Property | Binding Path | Data Structure |
|----------|-------------|----------------|
| Chart Data | `{{data.chartData}}` | `{labels: [], values: []}` |

### Scatter Plot Component
| Property | Binding Path | Data Structure |
|----------|-------------|----------------|
| Points | `{{data.scatterData}}` | `[{x, y, label}]` |

### Histogram Component
| Property | Binding Path | Data Structure |
|----------|-------------|----------------|
| Distribution | `{{data.histogramData}}` | `{bins: [], counts: []}` |

### Indicator Component (Pass/Fail)
| Property | Binding Path | Expected Values |
|----------|-------------|-----------------|
| Status | `{{data.status.overall}}` | "pass", "fail", "warning" |
| Status | `{{data.summary.overallStatus}}` | "pass", "fail", "warning" |

### Test Summary Box Component
| Property | Binding Path | Example |
|----------|-------------|---------|
| Total Tests | `{{data.summary.totalTests}}` | 150 |
| Passed | `{{data.summary.passed}}` | 142 |
| Failed | `{{data.summary.failed}}` | 5 |
| Skipped | `{{data.summary.skipped}}` | 3 |
| Overall Status | `{{data.summary.overallStatus}}` | "pass" |

### Gauge Component
| Property | Binding Path | Example |
|----------|-------------|---------|
| Value | `{{data.gaugeData.mainVoltage.value}}` | 5.02 |
| Min | `{{data.gaugeData.mainVoltage.min}}` | 4.5 |
| Max | `{{data.gaugeData.mainVoltage.max}}` | 5.5 |

### Progress Bar Component
| Property | Binding Path | Example |
|----------|-------------|---------|
| Completion | `{{data.progress.completion}}` | 100 |

### Spec Box Component
| Property | Binding Path | Data Type |
|----------|-------------|-----------|
| Specifications | `{{data.specifications.items}}` | Array of spec objects |

## LabVIEW Implementation

### Basic Example (LabVIEW JSON Refnum)

```
1. Build cluster with test data
2. Flatten to JSON using "Flatten To JSON" VI
3. Write to file: report_data.json
4. Execute Chrome with HTML file
```

### Status Values

The following status values are recognized:
- **Pass indicators**: "pass", "true", "success", "ok"
- **Fail indicators**: "fail", "false", "error", "failed"  
- **Warning indicators**: "warning", "warn"

### Date/Time Formats

The DateTime component supports these formats:
- `date-short`: MM/dd/yyyy
- `date-long`: MMMM dd, yyyy
- `date-time`: MM/dd/yyyy HH:mm
- `time-only`: HH:mm
- `iso`: yyyy-MM-dd
- `custom`: Any format string

### Array Data for Tables

Tables expect an array of objects. Each object's keys become column headers (if auto-generate columns is enabled):

```json
[
  { "name": "Test 1", "value": 5.02, "unit": "V", "status": "pass" },
  { "name": "Test 2", "value": 3.31, "unit": "V", "status": "pass" }
]
```

### Chart Data Format

Charts expect an object with `labels` and `values` arrays:

```json
{
  "labels": ["Test 1", "Test 2", "Test 3"],
  "values": [95, 87, 92]
}
```

## Sample Files

- **Sample JSON**: `sample-data/component-test-sample.json`
- **Plan Document**: `plans/json-data-integration-plan.md`

## Testing in the Builder

1. Open the Report Builder
2. Click "Load JSON" or select "Component Test Sample" from the dropdown
3. Add components and set their binding properties
4. Enable Preview mode to see data populated
5. Export to HTML for offline testing

## Troubleshooting

### Data Not Showing
- Check that the binding path matches your JSON structure
- Ensure the JSON file is valid (use a JSON validator)
- Open browser console to see any runtime errors

### Wrong Data Type
- Numbers should not be quoted: `"value": 5.02` not `"value": "5.02"`
- Status values must be lowercase strings: `"pass"` not `"PASS"`

### Date Not Formatting
- Use ISO 8601 format: `"2026-02-24T14:30:00"`
- Or use a format matching the component's expected format
