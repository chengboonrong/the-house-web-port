# The House (2005): original-file provenance investigation

Date: 2026-10-20. **Evidence, not a recovered copy. No verified SWF checksum yet.**

## Important new original-era lead: Jay is Games

- The September 8, 2005 Jay is Games review states the game was hosted on the publisher's servers **with Sinthai's permission at the time** because of bandwidth issues.
- Historical article: https://jayisgames.com/review/the-house.php
- Its old **Play The House** link resolves to `https://jayisgames.com/games/the-house/`, which currently returned HTTP 403 during this research. This is a high-priority archival investigation path.
- Historical authorization for **Jay is Games** does NOT authorize us to mirror, redistribute or publish the game in a different project. Request new permission for public redistribution.

## More authoritative confirmation

- Original developer page (Thai): https://thehouse.online/thehouse1_info/
- It confirms a Flash point-and-click game first released in 2005 with **five rooms**.
- Current official page: https://www.thehouse.online/game/ currently says to use desktop Chrome + Ruffle; no mobile support claimed.
- MobyGames lists five rooms as Dining Room, Bathroom, Kitchen, Living Room, Corridor: https://www.mobygames.com/game/52645/the-house/
- The walkthrough in Jay is Games provides historic accounts of the experience; do not mistake these observations for exact SWF timing or source-code behavior.

## Flashpoint context — critical version distinction

A 2025 discussion of **The House 2** reports a main `Intro.swf` and separately loaded `room1.swf`, `room2.swf`, etc., found through Flashpoint logs: https://www.reddit.com/r/flash/comments/1mkqol2/

**This establishes a multi-file possibility for The House 2, NOT the exact structure of The House 1 (2005).** No first-game SWF filename or dependency set has been confirmed.

## Prioritized next acquisition routes

1. Ask Sinthai Studio about an **authorized** archival/research copy and rights for a noncommercial iPhone Safari port.
2. Examine archived captures of `https://jayisgames.com/games/the-house/` and contemporaneous site paths. Record archive capture timestamps and original URLs; do not assume an archive grants redistribution.
3. Inspect Flashpoint metadata and local run logs for *The House (2005)*, carefully distinguishing the sequel, community reuploads, and unrelated titles.
4. Only after obtaining a defensible research copy, record SHA-256 and dependencies using `scripts/stage-swf.mjs`; keep actual bytes uncommitted.

## Verification checklist

- [ ] Identical title, year and developer verified
- [ ] Download or archive URL provenance verified
- [ ] Original SWF entrypoint verified (not assumed `Title.swf`)
- [ ] Binary checksum and stage metadata captured
- [ ] Supplemental SWF/media/XML filenames captured
- [ ] Ruffle compatibility assessed against original behavior
- [ ] Public distribution permission obtained

**Status:** Research pathway found; original executable contents still unavailable for inspection.
