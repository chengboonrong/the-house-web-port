#!/usr/bin/env python3
"""Inspect actual Sinthai Flash button instance placement translations.

Read-only, parses top-level and DefineSprite PlaceObject/PlaceObject2 matrices.
Reported positions are *local transform origins*, NOT proven clickable centers.
No game binary payload or artwork is emitted.

timelineRoutes replays a sprite's display list, finds its stop() frames and the
buttons on stage at each, decodes their gotoAndPlay/GetURL actions and searches
for the shortest button sequence that reaches an original _level0 room load.
Tap points are centres of composed hit-test *bounds*: browser runs must confirm.
"""
import json
import re
import struct
import sys
from collections import deque
from zipfile import ZipFile

PREFIX="content/www.sinthaistudio.com/thehouse1/"
LIMIT=5_000_000
IDENTITY=(1.0,0.0,0.0,1.0,0.0,0.0)
RELEASE,ROLL_OVER=0x0008,0x0001  # CondOverDownToOverUp, CondIdleToOverUp

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
    """Full SWF MATRIX as (scaleX, skew0, skew1, scaleY, tx px, ty px)."""
    bits=BitReader(data,at)
    a=d=1.0
    b=c=0.0
    if bits.read(1):
        n=bits.read(5)
        a=bits.signed(n)/65536
        d=bits.signed(n)/65536
    if bits.read(1):
        n=bits.read(5)
        b=bits.signed(n)/65536
        c=bits.signed(n)/65536
    n=bits.read(5)
    tx=bits.signed(n)/20
    ty=bits.signed(n)/20
    bits.align()
    return (a,b,c,d,tx,ty),bits.pos()

def rect(data,at):
    bits=BitReader(data,at)
    n=bits.read(5)
    x0,x1,y0,y1=(bits.signed(n)/20 for _ in range(4))
    return (x0,y0,x1,y1)

def skip_cxform_alpha(data,at):
    bits=BitReader(data,at)
    add,mult,n=bits.read(1),bits.read(1),bits.read(4)
    for _ in range(4*(add+mult)):bits.read(n)
    bits.align()
    return bits.pos()

def compose(p,q):
    """Matrix applying q first, then p."""
    a,b,c,d,tx,ty=p
    A,B,C,D,TX,TY=q
    return (a*A+c*B,b*A+d*B,a*C+c*D,b*C+d*D,a*TX+c*TY+tx,b*TX+d*TY+ty)

def transform(m,r):
    xs,ys=[],[]
    for x,y in ((r[0],r[1]),(r[2],r[1]),(r[0],r[3]),(r[2],r[3])):
        xs.append(m[0]*x+m[2]*y+m[4])
        ys.append(m[1]*x+m[3]*y+m[5])
    return (min(xs),min(ys),max(xs),max(ys))

def decode_actions(data,at,end):
    """Classify one AVM1 action block; only exact simple shapes are trusted."""
    ops=[]
    while at<end and data[at]:
        code=data[at]
        size=struct.unpack_from("<H",data,at+1)[0] if code>=0x80 else 0
        at+=3 if code>=0x80 else 1
        ops.append((code,data[at:at+size]))
        at+=size
    codes=[c for c,_ in ops]
    if codes==[0x07]:return {"stop":True}
    if codes==[0x81,0x06]:return {"gotoAndPlay":struct.unpack_from("<H",ops[0][1])[0]+1}
    if codes==[0x83]:
        url,target=(s.decode("latin1") for s in ops[0][1].split(b"\0")[:2])
        return {"getURL":url if re.fullmatch(r"[A-Za-z0-9_ .-]+\.swf",url,re.I) else "OTHER",
                "target":target if re.fullmatch(r"[A-Za-z0-9_]{0,32}",target) else "OTHER"}
    return {"unsupported":[f"0x{c:02x}" for c in codes]}

def button2(data,pos,stop):
    """DefineButton2 hit-test records and decoded BUTTONCONDACTIONs (SWF<8 records)."""
    cur=pos+5
    hit=[]
    while cur<stop and data[cur]:
        flags=data[cur]
        if flags&0x30:raise ValueError("Button filter/blend records are unsupported")
        char=struct.unpack_from("<H",data,cur+1)[0]
        m,cur=matrix(data,cur+5)
        cur=skip_cxform_alpha(data,cur)
        if flags&0x08:hit.append((char,m))
    offset=struct.unpack_from("<H",data,pos+3)[0]
    conds=[]
    cur=pos+3+offset
    while offset and cur+4<=stop:
        size,cond=struct.unpack_from("<HH",data,cur)
        end=cur+size if size else stop
        conds.append((cond,decode_actions(data,cur+4,end)))
        if not size:break
        cur=end
    return hit,conds

def replay(frames):
    """Display list {depth: {char, m}} after each frame's control tags."""
    dl,out=({},[])
    for ops in frames:
        for op in ops:
            if op[0]=="remove":
                dl.pop(op[1],None)
            elif op[0]=="place":
                _,depth,char,m,move=op
                obj=dict(dl[depth]) if move and depth in dl else {"char":None,"m":IDENTITY}
                if char is not None:obj["char"]=char
                if m is not None:obj["m"]=m
                if obj["char"] is not None:dl[depth]=obj
        out.append({k:dict(v) for k,v in dl.items()})
    return out

def route(sprite,frames,base,buttons,shapes,fps):
    """Shortest button route from the first stop() to a _level0 SWF load, or None."""
    actions={i+1:[op[1] for op in ops if op[0]=="actions"] for i,ops in enumerate(frames)}
    if any(a!={"stop":True} for acts in actions.values() for a in acts):return None
    stops=sorted(f for f,acts in actions.items() if acts)
    if not stops:return None
    snaps=replay(frames)
    def options(stop):
        on_stage=[]
        for depth,obj in sorted(snaps[stop-1].items()):
            if obj["char"] not in buttons:continue
            hit,conds=buttons[obj["char"]]
            if not hit or any(c not in shapes for c,_ in hit):continue
            m=compose(base,obj["m"])
            r=[transform(compose(m,hm),shapes[c]) for c,hm in hit]
            r=(min(x[0] for x in r),min(x[1] for x in r),max(x[2] for x in r),max(x[3] for x in r))
            on_stage.append((depth,obj["char"],r,conds))
        for depth,char,r,conds in on_stage:
            tap=((r[0]+r[2])/2,(r[1]+r[3])/2)
            # A higher button whose bounds contain the tap would receive it instead.
            if any(d>depth and h[0]<=tap[0]<=h[2] and h[1]<=tap[1]<=h[3] for d,_,h,_ in on_stage):continue
            for cond,act in conds:
                event="release" if cond&RELEASE else "rollOver" if cond&ROLL_OVER else None
                if event:yield {"stopFrame":stop,"button":char,"depth":depth,"event":event,
                                "tapPx":[round(v,1) for v in tap],"hitBoundsPx":[round(v,1) for v in r],**act}
    start=stops[0]
    previous={start:None}
    queue=deque([start])
    while queue:
        stop=queue.popleft()
        for step in options(stop):
            if step.get("getURL","OTHER")!="OTHER" and step["target"]=="_level0":
                steps=[step]
                while previous[stop]:
                    stop,prior=previous[stop]
                    steps.append(prior)
                return {"container":f"sprite:{sprite}","fps":fps,"stopFrames":stops,
                        "steps":steps[:0:-1],"exit":steps[0]}
            goto=step.get("gotoAndPlay")
            following=next((f for f in stops if goto and f>=goto),None)
            if following and following not in previous:
                step.update(nextStopFrame=following,playFrames=following-goto)
                previous[following]=(stop,step)
                queue.append(following)
    return None

def frame_start(data):
    if not data.startswith(b"FWS") or len(data)<15:raise ValueError("Expected uncompressed SWF")
    rect_n=data[8]>>3
    return 8+(5+4*rect_n+7)//8+4

def inspect_one(data):
    button_ids=set()
    button_action_metadata={}
    buttons={}
    shapes={}
    sprite_ids=set()
    timelines={}
    placed=[]
    def scan(start,end,container,depth):
        if depth>8:return
        frames=timelines.setdefault(container,[[]])
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
            if code==1:
                frames.append([])
            elif code==12:
                frames[-1].append(("actions",decode_actions(data,pos,stop)))
            elif code in (2,22,32,83) and length>=3:
                shapes[struct.unpack_from("<H",data,pos)[0]]=rect(data,pos+2)
            elif code==34 and length>=5:
                button_id=struct.unpack_from("<H",data,pos)[0]
                action_offset=struct.unpack_from("<H",data,pos+3)[0]
                button_ids.add(button_id)
                button_action_metadata[button_id]={
                    "characterId":button_id,
                    "hasConditionalActions":action_offset!=0,
                    "actionOffset":action_offset,
                    "note":"ActionOffset is relative SWF metadata, not a click point or proof of reachable game state."
                }
                try:buttons[button_id]=button2(data,pos,stop)
                except (ValueError,struct.error,IndexError):pass
            elif code==39 and length>=4:
                sprite=struct.unpack_from("<H",data,pos)[0]
                sprite_ids.add(sprite)
                scan(pos+4,stop,f"sprite:{sprite}",depth+1)
            elif code==28 and length>=2:
                frames[-1].append(("remove",struct.unpack_from("<H",data,pos)[0]))
            elif code==5 and length>=4:
                frames[-1].append(("remove",struct.unpack_from("<H",data,pos+2)[0]))
            elif code in (4,26):
                try:
                    if code==4:
                        if length<4:raise ValueError("PlaceObject too short")
                        ident,level=struct.unpack_from("<HH",data,pos)
                        m,_=matrix(data,pos+4)
                        move=False
                    else:
                        if length<3:raise ValueError("PlaceObject2 too short")
                        flags=data[pos]
                        level=struct.unpack_from("<H",data,pos+1)[0]
                        ident=struct.unpack_from("<H",data,pos+3)[0] if flags&2 else None
                        m=matrix(data,pos+5 if flags&2 else pos+3)[0] if flags&4 else None
                        move=bool(flags&1)
                    frames[-1].append(("place",level,ident,m,move))
                    if ident is not None and m is not None:
                        placed.append({"container":container,"characterId":ident,"depth":level,
                                       "originPx":[round(m[4],2),round(m[5],2)],"scaleX":round(m[0],4)})
                except (ValueError,struct.error,IndexError):
                    pass
            if code==0:break
            pos=stop
    start=frame_start(data)
    scan(start,len(data),"main",0)
    main=replay(timelines["main"])
    fps=data[start-3]+data[start-4]/256
    routes=[]
    for depth,obj in sorted(main[-1].items() if main else []):
        if obj["char"] in sprite_ids:
            found=route(obj["char"],timelines[f"sprite:{obj['char']}"],obj["m"],buttons,shapes,fps)
            if found:routes.append({**found,"mainDepth":depth})
    buttons=[x for x in placed if x["characterId"] in button_ids]
    sprite_instances=[x for x in placed if x["characterId"] in sprite_ids]
    # Deduplicate repeated placements in animation frames to bound metadata.
    unique={}
    for x in buttons:
        key=(x["container"],x["characterId"],x["depth"],tuple(x["originPx"]))
        unique[key]=x
    sprite_unique={}
    for x in sprite_instances:
        key=(x["container"],x["characterId"],x["depth"],tuple(x["originPx"]))
        sprite_unique[key]=x
    return {"buttonDefinitionCount":len(button_ids),
            "buttonActionMetadata":sorted(button_action_metadata.values(),key=lambda b:b["characterId"]),
            "buttonPlacementCount":len(buttons),
            "spriteDefinitionCount":len(sprite_ids),
            "placedSpriteInstances":list(sprite_unique.values())[:200],
            "placedButtons":list(unique.values())[:200],
            "timelineRoutes":routes,
            "note":"These are local matrix origins; nested sprite and button transforms must be composed and timeline visibility verified before inferring global hitboxes."}

def inspect(zipfile):
    out=[]
    with ZipFile(zipfile) as archive:
        for i in archive.infolist():
            if not i.filename.startswith(PREFIX) or not i.filename.lower().endswith(".swf"):continue
            if i.file_size>LIMIT:raise ValueError("file too large")
            out.append({"file":i.filename[len(PREFIX):],**inspect_one(archive.read(i))})
    return {"format":"the-house-original-button-transform-origins-v1","files":out,
            "limitation":"A button's hit region also depends on DefineButton2 hit-test records, shape bounds, parent sprite placements and timeline state. Matrix origins cannot be used blindly as click centers. timelineRoutes use hit-test bounds of stop()-only sprite timelines; a browser run must confirm each step."}

if __name__=="__main__":
    if len(sys.argv)!=2:raise SystemExit("Usage: python scripts/inspect-original-button-placements.py GameZIP.zip")
    print(json.dumps(inspect(sys.argv[1]),indent=2))
