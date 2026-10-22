# Original The House (2005): Playwright WebKit mobile-touch verification

Date: 2026-10-20.

## Tested reality

The verified Sinthai Studio first-game Flashpoint GameZIP was staged privately on an ephemeral GitHub Actions runner. Official self-hosted Ruffle 0.7.1 loaded the original SWFs in **Playwright's Linux WebKit engine** using a 390x844, touch-enabled mobile browser context.

Evidence: https://github.com/chengboonrong/the-house-web-port/actions/runs/39411115617

- Title.swf returned HTTP 200. Ruffle metadata: native 800x515 stage, SWF version 6; stage ratio adapted correctly.
- Corridor.swf returned HTTP 200 and was loaded without browser exceptions.
- The *first* native mobile-simulated touchscreen tap on the original Corridor bottom navigation hotspot caused the original AVM1 `GetURL('Dining room.swf','_level0')` request, HTTP 200.
- Three post-transition screenshots were analyzed **locally on the runner**. Approximate cumulative wait 1.0 s: 2 sampled colors; 3.5 s: 3; 8.0 s: 271, representing recovery from a near-black loading frame to visibly non-flat rendering.
- Browser page errors: 0.
- Result: `WEBKIT_TOUCH_TRANSITION_RENDERED`. No copyrighted original SWFs, gameplay screenshots or audio were uploaded to GitHub; only JSON diagnostics.

## Reproduce

Test script: `scripts/browser-original-webkit-probe.mjs`.

Workflow: `.github/workflows/original-webkit-probe.yml`.

The workflow downloads the verified game privately, stages it in an ignored working tree, serves it only at localhost, runs Playwright WebKit, and uploads only a small metadata report.

## What this does and does not prove

**Verified:** startup of original SWF in Linux WebKit, touch event routed into the game, internal `_level0` movie loading request and non-flat recovered display. This is concrete cross-engine confidence beyond Chromium.

**Not verified:** physical iPhone Safari runtime (different OS and WebKit distribution), actual handset GPU/memory, audible Safari audio, continuous puzzle/horror sequence correctness, multi-room navigation endurance, accessibility and production distribution rights. Do not call this a finished iPhone port.

Future work: hardware WebKit/Safari smoke, original playback duration and multi-step navigation tests, audio session/unlock and memory tracking, and legal authorization before any public original SWF distribution.
