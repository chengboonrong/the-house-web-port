# Verified AVM1 ActionScript navigation investigation

Date: 2026-10-20.

The original Sinthai Studio The House (2005) Flashpoint GameZIP has been retrieved into an ephemeral GitHub Runner with archive UUID `a8b2e1fb-e408-2f0f-b1b8-08537b0e864b`. The binary payload itself was **not** committed or distributed; only a bounded JSON analysis report was preserved.

Evidence: https://github.com/chengboonrong/the-house-web-port/actions/runs/39361847334

## Analysis performed

`scripts/inspect-avm1-navigation.py` walks uncompressed SWF tag records and nested DefineSprite timelines (bounded to depth eight), inspecting DoAction and DoInitAction AVM1 streams. It counts action opcodes and reports only candidate navigation filenames, not script source.

### Verified instruction finding

- In **Corridor.swf**, inside **sprite ID 80**, an AVM1 `GetURL` action was decoded with a filename indicator **Credit.swf**. This is evidence of an executable navigation instruction embedded in that sprite, but we have **not demonstrated its runtime activation condition** or that Safari/Ruffle will successfully execute it.
- Room files contain AVM1 operations including `CallFunction`, `GotoFrame`, `Play` and `Stop`. These are *not by themselves* proof of `loadMovie` calls or specific room transitions.
- The earlier binary string scan identified multiple room filenames; button-embedded actions may account for some of them, but this remains a hypothesis.

### Important tool scope

AVM1 instructions can also live in DefineButton / DefineButton2 conditional action records and specialized sprites. **This parser does not yet decode button action carriers**, constant pool indirection, complete operand stack, or reachable execution paths. Consequently, a sparse navigation report is expected and is not proof that a room has no click actions. Use FFDec to validate all actual call sites.

## Next port tasks

1. Add safe and bounded parsing of DefineButton2 conditional action streams to confirm clickable room transitions.
2. Preserve the exact original SWF filenames and directory structure under a locally staged same-origin web path (do not commit third-party assets).
3. Test **original Title.swf** in Ruffle with its original room SWFs present and verify transitions and audio before claiming an iPhone Safari port.
4. Resolve author redistribution permission prior to public release.

No original game binary assets are present in this repository.

## 2026-10-20: DefineButton2 conditional actions decoded on actual originals

We extended the parser to read the `ActionOffset` and `BUTTONCONDACTION` records from DefineButton2 (SWF tag 34), including condition flags and bounded AVM1 action records. The original archive workflow completed successfully.

**Evidence:** https://github.com/chengboonrong/the-house-web-port/actions/runs/39367328798

The button actions have condition `0x0008` (CondOverDownToOverUp, releasing a pressed button). Extracted **GetURL opcode** references are:

| Origin | Button ID | Target SWF |
|---|---:|---|
| Dining room.swf | 90 | Bathroom.swf |
| Bathroom.swf | 10 | Dining room.swf |
| Bathroom.swf | 98 | Kitchen.swf |
| Kitchen.swf | 10 | Bathroom.swf |
| Kitchen.swf | 13 | Dining room.swf |
| Kitchen.swf | 89 | Living room.swf |
| Living room.swf | 11 | Kitchen.swf |
| Living room.swf | 14 | Bathroom.swf |
| Living room.swf | 17 | Dining room.swf |
| Living room.swf | 108 | Corridor.swf |
| Corridor.swf | 11 | Living room.swf |
| Corridor.swf | 14 | Kitchen.swf |
| Corridor.swf | 17 | Bathroom.swf |
| Corridor.swf | 20 | Dining room.swf |
| Corridor.swf | Sprite 80 | Credit.swf |
| Credit.swf | 10 | Living room.swf |
| Credit.swf | 13 | Kitchen.swf |
| Credit.swf | 16 | Bathroom.swf |
| Credit.swf | 19 | Dining room.swf |
| Credit.swf | 22 | Corridor.swf |

The report also contains two `Credit.swf` button GetURL actions with no matching `.swf` target; inspect them separately as possible external-site URLs. In `Title.swf`, two button GetURL actions likewise have no filename suffix; **do not assert the title-to-first-room transition from this scan**. The raw destinations were not recorded in order to avoid dumping arbitrary links and scripts.

Button condition counts: Bathroom 23, Corridor 16, Credit 7, Dining Room 21, Kitchen 24, Living Room 32, Title 2. All files reported zero parser errors.

**Limits:** This proves the specified navigation opcodes are embedded in original SWFs. It does not prove successful HTTP loading or identical behavior in Ruffle/Safari. DefineButton v1, PlaceObject2 clip actions, GetURL2 stack operands and other ActionScript features still need dedicated analysis.
