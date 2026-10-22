# First authentic-browser render results — 2026-10-20

This report is based on **actual Playwright Chromium** running **official Ruffle 0.7.1** and the **verified Sinthai Studio The House 2005 Flashpoint GameZIP** on an ephemeral GitHub Actions runner.

## Reproducible evidence

- First successful original title render: https://github.com/chengboonrong/the-house-web-port/actions/runs/39371690560
- Successful title + original Dining Room render: https://github.com/chengboonrong/the-house-web-port/actions/runs/39371860632
- Workflow: `.github/workflows/original-ruffle-smoke.yml`
- Browser probe: `scripts/browser-original-smoke.mjs`

The action downloads the archived game temporarily, stages the original site privately, installs official Ruffle, starts a loopback-only Vite server, and runs Chromium. **No screenshots or original game files are uploaded or committed.** The artifact contains JSON diagnostics only.

## Results

| Measurement | Title.swf | Dining room.swf |
|---|---|---|
| HTTP response | 200 | 200 (encoded path `/original/Dining%20room.swf`) |
| Ruffle load API | Success | Success |
| SWF version | 6 | 6 |
| AVM | AVM1 (not AS3) | AVM1 (not AS3) |
| Native stage | 800 × 515 | 600 × 600 |
| Frame rate | 20 | 20 |
| Movie frames | 465 | 152 |
| Sampled non-flat scene pixel colors | 2019 | 243 |
| JavaScript console/page errors | 0 | 0 |

The screenshot hash and aggregate pixel statistics were saved; the actual image itself was intentionally not uploaded. Non-flat rendered pixels, successful SWF HTTP 200 and Ruffle metadata together constitute solid **player and original-file startup evidence**, although the exact artwork was not visually reviewed here.

## Actual integration bug fixed

The first Chromium run emitted `RangeError: Incorrect locale information provided`, with `navigator.language = 'en-US@posix'`. The failed web-component constructor left the page with an `HTMLUnknownElement` which lacked a `.ruffle()` method. This was **not** evidence that the Ruffle player API was obsolete.

The headless-browser test now explicitly uses `locale: 'en-US'` and valid `LANG`/`LC_ALL`. The original `player.ruffle().load(...)` API works.

The smoke test now fails if any original file fails to load, expected source metadata is missing, or page errors are present, rather than marking a non-loaded game as success.

## Remaining fidelity work

- The research host currently gives the stage a fixed 4:3 container, but **original Title is 800:515**, while **Dining Room is square 600:600**. The host should adapt to the original movie metadata while preserving the full stage rather than forcing 4:3.
- Actual click-driven `GetURL(...,'_level0')` room navigation has **not** been exercised in the browser. Independent direct room loading is not proof of room-to-room navigation.
- Audio, mobile touches, overlay prompts and Safari memory behavior have not been validated.
- Redistribution authorization for original game assets remains unresolved.

The game is finally rendering under Ruffle in Chromium; it is **not yet a fully verified iPhone Safari port**.

## Native stage geometry verified in the actual browser

The research host no longer imposes its old fixed 4:3 aspect ratio on all SWFs. Its `synchronizeNativeStage` function uses actual Ruffle movie metadata and sets the player's container aspect ratio automatically.

A regression run with the **real 2005 original** verified the dynamic DOM aspect ratios:

- `Title.swf` → `800 / 515`
- `Dining room.swf` → `600 / 600`

The browser check now fails when either stage ratio, source metadata, HTTP status, rendered color count or the browser error check is wrong. The actual image pixels and original SWF assets remain unshared. Evidence: https://github.com/chengboonrong/the-house-web-port/actions/runs/39372141643

This remains a **direct-file smoke test**, not an automated click-through of the game's native `GetURL('_level0')` links. No iPhone Safari claim is made.
