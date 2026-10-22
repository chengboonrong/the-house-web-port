import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

FILE=Path(__file__).resolve().parents[1]/"scripts"/"stage-original-gamezip.py"
spec=importlib.util.spec_from_file_location("original_stager",FILE)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
ROOMS=["Title.swf","Dining room.swf","Bathroom.swf","Kitchen.swf",
       "Living room.swf","Corridor.swf","Credit.swf"]

class OriginalGamezipStagingTests(unittest.TestCase):
    def test_stages_first_game_bytes_with_original_names_and_manifest(self):
        with tempfile.TemporaryDirectory() as tmp:
            archive=Path(tmp)/"game.zip"
            with ZipFile(archive,"w") as z:
                for name in ROOMS:
                    z.writestr(mod.PREFIX+name,b"FWS-test-"+name.encode())
                z.writestr(mod.PREFIX+"index.html",b"<object>Title.swf</object>")
                z.writestr("content/files.gamezhero.com/online/house/Title.swf",b"excluded")
            dest=Path(tmp)/"public"/"original"
            report=mod.stage_gamezip(archive,dest)
            self.assertEqual(report["files"],8)
            self.assertEqual((dest/"Dining room.swf").read_bytes(),b"FWS-test-Dining room.swf")
            self.assertEqual(json.loads((dest/"port-manifest.json").read_text())["entry"],"/original/Title.swf")
            ledger=json.loads((dest/"inventory.json").read_text())
            self.assertEqual(ledger["entry"],"Title.swf")
            self.assertEqual(len(ledger["files"]),8)
            self.assertFalse((dest/"content").exists())
            with self.assertRaises(ValueError):mod.stage_gamezip(archive,dest)

    def test_rejects_missing_rooms_and_zip_path_traversal(self):
        with tempfile.TemporaryDirectory() as tmp:
            archive=Path(tmp)/"bad.zip"
            with ZipFile(archive,"w") as z:
                z.writestr(mod.PREFIX+"Title.swf",b"FWS")
            dest=Path(tmp)/"original"
            with self.assertRaisesRegex(ValueError,"incomplete"):
                mod.stage_gamezip(archive,dest)
            self.assertFalse(dest.exists())
            with ZipFile(archive,"w") as z:
                for name in ROOMS:z.writestr(mod.PREFIX+name,b"FWS")
                z.writestr(mod.PREFIX+"../escape.swf",b"bad")
            with self.assertRaisesRegex(ValueError,"Unsafe"):
                mod.stage_gamezip(archive,dest)
            self.assertFalse(dest.exists())

if __name__=="__main__":unittest.main()
