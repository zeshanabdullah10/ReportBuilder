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

    def test_render_bytes_options(self):
        tpl = {"body": [{"type": "heading", "text": "Hello {{ who }} {{ date(now(), 'YYYY') }}"}]}
        pdf = self.rb.render_bytes(tpl, {"who": "x"}, strict=True, now="2026-03-01T10:00:00Z", font_dirs=[], pdfa=True)
        self.assertTrue(pdf.startswith(b"%PDF"))
        with self.assertRaises(ReportError) as ctx:
            self.rb.render_bytes(tpl, {}, strict=True)
        self.assertEqual(ctx.exception.code, RB_ERR_VALIDATION)
        self.assertEqual(ctx.exception.result["stage"], "strict")
        self.assertEqual(ctx.exception.result["issuesDetail"][0]["severity"], "warning")
        with self.assertRaises(ReportError) as ctx:
            self.rb.render_bytes({"body": [{"type": "text", "text": "{{ 1 + }}"}]})
        self.assertEqual(ctx.exception.result["stage"], "validate")

    def test_render_font_dirs_and_issue_detail(self):
        with tempfile.TemporaryDirectory() as d:
            r = self.rb.render(TEMPLATE, DATA, Path(d) / "f.pdf", font_dirs=[d], now="2026-03-01T10:00:00Z")
            self.assertTrue(r["ok"])
            self.assertIsInstance(r["issuesDetail"], list)
            self.assertEqual(r["warningCount"], len([i for i in r["issuesDetail"] if i["severity"] == "warning"]))

    def test_nan_from_python_floats(self):
        data = dict(DATA, measurements=[{"name": "x", "value": float("nan"), "low": float("-inf"), "high": 1.0}])
        with tempfile.TemporaryDirectory() as d:
            r = self.rb.render(TEMPLATE, data, Path(d) / "nan.pdf")
            self.assertTrue(r["ok"])

    def test_render_file_csv(self):
        with tempfile.TemporaryDirectory() as d:
            csv = Path(d) / "run.csv"
            csv.write_text("Serial;SN-1\nName;Value;Low;High;Unit\nVBUS;5,01;4,75;5,25;V\n", encoding="utf-8")
            r = self.rb.render_file(TEMPLATE, csv, Path(d) / "csv.pdf")
            self.assertTrue(r["ok"])
            self.assertTrue((Path(d) / "csv.pdf").read_bytes().startswith(b"%PDF"))
            with self.assertRaises(ReportError) as ctx:
                self.rb.render_file(TEMPLATE, Path(d) / "missing.csv", Path(d) / "x.pdf")
            self.assertEqual(ctx.exception.result["stage"], "data")

    def test_validate_error_has_stage(self):
        with self.assertRaises(ReportError) as ctx:
            self.rb.validate(TEMPLATE, "{oops")
        self.assertEqual(ctx.exception.result["stage"], "data")


if __name__ == "__main__":
    unittest.main(verbosity=2)
