# The House (2005) — Flash-to-Web Port

> Unofficial preservation engineering project. Not affiliated with Sinthai Studio.

**Goal:** Make the original Flash-era experience accessible in modern browsers, especially iPhone Safari, while preserving original interactions and timing.

**Status:** Early engineering prototype. The demo is *not* a playable port of The House. The example scene and events are invented test fixtures.

## Approach

1. Verify a legitimate original SWF, its origin, SHA-256 checksum, stage dimensions, frame rate, and rights.
2. Evaluate the original SWF using Ruffle on macOS and physical iPhone Safari.
3. If functional, prefer an HTML5/Ruffle web wrapper over rewriting.
4. If incompatible, document verified limitations and implement a behavior-equivalent TypeScript port with evidence.
5. Do not commit or publicly host any original game assets unless redistribution rights have been established.

## Quick start

```bash
npm install
npm run dev
npm test
npm run build
```

The app starts with an **original placeholder interaction demo**. It does not contain the original Flash game.

## Research tools
- Original game site: https://www.thehouse.online/game/
- Ruffle: https://ruffle.rs/
- JPEXS FFDec: https://github.com/jindrapetrik/jpexs-decompiler
- REA: https://github.com/morluto/rea

See [research checklist](docs/research.md) and [iPhone Safari acceptance checklist](docs/ios-safari.md).

## Rights

Repository-authored code is MIT licensed. Original The House game assets, scripts, sound, story, and trademark are not licensed by this repository's MIT license. Obtain permission before redistribution.

## Current development branch

The draft [data-driven port-core PR](https://github.com/chengboonrong/the-house-web-port/pull/6) introduces a generic scene schema, stage coordinate mapping, a deterministic foreground-time action runner, audio unlock/mute adapter, and Vitest tests. The demo remains intentionally fictional.

Run `npm test` for unit tests and `npm run build` for a production build. No original assets or original gameplay are included. Original SWF compatibility and physical Safari validation remain deferred.
