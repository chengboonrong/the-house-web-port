#!/usr/bin/env python3
"""Read-only SWF sound-tag inventory across the verified original Sinthai archive.

Reports counts only. Does not extract/play/export audio, does not establish
whether audio actually emits through Ruffle or Safari.
"""
import json
import struct
import sys
from collections import Counter
from zipfile import ZipFile

PREFIX="content/www.sinthaistudio.com/thehouse1/"
SOUND_TAGS={14:"DefineSound",15:"StartSound",18:"SoundStreamHead",
            19:"SoundStreamBlock",45:"SoundStreamHead2",89:"StartSound2"}
MAX_FILE=4_000_000

def timeline_start(data):
    if len(data)<12 or data[:3]!=b"FWS":raise ValueError("Requires uncompressed FWS")
    n=data[8]>>3
    return 8+(5+4*n+7)//8+4

def scan_tags(data,start,end,counts,depth=0):
    if depth>8:return
    pos=start
    for _ in range(100_000):
        if pos+2>end:break
        header=struct.unpack_from("<H",data,pos)[0]
        pos+=2
        tag=header>>6
        size=header&63
        if size==63:
            if pos+4>end:raise ValueError("Truncated tag size")
            size=struct.unpack_from("<I",data,pos)[0];pos+=4
        stop=pos+size
        if stop>end:raise ValueError("Tag escapes its parent timeline")
        if tag==0:break
        if tag in SOUND_TAGS:counts[SOUND_TAGS[tag]]+=1
        if tag==39 and size>=4:scan_tags(data,pos+4,stop,counts,depth+1)
        pos=stop

def inspect(path):
    output=[]
    with ZipFile(path) as archive:
        for item in archive.infolist():
            if not item.filename.startswith(PREFIX) or not item.filename.lower().endswith(".swf"):continue
            if item.file_size>MAX_FILE:raise ValueError("Unexpectedly large game SWF")
            data=archive.read(item)
            counts=Counter()
            scan_tags(data,timeline_start(data),len(data),counts)
            output.append({"file":item.filename[len(PREFIX):],"soundTags":dict(counts),
                           "totalSoundTags":sum(counts.values())})
    return {"format":"the-house-original-static-sound-tag-inventory-v1",
            "files":output,
            "limitations":"Tag existence does not prove playback, timing, volume, unlocked AudioContext or Safari sound support."}

if __name__=="__main__":
    if len(sys.argv)!=2:raise SystemExit("Usage: inspect-original-sound-tags.py verified-gamezip.zip")
    print(json.dumps(inspect(sys.argv[1]),indent=2))
