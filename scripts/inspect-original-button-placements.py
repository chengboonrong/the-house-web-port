#!/usr/bin/env python3
"""Inspect actual Sinthai Flash button instance placement translations.

Read-only, parses top-level and DefineSprite PlaceObject/PlaceObject2 matrices.
Reported positions are *local transform origins*, NOT proven clickable centers.
No game binary payload or artwork is emitted.
"""
import json
import struct
import sys
from zipfile import ZipFile

PREFIX="content/www.sinthaistudio.com/thehouse1/"
LIMIT=5_000_000

class BitReader:
    def __init__(self,data,start):
        self.data=data
        self.bit=start*8
    def read(self,n):
        if n<0 or n>32 or self.bit+n>len(self.data)*8:
            raise ValueError("invalid SWF bit range")
        v=0
        for _ in range(n):
            i=self.bit>>3
            v=(v<<1)|((self.data[i]>>(7-(self.bit&7)))&1)
            self.bit+=1
        return v
    def signed(self,n):
        if not n:return 0
        v=self.read(n)
        return v-(1<<n) if v&(1<<(n-1)) else v
    def align(self):
        self.bit=(self.bit+7)&~7
    def pos(self):
        return self.bit>>3

def matrix(data,at):
    bits=BitReader(data,at)
    scale=1.0
    if bits.read(1):
        n=bits.read(5)
        if n>31:raise ValueError("scale bits too wide")
        scale=bits.signed(n)/65536
        bits.signed(n)
    if bits.read(1):
        n=bits.read(5)
        if n>31:raise ValueError("rotation bits too wide")
        bits.signed(n);bits.signed(n)
    n=bits.read(5)
    if n>31:raise ValueError("translation bits too wide")
    x=bits.signed(n)/20
    y=bits.signed(n)/20
    bits.align()
    return x,y,scale,bits.pos()

def frame_start(data):
    if not data.startswith(b"FWS") or len(data)<15:raise ValueError("Expected uncompressed SWF")
    rect_n=data[8]>>3
    return 8+(5+4*rect_n+7)//8+4

def inspect_one(data):
    button_ids=set()
    placed=[]
    def scan(start,end,container,depth):
        if depth>8:return
        pos=start
        for _ in range(100000):
            if pos+2>end:break
            tag=struct.unpack_from("<H",data,pos)[0]
            pos+=2
            code=tag>>6
            length=tag&63
            if length==63:
                if pos+4>end:break
                length=struct.unpack_from("<I",data,pos)[0];pos+=4
            stop=pos+length
            if stop>end:break
            if code==34 and length>=2:
                button_ids.add(struct.unpack_from("<H",data,pos)[0])
            elif code==39 and length>=4:
                sprite=struct.unpack_from("<H",data,pos)[0]
                scan(pos+4,stop,f"sprite:{sprite}",depth+1)
            elif code in (4,26):
                try:
                    if code==4:
                        if length<4:raise ValueError("PlaceObject too short")
                        ident,level=struct.unpack_from("<HH",data,pos)
                        x,y,scale,_=matrix(data,pos+4)
                    else:
                        if length<5:raise ValueError("PlaceObject2 too short")
                        flags=data[pos]
                        level=struct.unpack_from("<H",data,pos+1)[0]
                        if not flags&2 or not flags&4:
                            pos=stop
                            continue
                        ident=struct.unpack_from("<H",data,pos+3)[0]
                        x,y,scale,_=matrix(data,pos+5)
                    placed.append({"container":container,"characterId":ident,"depth":level,
                                   "originPx":[round(x,2),round(y,2)],"scaleX":round(scale,4)})
                except (ValueError,struct.error,IndexError):
                    pass
            if code==0:break
            pos=stop
    scan(frame_start(data),len(data),"main",0)
    buttons=[x for x in placed if x["characterId"] in button_ids]
    # Deduplicate repeated placements in animation frames to bound metadata.
    unique={}
    for x in buttons:
        key=(x["container"],x["characterId"],x["depth"],tuple(x["originPx"]))
        unique[key]=x
    return {"buttonDefinitionCount":len(button_ids),"buttonPlacementCount":len(buttons),
            "placedButtons":list(unique.values())[:200],
            "note":"These are matrix origins, not shape bounds or confirmed click coordinates."}

def inspect(zipfile):
    out=[]
    with ZipFile(zipfile) as archive:
        for i in archive.infolist():
            if not i.filename.startswith(PREFIX) or not i.filename.lower().endswith(".swf"):continue
            if i.file_size>LIMIT:raise ValueError("file too large")
            out.append({"file":i.filename[len(PREFIX):],**inspect_one(archive.read(i))})
    return {"format":"the-house-original-button-transform-origins-v1","files":out,
            "limitation":"A button's hit region also depends on DefineButton2 hit-test records, shape bounds, parent sprite placements and timeline state. Matrix origins cannot be used blindly as click centers."}

if __name__=="__main__":
    if len(sys.argv)!=2:raise SystemExit("Usage: python scripts/inspect-original-button-placements.py GameZIP.zip")
    print(json.dumps(inspect(sys.argv[1]),indent=2))
