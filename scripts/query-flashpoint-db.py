#!/usr/bin/env python3
"""Read-only query of a user-owned Flashpoint SQLite metadata database.

No network access or GameZIP download. Print likely Sinthai The House (2005)
records, including UUID and launch command when present.
"""
import argparse
import json
import sqlite3
from pathlib import Path

def inspect(database: str):
    uri = Path(database).resolve().as_uri() + "?mode=ro"
    con = sqlite3.connect(uri, uri=True)
    try:
        tables = {
            row[0] for row in con.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            )
        }
        candidates = []
        for table in sorted(tables):
            if table.lower() not in {"game", "games"}:
                continue
            quoted = '"' + table.replace('"', '""') + '"'
            columns = [row[1] for row in con.execute("PRAGMA table_info(" + quoted + ")")]
            lookup = {name.lower().replace("_", ""): name for name in columns}
            titlecol = lookup.get("title") or lookup.get("name")
            if not titlecol:
                continue
            selected = {}
            for field, variants in {
                "uuid": ("id", "uuid", "gameid"),
                "title": ("title", "name"),
                "developer": ("developer",),
                "releaseDate": ("releasedate", "date"),
                "platform": ("platform", "platformname"),
                "launchCommand": ("launchcommand", "url"),
                "source": ("source",),
                "notes": ("notes",),
            }.items():
                for variant in variants:
                    if variant in lookup:
                        selected[field] = lookup[variant]
                        break
            sql_columns = ", ".join(
                '"' + col.replace('"', '""') + '"' for col in selected.values()
            )
            where = '"' + titlecol.replace('"', '""') + '" LIKE ?'
            rows = con.execute(
                f"SELECT {sql_columns} FROM {quoted} WHERE {where} LIMIT 200",
                ("%house%",),
            )
            for row in rows:
                game = dict(zip(selected, row))
                title = str(game.get("title") or "").strip()
                developer = str(game.get("developer") or "").strip()
                if not (title.casefold() == "the house" or
                        ("sinthai" in developer.casefold() and "house" in title.casefold())):
                    continue
                exact = title.casefold() == "the house"
                original_developer = "sinthai" in developer.casefold()
                possible_sequel = title.casefold().replace(" ", "") in {"thehouse2", "thehouseii"}
                game.update(
                    table=table,
                    classification=(
                        "CANDIDATE_FIRST_GAME_METADATA"
                        if exact and original_developer and not possible_sequel
                        else "REVIEW_MANUALLY"
                    ),
                )
                candidates.append(game)
        return {"format": "flashpoint-the-house-local-db-review-v1",
                "database": str(Path(database).name), "records": candidates,
                "warning": "Metadata is not proof of binary authenticity, availability or redistribution rights."}
    finally:
        con.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database", help="Path to installed Flashpoint Data/flashpoint.sqlite")
    args = parser.parse_args()
    print(json.dumps(inspect(args.database), indent=2, ensure_ascii=False, default=str))
