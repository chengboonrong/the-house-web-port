# VERIFIED Flashpoint archive evidence for Sinthai's The House (2005)

Verified on 2026-10-20 using *actual GitHub Actions live requests*, not speculative URLs.

## Identity

- Game UUID: `a8b2e1fb-e408-2f0f-b1b8-08537b0e864b`
- Title: `The House`
- Developer: `Sinthai Studio`
- Release date: `2005`
- gameData dateAdded: `2025-05-23T00:41:30.788319Z`
- Flashpoint launch command: `http://www.sinthaistudio.com/thehouse1/index.html`
- gameData reported size: `6645444` bytes
- Independently distinguished The House 2 UUID: `f3184a96-fd65-197c-6e99-8fabcf17f310` (2010)

**Primary evidence:** https://github.com/chengboonrong/the-house-web-port/actions/runs/39359801101

## GameZIP was successfully downloaded to a temporary GitHub runner and audited

Flashpoint GameZIP URL shape is documented by FlashNX. Actual archive retrieval and read-only hash scan **succeeded**, not just a constructed candidate URL.

- Runner: https://github.com/chengboonrong/the-house-web-port/actions/runs/39359957699
- ZIP contained **23 entries**, including `content.json` and **13 SWF entries**.
- The exact original launch HTML `content/www.sinthaistudio.com/thehouse1/index.html` **was confirmed present in the ZIP** by a subsequent audit: https://github.com/chengboonrong/the-house-web-port/actions/runs/39360226863
- The initial simple string scan of that HTML did **not** identify an explicit .swf reference. This does **not** prove the page has no SWF embed; investigate its scripts/redirects.

### Original Sinthai host files

All paths prefixed by `content/www.sinthaistudio.com/thehouse1/`:

| File | Bytes | SHA-256 |
|---|---:|---|
| Title.swf | 159286 | `9ff9883ac5b5a99173652e9e3b8fc8090d09e634cec3b4b25996b2a7355ceb47` |
| Dining room.swf | 444629 | `53457442a215e63377de944289feb9cf4085a580ca711ff5946ff52737d863b5` |
| Bathroom.swf | 675312 | `8961f816547167a689672de06831ff25ffa64120e40895fd06f9bad9d3386794` |
| Kitchen.swf | 457048 | `754452a6e61aabc39d314d4082a86713b0cb3841746725c0cbbcd26b738420f4` |
| Living room.swf | 872176 | `ae563f2a8c0afe60e3428d86981b41d20b3f31c1285735bb04838db1573bbc58` |
| Corridor.swf | 680034 | `0480776038c1fd109f12a899d5fabbfc8cd92adde71d3f72a09e93aa512d9747` |
| Credit.swf | 180418 | `94190bb2a03abbc089757e49bcfd09fe9e7e809409bff1714324971faa385074` |

Each of these files starts with `FWS`, consistent with an uncompressed Flash SWF. The bundle also contains alternate copies under `content/files.gamezhero.com/`, some with differing digests. **The historical Sinthai directory is the primary port target.**

## Next actual port work

1. Inspect and resolve the archived `index.html` and `Title.swf` bootstrap.
2. Inspect AVM1 ActionScript tags, external loads and URL path casing, spaces, and hostnames.
3. Map the original ZIP's historical host paths for same-origin Ruffle execution, keeping original bytes private.
4. Validate desktop/iPhone Safari behavior, stage progression, audio and touch.
5. Seek permission before publishing original game binaries or hosting a public copy.

These verified archive files are **not** committed to the public repository. The ZIP evidence establishes archived bytes and hashes, but not the author's grant of redistribution rights or game completeness.

## 2026-10-20 follow-up: confirmed HTML bootstrap and SWF 5/6 headers

The original archived `index.html` is 3,104 bytes and uses Flash `object`/`param` tags. Its attributes specifically reference **`Title.swf`**, `Scripts/swfobject_modified.js` and optional `Scripts/expressInstall.swf`. `Title.swf` is the genuine original Flash bootstrap file. Evidence: https://github.com/chengboonrong/the-house-web-port/actions/runs/39360361509

The first-game original-host files were read-only scanned in the ephemeral runner. All are FWS files, with SWF file versions 5 or 6. This is consistent with a historical **AVM1 / ActionScript 1–2** era game, but definitive script opcode/VM confirmation requires detailed tag/bytecode analysis.

Heuristically detected cross-room SWF filenames in original binary strings:

| Original file | SWF version | Candidate SWF references (not proven executed) |
|---|---:|---|
| Title.swf | 6 | No literal `.swf` match |
| Dining room.swf | 6 | Bathroom.swf |
| Bathroom.swf | 6 | Dining room.swf, Kitchen.swf |
| Kitchen.swf | 5 | Bathroom.swf, Dining room.swf, Living room.swf |
| Living room.swf | 5 | Bathroom.swf, Corridor.swf, Dining room.swf, Kitchen.swf |
| Corridor.swf | 5 | Bathroom.swf, Credit.swf, Dining room.swf, Kitchen.swf, Living room.swf |
| Credit.swf | 5 | Bathroom.swf, Corridor.swf, Dining room.swf, Kitchen.swf, Living room.swf |

These are **embedded string matches**, not yet verified `loadMovie()` calls; they could represent menus/links or dormant scripts. Exact casing and spaces must be preserved for Ruffle/virtual filesystem access.

Evidence: https://github.com/chengboonrong/the-house-web-port/actions/runs/39360466144

**Next technical step:** inspect DoAction bytecode and verify which transitions use `loadMovie` vs `getURL`; then stage the original files privately under a same-origin Ruffle base path.
