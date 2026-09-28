//! Built-in starter templates, each with realistic sample data.

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Starter {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub template: &'static str,
    pub data: &'static str,
}

macro_rules! starter {
    ($id:literal, $name:literal, $desc:literal) => {
        Starter {
            id: $id,
            name: $name,
            description: $desc,
            template: include_str!(concat!("../templates/", $id, ".rbt.json")),
            data: include_str!(concat!("../templates/", $id, ".data.json")),
        }
    };
}

pub fn starters() -> Vec<Starter> {
    vec![
        starter!(
            "ate-final-test",
            "ATE Final Test",
            "End-of-line functional test: verdict, measurements, trend and histogram."
        ),
        starter!(
            "calibration-certificate",
            "Calibration Certificate",
            "ISO/IEC 17025 style certificate with as-found/as-left and uncertainty."
        ),
        starter!(
            "first-article-inspection",
            "First Article Inspection",
            "AS9102-style characteristic accountability, landscape."
        ),
        starter!(
            "multi-channel-test",
            "Multi-channel Test",
            "A section per channel, repeated from data, each with chart and limits."
        ),
        starter!(
            "certificate-of-conformance",
            "Certificate of Conformance",
            "Shipment declaration with line items, signatory and barcode."
        ),
        starter!("blank", "Blank Report", "A clean page with a title, header and footer."),
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
}
