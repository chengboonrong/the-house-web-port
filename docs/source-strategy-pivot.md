# Source strategy pivot: stop depending on Kakao CDN

Updated 2026-10-20.

## Problem reframing

The goal is obtaining an **authentic, complete copy of Sinthai Studio's The House (2005)** for analysis and eventually lawful browser preservation, not solving one Korean blog's temporary signed CDN URLs. The previously recovered Kakao link expired 2026-07-31. The archive is only one possible source.

**Order of investigation:**

### 1. Flashpoint Archive — first choice

- Search: https://flashpointarchive.org/search
- Search terms: `title:"The House" platform:Flash`, `dev:Sinthai`, `SINTHAIstudio`.
- Verify against 2005 first game, original developer, original host, five rooms and original release. Do **not** accept a same-title result or The House 2 as proof.
- Record candidate UUID, launch command, source URL, format (GameZIP/Legacy) and screenshots.
- Inspect Flashpoint GameZIP content paths and/or Legacy htdocs only for a confirmed candidate. Keep original paths intact.

Relevant implementations:
- https://github.com/Jonathan8520/FlashNX — Flashpoint search and GameZIP acquisition; `rust/src/sources/gamezip.rs` describes public database search and ZIP retrieval. Its API details may change.
- https://github.com/FlashpointProject/flashpoint-database-api — server API with search, get and files endpoints; the public API's availability and permissions must be checked before use.
- https://github.com/darkraise/flashpoint-web — Flashpoint local-collection browser player via Ruffle, mobile-friendly UI. GPL-3.0: do not copy code into a differently licensed project without checking terms.
- https://github.com/FlashpointProject/launcher — canonical metadata and local game archive workflows.

**Critical:** Flashpoint inclusion is not yet confirmed for the exact first game. No UUID has been verified.

### 2. Internet Archive & Wayback — independent source

- The Internet Archive's softwarelibrary Flash collections sometimes offer original SWFs and companion resources.
- Search historical game/mirror URLs, particularly the original Sinthai site and historic Jay is Games authorized mirror. Query CDX for original SWF URL patterns; inspect response MIME, timestamp, digest, length and status. Index hits alone do not guarantee bytes.
- https://github.com/akamhy/waybackpy — CDX/Availability APIs; source discovery, not a Flash emulator.
- https://github.com/anmol-pawa/flash-arcade — original archived SWF + Ruffle; demonstrates same-origin assets proxy for sub-SWF/XML/audio and `base` handling. MIT code license, third-party archive content rights separate.

### 3. Historical Jay is Games mirror / official author

- https://jayisgames.com/review/the-house.php records that Sinthai expressly permitted Jay is Games to mirror The House because of bandwidth costs. This is evidence of a historic original-host copy, **not** redistribution permission for our repository.
- Research historical page embeds, Wayback snapshots and associated original hostnames. Ask author for authorized originals and permission if possible.

### 4. Korean WAFlash/Kakao — fallback, not single dependency

- https://vidkidz.tistory.com/546 identifies first-game room filenames and credits. Useful for comparison and authenticity cross-check.
- Signed link scraping is best-effort only; expired URL, DNS failure and access restrictions are independent failure modes.
- No bypassing authentication, access restrictions or expired signatures.

## Integration plan once an authentic copy is available

1. Inventory all files and original virtual host paths; record SHA-256 and license/provenance.
2. Stage privately in existing ignored `public/original` with `scripts/stage-swf.mjs`.
3. Inspect SWF signatures/AS indications and loadMovie/import references.
4. Use current Ruffle host, determine whether we need a restricted **local-only** path mapping to preserve historical hostnames and external assets.
5. Only then perform iPhone Safari compatibility work.

Do not add an unverified UUID or publish copyrighted original files to GitHub. A reverse-proxy does not confer redistribution permission.

## Decision

**Priority moves from signed-CDN repair to archived original game recovery.** No more incremental Kakao parser expansions unless another source is demonstrably unavailable and a specific observed issue prevents acquiring the legitimate original.
