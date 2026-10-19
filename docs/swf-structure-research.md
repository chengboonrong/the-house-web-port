# Structural SWF inspection: real-file research gate

A new **read-only** SWF parser is available in `scripts/inspect-swf-structure.mjs`. It follows the SWF record layout (header, RECT, frame rate and count, top-level tag headers) and accepts **FWS** and zlib-compressed **CWS**. It reports the **ZWS**/LZMA header but delegates full inspection to FFDec.

Run locally after obtaining an authorized archival source:

```bash
node scripts/inspect-swf-structure.mjs "/path/to/Diningroom.swf" > "/private/local-Diningroom-report.json"
```

Outputs:
- SHA-256 of original bytes (no upload)
- Signature, SWF version, declared and decompressed size
- Native stage width/height (20 twips per pixel), frame rate and count
- Counts of DoAction, DoInitAction, DoABC and other top-level tags
- FileAttributes AS3 flag and **provisional** ActionScript family assessment

DoAction/DoInitAction can suggest AVM1 / AS1-AS2; DoABC or AS3 file flags suggest AVM2. Nested sprite actions can be invisible to this parser. **Absence of top-level scripts does not prove the game is script-free.** Use FFDec or a robust parser for source-level results.

The parser does not execute any ActionScript or download external files. It enforces a 128 MiB expanded-size cap and validates tag bounds. Tests use entirely synthetic Flash headers, not the original game.

## Known gap

The 2020 Korean archive lists first-game room SWF filenames (including `Diningroom.swf`, `Bathroom.swf`, `Kitchen.swf`, `Livingroom.swf`, `Corridor.swf`, `Credit.swf`). Actual binary contents have **not** been obtained in this session. Structure reports can only be generated once a legitimate local copy is available.

Source: https://vidkidz.tistory.com/546

This metadata tooling supports an **original SWF port**, not a remake or reconstruction.
