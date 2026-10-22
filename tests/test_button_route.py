import importlib.util
import struct
import unittest
from pathlib import Path

SCRIPT=Path(__file__).resolve().parents[1]/"scripts"/"inspect-original-button-placements.py"
spec=importlib.util.spec_from_file_location("button_placements",SCRIPT)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def tag(code,body):
    return struct.pack("<HI",(code<<6)|63,len(body))+body

def rect(x0,x1,y0,y1):
    bits="01111"+"".join(format(v,"015b") for v in (x0,x1,y0,y1))
    bits+="0"*(-len(bits)%8)
    return int(bits,2).to_bytes(len(bits)//8,"big")

IDENTITY=b"\0"  # MATRIX without scale/rotate, 0 translate bits
STOP=tag(12,b"\x07\0")
SHOW=tag(1,b"")

def place(depth,char):
    return tag(26,struct.pack("<BHH",0x06,depth,char)+IDENTITY)

def button(ident,action):
    record=struct.pack("<BHH",0x0F,1,1)+IDENTITY+b"\0"  # hit/down/over/up shape 1
    cond=struct.pack("<HH",0,0x0008)+action+b"\0"  # on(release)
    return tag(34,struct.pack("<HBH",ident,0,2+len(record)+1)+record+b"\0"+cond)

class ButtonRouteTests(unittest.TestCase):
    def test_route_follows_stop_frames_to_level0_exit(self):
        # Self-authored synthetic SWF: sprite 3 stops on frame 1 with button 2
        # (gotoAndPlay(3)); frame 3 stops with button 4 (GetURL Next.swf).
        goto=b"\x81"+struct.pack("<HH",2,2)+b"\x06"
        url=b"Next.swf\0_level0\0"
        sprite=struct.pack("<HH",3,3)+place(1,2)+STOP+SHOW+SHOW+tag(28,struct.pack("<H",1))+place(1,4)+STOP+SHOW+tag(0,b"")
        body=(tag(2,struct.pack("<H",1)+rect(0,400,0,200)+b"\0\0\0\0")+button(2,goto)+
              button(4,b"\x83"+struct.pack("<H",len(url))+url)+tag(39,sprite)+place(1,3)+SHOW+tag(0,b""))
        header=rect(0,12000,0,12000)+struct.pack("<HH",20<<8,1)
        swf=b"FWS\x06"+struct.pack("<I",8+len(header)+len(body))+header+body
        [route]=mod.inspect_one(swf)["timelineRoutes"]
        self.assertEqual(route["stopFrames"],[1,3])
        [step]=route["steps"]
        self.assertEqual((step["button"],step["event"],step["gotoAndPlay"],step["nextStopFrame"]),(2,"release",3,3))
        self.assertEqual(step["tapPx"],[10.0,5.0])
        self.assertEqual((route["exit"]["button"],route["exit"]["getURL"],route["exit"]["target"]),(4,"Next.swf","_level0"))

if __name__=="__main__":
    unittest.main()
