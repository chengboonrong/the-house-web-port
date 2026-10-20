#!/usr/bin/env python3
"""Read-only AVM1 action-opcode inventory from Sinthai's original GameZIP.

Scans root DoAction, DoInitAction and recursively nested DefineSprite tags.
This is a *partial* parser: button actions, other specialized action carriers
and cross-frame stack semantics require FFDec to establish exact transitions.
Outputs only operation counts and filename indicators, no script bodies.
"""
import json
import re
import struct
import sys
from collections import Counter
from zipfile import ZipFile

PREFIX = "content/www.sinthaistudio.com/thehouse1/"
MAX_FILE = 4_000_000
MAX_TAGS = 100_000
MAX_DEPTH = 8
ACTION_NAMES = {
    0x04:"NextFrame",0x05:"PreviousFrame",0x06:"Play",0x07:"Stop",
    0x17:"Pop",0x1C:"GetVariable",0x1D:"SetVariable",
    0x26:"Trace",0x3D:"CallFunction",0x40:"NewObject",
    0x52:"CallMethod",0x81:"GotoFrame",0x83:"GetURL",
    0x88:"ConstantPool",0x8A:"WaitForFrame",0x8B:"SetTarget",
    0x8C:"GotoLabel",0x96:"Push",0x99:"Jump",0x9A:"GetURL2",
    0x9D:"If",0x9F:"GotoFrame2"
}

def frame_data_offset(data):
    bits = data[8] >> 3
    return 8 + ((5 + 4 * bits + 7) // 8) + 4

def parse_actions(data, offset, stop, signals, context):
    opcodes = signals["opcodes"]
    events = signals["events"]
    steps = 0
    last_strings = []
    while offset < stop and steps < MAX_TAGS:
        code = data[offset]
        offset += 1
        if code == 0:
            break
        size = 0
        if code >= 0x80:
            if offset + 2 > stop:
                signals["errors"].append("truncated action length")
                break
            size = struct.unpack_from("<H",data,offset)[0]
            offset += 2
        if offset + size > stop:
            signals["errors"].append("out-of-bounds action payload")
            break
        payload = data[offset:offset+size]
        offset += size
        steps += 1
        opcodes[ACTION_NAMES.get(code, f"Opcode_{code:02x}")] += 1
        if code == 0x96:  # ActionPush: typed arguments, retain only candidate filenames.
            strings = []
            cur = 0
            while cur < len(payload):
                typecode = payload[cur]
                cur += 1
                if typecode == 0:
                    end = payload.find(b"\0",cur)
                    if end < 0:
                        break
                    raw = payload[cur:end].decode("latin1",errors="replace")
                    if ".swf" in raw.lower() or "loadmovie" in raw.lower() or "geturl" in raw.lower():
                        strings.append(raw[:160])
                    cur = end + 1
                elif typecode in (1,7):cur += 4
                elif typecode == 6:cur += 8
                elif typecode in (2,3):pass
                elif typecode in (4,5,8):cur += 1
                elif typecode == 9:cur += 2
                else:break
            last_strings = strings[-8:]
            for s in last_strings:
                for value in re.findall(r"[A-Za-z0-9_ .-]+\.swf",s,re.I):
                    signals["filenameIndicators"].add(value.strip())
        if code == 0x83:
            sections = payload.split(b"\0")
            url = sections[0].decode("latin1",errors="replace") if sections else ""
            events.append({"source":context,"opcode":"GetURL",
                "urlFileIndicators":re.findall(r"[A-Za-z0-9_ .-]+\.swf",url,re.I)[:10]})
        elif code in (0x9A,0x3D,0x52):
            events.append({"source":context,"opcode":ACTION_NAMES[code],
                "recentStringIndicators":last_strings[-8:]})
    if steps >= MAX_TAGS:
        signals["errors"].append("action count limit hit")

def parse_button2(data, start, end, signals):
    """Parse DefineButton2 BUTTONCONDACTION records by ActionOffset.

    ActionOffset is measured from the start of its own 2-byte field;
    CondActionSize is measured from the start of its own 2-byte field.
    Avoids parsing variable-size BUTTONRECORD matrices/transforms.
    """
    if start + 5 > end:
        signals["errors"].append("short DefineButton2")
        return
    button_id = struct.unpack_from("<H", data, start)[0]
    action_field = start + 3
    action_offset = struct.unpack_from("<H", data, action_field)[0]
    if not action_offset:
        return
    cur = action_field + action_offset
    if cur < start + 5 or cur + 4 > end:
        signals["errors"].append("invalid DefineButton2 ActionOffset")
        return
    count = 0
    while cur + 4 <= end and count < 500:
        size = struct.unpack_from("<H", data, cur)[0]
        condition = struct.unpack_from("<H", data, cur + 2)[0]
        following = (cur + size) if size else end
        if following > end or following <= cur + 3:
            signals["errors"].append("invalid ButtonCondAction bounds")
            return
        context = f"button:{button_id}:condition:{condition:04x}"
        signals["buttonConditions"] += 1
        parse_actions(data, cur + 4, following, signals, context)
        count += 1
        if size == 0:
            return
        cur = following
    if count >= 500:
        signals["errors"].append("button condition limit exceeded")

def walk_tags(data, begin, end, signals, context="main", depth=0):
    if depth > MAX_DEPTH:
        signals["errors"].append("sprite nesting too deep")
        return
    pos = begin
    count = 0
    while pos + 2 <= end and count < MAX_TAGS:
        value = struct.unpack_from("<H",data,pos)[0]
        pos += 2
        code = value >> 6
        size = value & 63
        if size == 63:
            if pos + 4 > end:break
            size = struct.unpack_from("<I",data,pos)[0]
            pos += 4
        if pos + size > end:
            signals["errors"].append("tag extends beyond parent")
            break
        tag_start = pos
        pos += size
        count += 1
        if code == 0:break
        if code in (12,59):
            begin_action = tag_start + (2 if code==59 else 0)
            if begin_action <= pos:
                parse_actions(data,begin_action,pos,signals,context)
        elif code == 34:
            parse_button2(data, tag_start, pos, signals)
        elif code == 39 and size >= 4:
            sprite_id = struct.unpack_from("<H",data,tag_start)[0]
            walk_tags(data,tag_start+4,pos,signals,f"sprite:{sprite_id}",depth+1)
    if count >= MAX_TAGS:signals["errors"].append("tag count limit hit")

def inspect_archive(path):
    files=[]
    with ZipFile(path) as z:
        for item in z.infolist():
            if not item.filename.startswith(PREFIX) or not item.filename.lower().endswith(".swf"):
                continue
            if item.file_size>MAX_FILE:raise ValueError("unexpected large SWF")
            data=z.read(item)
            if not data.startswith(b"FWS") or len(data)<13:raise ValueError("Only valid uncompressed FWS supported")
            signals={"opcodes":Counter(),"events":[],"filenameIndicators":set(),"errors":[],"buttonConditions":0}
            walk_tags(data,frame_data_offset(data),len(data),signals)
            files.append({"filename":item.filename.removeprefix(PREFIX),
                "swfVersion":data[3],"opcodeCounts":dict(signals["opcodes"]),
                "navigationSignals":signals["events"][:100],
                "buttonConditions":signals["buttonConditions"],
                "filenameIndicators":sorted(signals["filenameIndicators"]),
                "errors":signals["errors"][:20]})
    return {"format":"the-house-2005-avm1-navigation-evidence-v1","files":files,
      "limitations":"DoAction/DoInitAction plus DefineButton2 conditional actions only; DefineButton v1, clip actions and AVM1 stack semantics remain unparsed. Not proof of runtime activation. Use FFDec for full call sites."}

if __name__=="__main__":
    if len(sys.argv)!=2:raise SystemExit("Usage: python scripts/inspect-avm1-navigation.py gamezip.zip")
    print(json.dumps(inspect_archive(sys.argv[1]),indent=2))
