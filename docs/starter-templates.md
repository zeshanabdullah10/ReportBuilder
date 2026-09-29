# Starter templates

The editor's gallery and `report-cli starters` offer these ready-made templates. Each one ships with
realistic sample data and reads only fields that data has, so it renders cleanly the moment you
open it. Point one at your own data with **New → drop your JSON** in the editor, which matches the
template's fields to yours.

```
report-cli starters                                   # list them
report-cli starters --create lot-yield -o Lot.rbt.json
```

| Group | Id | Use it for |
|---|---|---|
| Production test | `ate-final-test` | End-of-line functional test: verdict, measurements, trend, histogram |
| | `test-summary` | One-page operator sheet: big verdict, run details, only the failed measurements |
| | `multi-channel-test` | A repeated section per channel, each with chart and limits |
| | `panel-test` | A panel tested in parallel: verdict per site, detail for failed sites only |
| | `lot-yield` | Lot or shift yield, first-pass yield, failure Pareto, cycle-time spread |
| | `station-daily` | Daily line summary: throughput per hour, yield per station, top failures |
| Validation and analysis | `burn-in-soak` | Chamber temperature and unit current over a soak, with statistics and event log |
| | `spc-capability` | Cpk per characteristic with histograms and spec limits |
| | `data-log` | Dense landscape log of every measurement, for audits and debugging |
| Quality and compliance | `calibration-certificate` | ISO/IEC 17025 style certificate, as-found / as-left, uncertainty |
| | `first-article-inspection` | AS9102-style characteristic accountability |
| | `incoming-inspection` | Receiving inspection against a sampling plan, with accept/reject |
| | `nonconformance-report` | Finding, containment, root cause, disposition, sign-off |
| | `failure-analysis` | Returned-unit analysis with photos, root cause, corrective actions |
| Certificates and labels | `certificate-of-test` | Customer-facing one-page certificate with QR verification |
| | `certificate-of-conformance` | Shipment declaration with line items and signatory |
| | `serial-label` | 100 × 60 mm pass / traveller label with barcode and QR |
| Blank | `blank` | A clean page with header and footer |

## Adding one

1. Put `my-template.rbt.json` and `my-template.data.json` in `engine/reportcore/templates/`.
2. Register it with a category in `engine/reportcore/src/gallery.rs`.
3. `cargo test -p reportcore gallery` renders every starter with its own data and fails on any
   validation or render issue, so a typo in a field name is caught there.

Expressions that fail evaluate to empty rather than erroring, so also look at the rendered page:
`report-cli render -t T.rbt.json -d D.json -o out --svg`.
