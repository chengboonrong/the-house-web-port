#!/usr/bin/env python3
"""Verify an existing Flashpoint GameZIP without extraction or network access.

No proprietary assets are written. Reports metadata, original virtual URL paths,
SWF magic headers, and per-file SHA-256 for research provenance.
"""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit
from zipfile import ZipFile, BadZipFile

MAX_FILES = 5000
MAX_FILE_BYTES = 64 * 1024 * 1024
MAX_TOTAL_BYTES = 256 * 1024 * 1024

def command_to_entry(command):
    command = str(command or "").strip().strip('"\'')
    if not command:
        return None
    parsed = urlsplit(command)
    if parsed.scheme.lower() not in ("http", "https") or not parsed.netloc:
        return None
    if not parsed.path.lower().endswith(".swf"):
        return None
    return "content/" + parsed.netloc + parsed.path

def inspect(path):
    archive = Path(path)
    with ZipFile(archive) as z:
        infos = z.infolist()
        if len(infos) > MAX_FILES:
            raise ValueError("Too many ZIP entries")
        if sum(i.file_size for i in infos) > MAX_TOTAL_BYTES:
            raise ValueError("Uncompressed ZIP size exceeds safety limit")
        records = []
        json_data = None
        names = set()
        for item in infos:
            name = item.filename
            parts = name.replace("\\", "/").split("/")
            if name in names:
                raise ValueError("Duplicate ZIP entry: " + name)
            names.add(name)
            if name.startswith("/") or any(p in ("..", "") for p in parts if p != parts[-1]):
                raise ValueError("Unsafe ZIP entry: " + name)
            if item.is_dir():
                continue
            if item.file_size > MAX_FILE_BYTES:
                raise ValueError("Oversized ZIP entry: " + name)
            with z.open(item) as stream:
                first = stream.read(8)
                digest = hashlib.sha256()
                digest.update(first)
                total = len(first)
                while True:
                    chunk = stream.read(1024 * 1024)
                    if not chunk:
                        break
                    digest.update(chunk)
                    total += len(chunk)
                if total != item.file_size:
                    raise ValueError("Entry size mismatch: " + name)
            if name == "content.json":
                if item.file_size > 1024 * 1024:
                    raise ValueError("Oversized content.json")
                json_data = json.loads(z.read(item).decode("utf-8-sig"))
            if name.lower().endswith(".swf") or name == "content.json":
                records.append({"path":name,"size":item.file_size,
                                "sha256":digest.hexdigest(),
                                "swfSignature": first[:3].decode("ascii", errors="replace")
                                if name.lower().endswith(".swf") else None})
        commands = []
        if isinstance(json_data, dict):
            for key in ("launchCommand", "legacyLaunchCommand"):
                if isinstance(json_data.get(key), str):
                    commands.append(json_data[key])
        entry_candidates = [{"launchCommand":c, "zipEntry": command_to_entry(c),
                             "present": command_to_entry(c) in names}
                            for c in commands]
        return {"format":"flashpoint-gamezip-audit-v1",
                "archive":archive.name,
                "entryCount":len(infos),
                "contentJsonFound":isinstance(json_data,dict),
                "contentJsonKeys":sorted(json_data.keys()) if isinstance(json_data,dict) else [],
                "entryCandidates":entry_candidates,
                "swfFiles":[r for r in records if r["path"].lower().endswith(".swf")],
                "notice":"ZIP evidence only. Inspect original source and licensing independently."}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zip", help="Path to a pre-existing, lawfully obtained Flashpoint GameZIP")
    args = parser.parse_args()
    try:
        print(json.dumps(inspect(args.zip), indent=2, ensure_ascii=False))
    except (BadZipFile, ValueError, OSError, json.JSONDecodeError) as exc:
        parser.exit(1, f"GameZIP audit failed: {exc}\n")
