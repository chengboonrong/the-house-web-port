# The House (2005): source evidence and binary anatomy

## Original identity

The Korean archive's first-game corridor post lists `Corridor.swf`, `Bathroom.swf`, both `Dining room.swf` and `Diningroom.swf`, `Kitchen.swf`, `Livingroom.swf`, and `Credit.swf`: https://vidkidz.tistory.com/546

These are **archive attachment claims**, not verified 2005-original checksums. The game has five rooms, while the seventh item is credits and the second dining file is an alternate filename.

## Host-side attachment discovery

The page exposes signed `blog.kakaocdn.net` download links. At the time of inspection, the browser retrieval tool failed to fetch those binary attachments. We therefore have not inspected any SWF bytes or determined whether the links have expired.

Use the new offline scanner after saving the public page HTML:

```bash
node scripts/extract-archive-attachments.mjs ./archived-page.html > ./private-attachment-index.json
```

It records host, filename, path, reported expiration, and whether the URL has temporary signing fields. **It intentionally strips signed query strings**, which may contain credentials. It never downloads anything.

## Real dependency graph (not yet verified)

The intended procedure is:

1. Acquire and document a lawful, provenance-confirmed SWF research copy.
2. Calculate SHA-256 of each original binary; compare duplicate-named assets.
3. Run `node scripts/inspect-swf-structure.mjs file.swf` to check signature, Flash version, dimensions, frame rate and DoAction/DoABC top-level tags.
4. Use FFDec for nested ActionScript and internal symbols; inspect `loadMovie`, `loadMovieNum`, external audio and data references.
5. Verify runtime requests from Ruffle's URL-mode port host and compare to the static references. Distinguish *requested*, *present*, *successfully decoded*, and *actually displayed* resources.

## Preserve original execution

Do not translate room scenes or improvise jumpscares if Ruffle executes the originals. The target is an original SWF port, not a gameplay remake. If certain Flash APIs fail in Ruffle, investigate the smallest targeted compatibility fix or contribute a reproducible issue upstream.

## Legal scope

An archive copy may help research preservation but does not establish the right to republish the game. Ask Sinthai for permission before bundling binaries or hosting a public port.
