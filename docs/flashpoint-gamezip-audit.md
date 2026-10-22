# Verifying a real Flashpoint GameZIP without extracting copyrighted game files

Flashpoint's FAQ confirms most archives live under `Data/Games` as self-contained ZIPs, while some legacy games are kept in `Legacy/htdocs`: https://flashpointarchive.org/faq

The FlashNX source also shows that a modern GameZIP generally contains `content.json` and a `content/<historical-host>/<original-path>/` directory structure:
https://github.com/Jonathan8520/FlashNX/blob/main/rust/src/sources/gamezip.rs

## Once the correct The House entry is verified

```bash
python3 scripts/audit-flashpoint-gamezip.py \
  "/path/to/Flashpoint/Data/Games/<VERIFIED_UUID>.zip"
```

The script:
- Reads the ZIP **without extracting, downloading, or executing** files
- Checks path traversal, duplicate names, file count and uncompressed sizes
- Prints each SWF's original virtual path, SWF signature, byte length and SHA-256
- Parses `content.json` when present, and reports whether its direct SWF launch command matches a path inside the ZIP
- Does not log arbitrary `content.json` values, account data or binary payloads

The results can tell whether the archive *contains the recorded launcher*, but the existence of one SWF alone **does not prove a complete game**. ActionScript dynamic external loads must still be verified by static analysis and runtime traces.

**Current verified limitation (2026-10-20):** No matching Sinthai `The House` (2005) GameZIP UUID has been retrieved from Flashpoint in this session. This tooling is for inspection after an authentic, lawfully obtained copy becomes available. The synthetic unit-test SWF is not game content.

Do not commit or redistribute any third-party ZIPs or original SWF assets without authorization.
