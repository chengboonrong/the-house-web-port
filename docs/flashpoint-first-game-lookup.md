# Flashpoint first-game acquisition investigation — 2026-10-20

## Important: search by identity, not title alone

Target: **The House**, released **2005**, developer **Sinthai / SINTHAIstudio** (Thai Flash point-and-click horror game; five rooms). Many unrelated games use the same name. Do not conflate **The House 2** (2010) with this title.

Independent reference: https://gamefaqs.gamespot.com/flash/353779-the-house-2005/data

### Verified archive entry points

- Official Flashpoint collection search instructions: https://flashpointarchive.org/datahub/Searching_the_Collection
- Flashpoint's browser search: https://flashpointarchive.org/search
- Database-search interface: https://flashpointproject.github.io/flashpoint-database/search/
- Historical Jay is Games mirror: https://games.jayisgames.com/games/the-house/
- Jay is Games 2005 review confirms the developer authorized **Jay is Games** to serve the title at the time: https://games.jayisgames.com/review/the-house.php

### Reusable existing project: FlashNX

https://github.com/Jonathan8520/FlashNX/blob/main/rust/src/sources/gamezip.rs

The project's source describes a Flashpoint lookup and GameZIP retrieval protocol. Treat this as **third-party implementation documentation**, not as confirmation that its API works today, nor that the correct game is present. Avoid introducing an unaudited automatic download or republishing route until entry identity and rights are verified.

## Checklist for a confirmed first-game Flashpoint entry

1. Confirm exact title, developer, year, platform and screenshot.
2. Record **entry UUID** and **Launch Command** from the metadata page.
3. Record original host and *exact URL path* from Launch Command; do not infer SWF filenames.
4. Check whether the entry uses a single SWF, Legacy data or multi-file GameZIP.
5. If an authorized local copy can be obtained, inventory all original paths, SHA-256 hashes and dependencies with our local tooling.
6. Compare with the 2005 Jay is Games screenshot/walkthrough and original developer's description.
7. Mark any inconsistency clearly. No public redistribution without permission.

## Current finding

Flashpoint's search tool and metadata facilities are confirmed. **A specific SINTHAI The House (2005) UUID or verified GameZIP was not recovered in this research pass.** A search result titled simply "House" with developer `isaacnite` and a 2016 date is unrelated.

Do not add an unverified Flashpoint UUID to the project's game manifest.

## Next actionable task

Find the first-game entry UUID/Launch Command in Flashpoint or contact Sinthai for a provenance-confirmed research copy. Ruffle host PR #8 can then accept the original files without inventing a replacement game.
