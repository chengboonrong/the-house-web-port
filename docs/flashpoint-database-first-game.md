# First-party Flashpoint database lookup: The House (2005)

## Evidence threshold

The aim is to identify an exact, *current Flashpoint metadata entry* for Sinthai Studio's five-room 2005 Flash horror game. A third-party games list distinguishes `The House / Sinthai Studio`, `The House / Anode & Cathode`, and `The House 2 / Sinthai Studio`. Do not collapse these different records.

Independent first-game identity: https://gamefaqs.gamespot.com/flash/353779-the-house-2005/data
Historical Flashpoint guide: https://flashpointarchive.org/datahub/Old_Game_Master_List
Flashpoint metadata search: https://flashpointarchive.org/search

## Read the local database without downloading anything

If Flashpoint is already installed, use the exact SQLite file bundled with your copy (commonly `Data/flashpoint.sqlite`):

```bash
python3 scripts/query-flashpoint-db.py "/path/to/Flashpoint/Data/flashpoint.sqlite" > first-game-candidates.json
```

The inspector **opens SQLite in read-only mode**, discovers the table/field layout, and returns exact-title `The House` entries and developer-matching `Sinthai` house-related entries. It emits UUID, title, developer, release date, platform and launch command if those fields exist. It does not read ZIP files, download games, execute binaries or alter the database.

`CANDIDATE_FIRST_GAME_METADATA` requires exact title `The House` and developer containing `Sinthai`; everything else is `REVIEW_MANUALLY`. A candidate is **not** confirmed merely because those text fields match. Inspect its screenshots and historical source/launch URL, then determine if it is the original 2005 release. Database schema and content vary by Flashpoint version.

## After confirming the UUID

1. Record UUID, launch command, original hostname/path, release date, source information, and database version.
2. Identify whether the game uses legacy htdocs or GameZIP. Consult FlashNX GameZIP handling: https://github.com/Jonathan8520/FlashNX and the Flashpoint API server: https://github.com/FlashpointProject/flashpoint-database-api.
3. Preserve its original virtual HTTP paths and entire supporting resource tree locally.
4. Record SHA-256 for each file, inspect SWF header/DoAction/loadMovie, then run privately in Ruffle.
5. Before public release, verify that the game owner permits redistribution.

**As of 2026-10-20:** a precise first-game UUID, GameZIP ID and complete original binary are **not yet established** by this investigation. Do not introduce speculative identifiers into the manifest.

This replaces the earlier unproductive focus on acquiring an expired Kakao CDN attachment.
