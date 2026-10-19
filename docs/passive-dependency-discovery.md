# Passive Flash source-reference investigation

Research-only workflow. **Never claim a detected filename is an actual dependency until a real run or decompilation confirms it.**

## Historical evidence

- Sinthai's official retrospective identifies The House (2005) as a five-room Flash point-and-click experience: https://thehouse.online/thehouse1_info/
- Jay is Games' 8 September 2005 review records an author-authorized mirror for Jay is Games specifically: https://jayisgames.com/review/the-house.php
- The historical game page is https://jayisgames.com/games/the-house/. The page's presence alone does not verify its executable is accessible.
- A Flashpoint discussion about separately-loaded room SWFs concerns **The House 2**, not verified first-game structure: https://www.reddit.com/r/flash/comments/1mkqol2/

## Passive inspection

If a lawful research copy of an original SWF or saved historical HTML wrapper becomes available:

```bash
node scripts/inspect-flash-references.mjs /path/to/Title.swf /path/to/archived-wrapper.html > local-findings.json
```

Here `Title.swf` is an **illustrative filename**, not a verified original entrypoint.

The scanner:
1. Reads headers of FWS, CWS and ZWS movies to report Flash version and declared file size.
2. Expands compressed CWS content with bounded zlib decompression to inspect embedded printable strings.
3. Reports heuristic matches for .swf, .xml, .mp3, .wav, .flv and image resource names and HTML wrapper attributes.
4. Avoids executing Flash/ActionScript and makes no network requests.

Important limits:
- It does **not** understand ActionScript bytecode, reconstruct timelines, or decode ZWS/LZMA content.
- A string match may be unrelated, unreachable code, or a stale path. It is **not** proof that Ruffle loaded the resource.
- For authoritative details use FFDec and real runtime request logs.
- This tool does not retrieve copyrighted files; never publish them without rights.

## Follow-up dependency workflow

Compare passive references to `npm run check:staged` file inventories and browser request observations from `/port.html`. Record whether each reference is (a) statically observed, (b) present in a verified source inventory, and (c) requested during playback. Keep those evidence categories separate.

**Status as of 2026-10-20:** No confirmed binary checksum or complete original-game manifest exists in this repository.
