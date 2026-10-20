import importlib.util
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "audit-flashpoint-gamezip.py"
spec = importlib.util.spec_from_file_location("gamezip_audit", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class GamezipAuditTests(unittest.TestCase):
    def test_hashes_original_swf_and_preserves_virtual_path(self):
        with tempfile.TemporaryDirectory() as td:
            archive = Path(td) / "sample.zip"
            with ZipFile(archive, "w") as z:
                z.writestr("content.json", '{"launchCommand":"https://sinthaistudio.com/thehouse/Diningroom.swf"}')
                z.writestr("content/sinthaistudio.com/thehouse/Diningroom.swf", b"FWS\\x08test")
            report = mod.inspect(archive)
            self.assertEqual(report["entryCount"], 2)
            self.assertTrue(report["entryCandidates"][0]["present"])
            self.assertEqual(report["swfFiles"][0]["swfSignature"], "FWS")
            self.assertEqual(len(report["swfFiles"][0]["sha256"]), 64)
    def test_flags_missing_entry_and_rejects_traversal(self):
        with tempfile.TemporaryDirectory() as td:
            archive = Path(td) / "missing.zip"
            with ZipFile(archive,"w") as z:
                z.writestr("content.json",'{"launchCommand":"http://a.example/game.swf"}')
            self.assertFalse(mod.inspect(archive)["entryCandidates"][0]["present"])
            evil = Path(td) / "bad.zip"
            with ZipFile(evil,"w") as z:
                z.writestr("../escape.swf", b"FWSbad")
            with self.assertRaises(ValueError):
                mod.inspect(evil)
    def test_ignores_non_swf_launcher(self):
        self.assertIsNone(mod.command_to_entry("http://example.com/index.html"))

if __name__ == "__main__":
    unittest.main()
