# Flashpoint public API discovery (2026-10-20)

The FlashNX source at https://github.com/Jonathan8520/FlashNX documents the public Flashpoint API endpoint and JSON result structure:

- Endpoint: https://flashpointarchive.org/api/search
- Parameters: query, limit
- JSON envelope: games array
- Useful result fields: id, title, developer, releaseDate, gameData, legacyLaunchCommand

## Live lookup

```bash
node scripts/search-flashpoint-api.mjs
```

The script searches the title and Sinthai developer, verifies Flash platform and labels first-game candidates for manual review. It does not fetch GameZIPs or SWFs.

## Reproduce from offline API response

```bash
node scripts/search-flashpoint-api.mjs --snapshot /path/to/flashpoint-api-response.json
```

Tests use synthetic response records, not fabricated real UUIDs.

## Known blocker

This environment cannot resolve flashpointarchive.org for direct HTTP API requests; the web tool also refused the parameterized JSON endpoint. This means **no genuine The House 2005 UUID has yet been retrieved**, not that the archive lacks the game.

Next: inspect a real candidate's ID, gameData/legacy launch command, screenshot and author, then derive its original virtual host/path. Hash the complete authorized archive files before Ruffle testing. Public redistribution requires permission.
