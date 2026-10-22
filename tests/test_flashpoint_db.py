import importlib.util
import sqlite3
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "query-flashpoint-db.py"
spec = importlib.util.spec_from_file_location("flashpoint_query", MODULE_PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class FlashpointQueryTest(unittest.TestCase):
    def test_finds_original_and_marks_namesake_as_manual(self):
        with tempfile.TemporaryDirectory() as d:
            db = str(Path(d) / "flashpoint.sqlite")
            con = sqlite3.connect(db)
            con.execute(
                'CREATE TABLE game (id TEXT, title TEXT, developer TEXT,'
                ' releaseDate TEXT, platformName TEXT, launchCommand TEXT)'
            )
            con.executemany(
                "INSERT INTO game VALUES (?, ?, ?, ?, ?, ?)",
                [
                    ("uuid-original", "The House", "Sinthai Studio", "2005", "Flash",
                     "http://sinthaistudio.com/thehouse/Title.swf"),
                    ("uuid-namesake", "The House", "Anode & Cathode", "2005", "Flash", ""),
                    ("uuid-second", "The House 2", "Sinthai Studio", "2010", "Flash", ""),
                ],
            )
            con.commit()
            con.close()
            records = mod.inspect(db)["records"]
            self.assertEqual(len(records), 3)
            self.assertEqual(
                next(x for x in records if x["uuid"] == "uuid-original")["classification"],
                "CANDIDATE_FIRST_GAME_METADATA",
            )
            self.assertEqual(
                next(x for x in records if x["uuid"] == "uuid-namesake")["classification"],
                "REVIEW_MANUALLY",
            )
            self.assertEqual(
                next(x for x in records if x["uuid"] == "uuid-second")["classification"],
                "REVIEW_MANUALLY",
            )
            self.assertEqual(
                next(x for x in records if x["uuid"] == "uuid-original")["launchCommand"],
                "http://sinthaistudio.com/thehouse/Title.swf",
            )


if __name__ == "__main__":
    unittest.main()
