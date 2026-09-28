"""Run: python3 integrations/python/test_reportbuilder.py (needs the built library)."""
import json
import tempfile
import unittest
from pathlib import Path

from reportbuilder import ReportBuilder, ReportError, RB_ERR_VALIDATION

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "engine" / "reportcore" / "templates" / "ate-final-test.rbt.json"
DATA = json.loads((ROOT / "engine" / "reportcore" / "templates" / "ate-final-test.data.json").read_text(encoding="utf-8"))


class ReportBuilderTest(unittest.TestCase):
    rb = ReportBuilder()

    def test_version(self):
        self.assertRegex(self.rb.version, r"^\d+\.\d+\.\d+")

    def test_render_file(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / "Ünïcode dir" / "report.pdf"
            r = self.rb.render(TEMPLATE, DATA, out, pdfa=True, now="2026-03-01T10:00:00Z")
            self.assertTrue(r["ok"])
            self.assertEqual(r["pages"], 2)
            self.assertTrue(out.read_bytes().startswith(b"%PDF"))

    def test_strict_raises(self):
        with tempfile.TemporaryDirectory() as d, self.assertRaises(ReportError) as ctx:
            self.rb.render(TEMPLATE, {}, Path(d) / "x.pdf", strict=True)
        self.assertEqual(ctx.exception.code, RB_ERR_VALIDATION)

    def test_validate(self):
        r = self.rb.validate(TEMPLATE, DATA)
        self.assertTrue(r["ok"])
        self.assertIn("dut.serial", r["fields"])

    def test_render_bytes(self):
        pdf = self.rb.render_bytes({"body": [{"type": "heading", "text": "Hello {{ who }}"}]}, {"who": "world"})
        self.assertTrue(pdf.startswith(b"%PDF"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
