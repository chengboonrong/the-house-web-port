import importlib.util
import struct
import unittest
from pathlib import Path

SCRIPT=Path(__file__).resolve().parents[1]/"scripts"/"inspect-avm1-navigation.py"
spec=importlib.util.spec_from_file_location("avm1_navigation",SCRIPT)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class Avm1Tests(unittest.TestCase):
    def test_geturl_action_inside_sprite(self):
        # Self-authored synthetic payload: one GetURL action pointing to Credit.swf
        action=b"\x83"+struct.pack("<H",len(b"Credit.swf\0\0"))+b"Credit.swf\0\0"+b"\0"
        tag=struct.pack("<H",(12<<6)|len(action))+action
        signals={"opcodes":mod.Counter(),"events":[],"filenameIndicators":set(),"errors":[]}
        mod.walk_tags(tag,0,len(tag),signals)
        self.assertEqual(signals["opcodes"]["GetURL"],1)
        self.assertEqual(signals["events"][0]["urlFileIndicators"],["Credit.swf"])
        self.assertEqual(signals["errors"],[])
    def test_out_of_bounds_action_is_reported(self):
        signals={"opcodes":mod.Counter(),"events":[],"filenameIndicators":set(),"errors":[]}
        mod.parse_actions(b"\x83\xff\xff",0,3,signals,"main")
        self.assertIn("out-of-bounds action payload",signals["errors"])

    def test_button2_click_action_extracts_navigation(self):
        # Synthetic DefineButton2: ID 22, ActionOffset 3, one cond action.
        action = b"\\x83" + struct.pack("<H", len(b"Bathroom.swf\\0\\0")) + b"Bathroom.swf\\0\\0" + b"\\0"
        condition = struct.pack("<HH",0,0x0004) + action
        payload = struct.pack("<HBH",22,0,3) + b"\\0" + condition
        header = struct.pack("<H",(34 << 6) | 63) + struct.pack("<I",len(payload))
        signals={"opcodes":mod.Counter(),"events":[],"filenameIndicators":set(),"errors":[],"buttonConditions":0}
        mod.walk_tags(header+payload,0,len(header+payload),signals)
        self.assertEqual(signals["buttonConditions"],1)
        self.assertEqual(signals["opcodes"]["GetURL"],1)
        self.assertEqual(signals["events"][0]["urlFileIndicators"],["Bathroom.swf"])
        self.assertIn("button:22",signals["events"][0]["source"])
        self.assertEqual(signals["errors"],[])

if __name__=="__main__":
    unittest.main()
