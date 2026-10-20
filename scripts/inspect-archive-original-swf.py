#!/usr/bin/env python3
"""Read-only SWF dependency references from verified original-host GameZIP paths."""
import json
import re
import sys
import zipfile

HOST_PREFIX = "content/www.sinthaistudio.com/thehouse1/"
KNOWN_SUFFIX = ".swf"

def analyze(zip_path):
    result = []
    with zipfile.ZipFile(zip_path) as z:
        for info in z.infolist():
            if not info.filename.startswith(HOST_PREFIX) or not info.filename.lower().endswith(KNOWN_SUFFIX):
                continue
            if info.file_size > 4_000_000:
                raise ValueError("SWF exceeds research scan size cap")
            data = z.read(info)
            if data[:3] not in (b"FWS", b"CWS", b"ZWS"):
                raise ValueError("SWF magic mismatch: " + info.filename)
            # Static heuristic; byte strings can be unreachable or encoded differently.
            names = set()
            for match in re.findall(rb"[A-Za-z0-9_ ./-]{1,120}\.swf", data, re.I):
                name = match.decode("ascii", errors="ignore").strip().split("\x00")[-1]
                if name:
                    names.add(name[-128:])
            result.append({
                "path":info.filename, "signature":data[:3].decode("ascii"),
                "swfVersion":data[3] if len(data) > 3 else None,
                "declaredFileBytes":int.from_bytes(data[4:8],"little") if len(data)>=8 else None,
                "candidateSwfReferences":sorted(names)[:100]
            })
    return {"format":"the-house-2005-original-host-swf-references-v1",
            "files":result,"caution":"Heuristic SWF byte-string scan; requires ActionScript disassembly to verify loadMovie calls."}

if __name__=="__main__":
    if len(sys.argv)!=2:
        raise SystemExit("Usage: python scripts/inspect-archive-original-swf.py /tmp/gamezip.zip")
    print(json.dumps(analyze(sys.argv[1]),indent=2))
