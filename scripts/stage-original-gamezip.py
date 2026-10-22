#!/usr/bin/env python3
"""Stage an authorized Sinthai The House 2005 GameZIP for LOCAL Ruffle research.

Extracts ONLY the verified original website subtree, preserving relative paths
and exact bytes. Does not fetch, modify or redistribute original game files.
Refuses to overwrite an existing staging tree.
"""
import argparse
import hashlib
import json
import os
import re
import stat
from pathlib import Path
from zipfile import ZipFile

PREFIX = "content/www.sinthaistudio.com/thehouse1/"
ENTRY = "Title.swf"
MAX_ENTRIES = 100
MAX_TOTAL = 16_000_000
MAX_SINGLE = 4_000_000
SAFE_NAME = re.compile(r"^[A-Za-z0-9_. /-]+$")

def stage_gamezip(zip_path, destination):
    destination = Path(destination).resolve()
    if destination.exists() or destination.is_symlink():
        raise ValueError("Refusing to overwrite existing local research directory")
    selected = []
    size = 0
    with ZipFile(zip_path) as archive:
        for info in archive.infolist():
            if not info.filename.startswith(PREFIX) or info.is_dir():
                continue
            rel = info.filename[len(PREFIX):]
            parts = rel.split("/")
            if (not rel or not SAFE_NAME.fullmatch(rel) or
                    any(p in ("", ".", "..") for p in parts) or "\\" in rel):
                raise ValueError("Unsafe historical game path: " + rel)
            if stat.S_IFMT(info.external_attr >> 16) == stat.S_IFLNK:
                raise ValueError("Symlink ZIP entry refused")
            if info.file_size > MAX_SINGLE:
                raise ValueError("Oversized original resource")
            size += info.file_size
            if size > MAX_TOTAL or len(selected) >= MAX_ENTRIES:
                raise ValueError("Original-site resource limits exceeded")
            selected.append((rel,info))
        if not any(path == ENTRY for path,_ in selected):
            raise ValueError("Original Title.swf is absent")
        if any(not any(path == name for path,_ in selected) for name in (
            "Dining room.swf","Bathroom.swf","Kitchen.swf",
            "Living room.swf","Corridor.swf","Credit.swf")):
            raise ValueError("Original first-game room assets are incomplete")
        # All validation above before any directory writes.
        destination.mkdir(parents=True, exist_ok=False)
        inventory = []
        try:
            for path, info in selected:
                target = destination.joinpath(*path.split("/"))
                target.parent.mkdir(parents=True,exist_ok=True)
                digest = hashlib.sha256()
                with archive.open(info) as src, target.open("xb") as dst:
                    total=0
                    while block := src.read(1024*1024):
                        total += len(block)
                        if total > MAX_SINGLE:
                            raise ValueError("Unexpectedly large extracted resource")
                        digest.update(block)
                        dst.write(block)
                if total != info.file_size:
                    raise ValueError("ZIP entry truncated")
                inventory.append({"path":path,"size":total,"sha256":digest.hexdigest()})
            ledger={"format":"swf-local-ledger-v1","entry":ENTRY,"files":inventory}
            manifest={"format":"swf-local-manifest-v1","enabled":True,
                      "entry":"/original/"+ENTRY}
            (destination/"inventory.json").write_text(json.dumps(ledger,indent=2)+"\n")
            (destination/"port-manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
        except BaseException:
            # Do not leave a half-staged playable collection on partial errors.
            import shutil
            shutil.rmtree(destination)
            raise
        return {"format":"original-the-house-local-stage-v1",
                "files":len(inventory),"entry":manifest["entry"],
                "path":str(destination),
                "notice":"Private research stage only; never deploy or commit original game assets."}

if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zip", help="Locally obtained original Flashpoint GameZIP")
    parser.add_argument("--dest",default="public/original",
                        help="Local ignored Vite research directory")
    args=parser.parse_args()
    print(json.dumps(stage_gamezip(args.zip,args.dest),indent=2))
