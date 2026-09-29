//! Built-in starter templates, each with realistic sample data.

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Starter {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    /// Gallery group, e.g. "Production test".
    pub category: &'static str,
    pub template: &'static str,
    pub data: &'static str,
}

macro_rules! starter {
    ($id:literal, $name:literal, $category:literal, $desc:literal) => {
        Starter {
            id: $id,
            name: $name,
            description: $desc,
            category: $category,
            template: include_str!(concat!("../templates/", $id, ".rbt.json")),
            data: include_str!(concat!("../templates/", $id, ".data.json")),
        }
    };
}

pub fn starters() -> Vec<Starter> {
    vec![
        // Production test
        starter!(
            "ate-final-test",
            "ATE Final Test",
            "Production test",
            "End-of-line functional test: verdict, measurements, trend and histogram."
        ),
        starter!(
            "test-summary",
            "Test Summary (One Page)",
            "Production test",
            "One-page operator sheet: big verdict, unit and run details, and only the measurements that failed."
        ),
        starter!(
            "multi-channel-test",
            "Multi-channel Test",
            "Production test",
            "A section per channel, repeated from data, each with chart and limits."
        ),
        starter!(
            "panel-test",
            "Panel / Multi-DUT Test",
            "Production test",
            "A panel tested in parallel: verdict per site, with detail only for the sites that failed."
        ),
        starter!(
            "lot-yield",
            "Production Lot Yield",
            "Production test",
            "Lot or shift yield: pass rate, first-pass yield, failure Pareto, cycle-time spread and failed units."
        ),
        starter!(
            "station-daily",
            "Station Daily Summary",
            "Production test",
            "Daily line summary: throughput per hour, yield per station and top failure reasons."
        ),
        // Validation and analysis
        starter!(
            "burn-in-soak",
            "Burn-in / Environmental Soak",
            "Validation and analysis",
            "Chamber temperature and unit current over a soak, with statistics, limit lines and an event log."
        ),
        starter!(
            "spc-capability",
            "Process Capability (Cpk)",
            "Validation and analysis",
            "Per-characteristic Cpk, mean and spread, with a histogram and spec limits for each."
        ),
        starter!(
            "data-log",
            "Raw Data Log (Landscape)",
            "Validation and analysis",
            "Dense wide log of every measurement with timestamps, limits and status, for audits and debugging."
        ),
        // Quality and compliance
        starter!(
            "calibration-certificate",
            "Calibration Certificate",
            "Quality and compliance",
            "ISO/IEC 17025 style certificate with as-found/as-left and uncertainty."
        ),
        starter!(
            "first-article-inspection",
            "First Article Inspection",
            "Quality and compliance",
            "AS9102-style characteristic accountability, landscape."
        ),
        starter!(
            "incoming-inspection",
            "Incoming Inspection",
            "Quality and compliance",
            "Receiving inspection against a sampling plan: measured checks, visual checklist and decision."
        ),
        starter!(
            "nonconformance-report",
            "Nonconformance Report (NCR)",
            "Quality and compliance",
            "What was found, containment, root cause, disposition and sign-off."
        ),
        starter!(
            "failure-analysis",
            "Failure Analysis (RMA)",
            "Quality and compliance",
            "Returned-unit analysis: findings with photos, root cause and corrective actions."
        ),
        // Certificates and labels
        starter!(
            "certificate-of-test",
            "Certificate of Test",
            "Certificates and labels",
            "Customer-facing one-page certificate: verdict, key results against tolerance, QR to verify."
        ),
        starter!(
            "certificate-of-conformance",
            "Certificate of Conformance",
            "Certificates and labels",
            "Shipment declaration with line items, signatory and barcode."
        ),
        starter!(
            "serial-label",
            "Serial / Pass Label",
            "Certificates and labels",
            "A 100 × 60 mm traveller or pass label: verdict, serial as barcode and QR, model and date."
        ),
        starter!("blank", "Blank Report", "Blank", "A clean page with a title, header and footer."),
    ]
}

pub fn starter(id: &str) -> Option<Starter> {
    starters().into_iter().find(|s| s.id == id)
}

#[cfg(test)]
mod tests {
    #[test]
    fn all_starters_parse() {
        for s in super::starters() {
            crate::model::Document::from_json(s.template).unwrap_or_else(|e| panic!("{}: {e}", s.id));
            serde_json::from_str::<serde_json::Value>(s.data).unwrap();
        }
    }

    /// Every starter must render with its own sample data and read only fields that data has.
    #[test]
    fn all_starters_render_cleanly_with_their_data() {
        for s in super::starters() {
            let template: serde_json::Value = serde_json::from_str(s.template).unwrap();
            let data: serde_json::Value = serde_json::from_str(s.data).unwrap();
            let report = crate::api::validate(&crate::api::ValidateRequest {
                template: template.clone(),
                data: Some(data.clone()),
            })
            .unwrap_or_else(|e| panic!("{}: {e:?}", s.id));
            let problems: Vec<_> =
                report.issues.iter().filter(|i| !matches!(i.severity, crate::validate::Severity::Info)).collect();
            assert!(problems.is_empty(), "{}: {problems:?}", s.id);
            let req = crate::api::RenderRequest {
                template,
                data,
                base_dir: None,
                now: None,
                pdf_standard: Default::default(),
            };
            let pv = crate::api::preview(&req).unwrap_or_else(|e| panic!("{}: render failed: {e:?}", s.id));
            let bad: Vec<_> =
                pv.issues.iter().filter(|i| !matches!(i.severity, crate::validate::Severity::Info)).collect();
            assert!(bad.is_empty(), "{}: render issues {bad:?}", s.id);
        }
    }

    #[test]
    fn starter_ids_and_categories_are_unique_and_set() {
        let all = super::starters();
        let mut ids: Vec<_> = all.iter().map(|s| s.id).collect();
        ids.sort();
        ids.dedup();
        assert_eq!(ids.len(), all.len());
        assert!(all.iter().all(|s| !s.category.is_empty()));
    }
}
