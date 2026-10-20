# Verified click navigation on original The House (2005)

Date: 2026-10-20.

## Actual browser observation

Using the verified Flashpoint first-game archive (UUID `a8b2e1fb-e408-2f0f-b1b8-08537b0e864b`), Ruffle 0.7.1, and Chromium, the browser loaded authentic `Corridor.swf` privately and received `/original/Dining%20room.swf` **HTTP 200** after mouse clicking a navigation button.

- Static button position evidence: https://github.com/chengboonrong/the-house-web-port/actions/runs/39373851419
- First successful click navigation: https://github.com/chengboonrong/the-house-web-port/actions/runs/39374037275
- Subsequent screenshot hash/state comparison: https://github.com/chengboonrong/the-house-web-port/actions/runs/39374255232

The original `PlaceObject2` button transform origins for Corridor include coordinates `(13.25,585.25)`, `(144.5,585.25)`, `(259.65,585.25)`, `(364.45,585.25)` in the 600×600 native stage. The first successful `GetURL('Dining room.swf','_level0')` event was observed after **two targeted pointer clicks**, using an offset of (6,4) from the first origin. There were zero JS page errors.

After the click, browser stage screenshot SHA-256 changed (without storing or uploading screenshot bytes). Ruffle's top-level metadata continued to identify the initially loaded `Corridor.swf` (600×600 / 20 frames / 24 FPS / SWF 5). Therefore the HTTP request and pixel change establish a real navigation event but do **not yet** independently verify the successor's visual content or full playability.

## Why previous click sweeps were inconclusive

Earlier blind click sweeps tried 64 Dining Room points and 144 Corridor points with no SWF transition observed; the original navigation buttons sit close to y=585 of 600 px. These grid samples were not deterministic hit tests and should **not** be considered evidence of a broken Ruffle engine.

## Implementation and next test

- `scripts/inspect-original-button-placements.py` emits local transform origins from original SWF placement tags (not clickable centers).
- `scripts/browser-original-navigation.mjs` probes the original bottom-edge placements, records HTTP responses and compares stage screenshot hashes, without uploading game images.
- Next: inspect button hit-test geometry and active timeline state for deterministic Corridor→Dining→Bathroom progression. Validate visuals, audio, and mobile Safari separately.
- No original game files are committed and copyright permission remains required for a public release.
