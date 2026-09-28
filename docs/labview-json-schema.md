# Test data from LabVIEW

Report Builder templates accept **any JSON**: you choose the field names, and the template binds to
them. This page lists the conventions the built-in blocks understand. For the integration itself
(Call Library Function Node settings, error handling, System Exec, TestStand), see the
[LabVIEW integration guide](../integrations/labview/README.md).

## Recommended shape

```json
{
  "dut":     { "serial": "PSU-24-0012873", "model": "PSU-240", "partNumber": "900-0240-01", "revision": "C" },
  "station": { "id": "ATE-07", "operator": "J. Rivera", "softwareVersion": "TestExec 4.12.0" },
  "test":    { "name": "Final Functional Test", "start": "2026-03-01T09:14:05+01:00", "durationSeconds": 184.6 },
  "measurements": [
    { "name": "VBUS output voltage", "value": 4.995, "low": 4.75, "high": 5.25, "nominal": 5.0, "unit": "V" },
    { "name": "Ripple @ 1 A", "value": 31.7, "high": 30, "unit": "mV", "status": "FAIL" }
  ],
  "notes": "Unit reworked at C214 prior to test."
}
```

- **Measurements.** `value` with optional `low`/`high` limits. A missing or non-finite limit means
  "no limit". `status` is optional; when absent, PASS/FAIL is computed from the limits. A NaN
  value is always a FAIL. Status spellings such as `PASS`, `Passed`, `OK`, `true`, `FAIL`, `NG`
  and `false` are all understood.
- **Timestamps.** ISO 8601 strings keep the station's UTC offset. Format them in the template with
  `date(test.start, 'D MMM YYYY HH:mm')`.
- **Repeated sections.** Any list works, e.g. one entry per channel:
  `"channels": [{"name": "CH1", "results": [...]}, ...]`.

## From a LabVIEW cluster

Use **Flatten To JSON**. Cluster element labels become keys, and arrays of clusters become lists of
objects. Keep *Enable LabVIEW extensions* off. The engine accepts both UTF-8 and Windows-1252
strings.

## Checking data against a template

```
report-cli validate -t FinalTest.rbt.json -d sample.json --strict
report-cli schema -t FinalTest.rbt.json        # every field the template reads
report-cli schema --infer sample.json          # JSON Schema of your data
```
