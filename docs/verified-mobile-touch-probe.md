# Original The House mobile-sized touch probe — verified Chromium evidence

Date: 2026-10-20 (Asia/Kuala_Lumpur).

This is a **genuine original Sinthai Studio The House (2005)** SWF running in Ruffle 0.7.1, locally and privately staged from the Flashpoint GameZIP. The browser was Playwright Chromium with `isMobile:true`, `hasTouch:true`, 390×844 viewport, 2× device scale factor, and a virtual touchscreen. **It is not iOS WebKit or an iPhone real-device run.**

## Real browser outcome

GitHub Actions: https://github.com/chengboonrong/the-house-web-port/actions/runs/39395451706

- Source: `Corridor.swf`, HTTP 200.
- First targeted `page.touchscreen.tap` succeeded at browser pixel (26, 505), corresponding to 600×600 Flash stage relative coordinate (19.25, 589.25). The test derives these coordinates from the original DefineButton2/PlaceObject2 navigation button placement rather than guesswork.
- The untouched original AVM1 `GetURL('Dining room.swf','_level0')` caused `/original/Dining%20room.swf` to return HTTP 200.
- Transient near-black transition frames were observed (~0.75 s: 2 sampled colors; ~3.75 s: 3 colors). A later frame (~8.25 s) contained **298 sampled colors**, establishing non-flat rendering recovery.
- JavaScript errors: zero. Click count: **one**.
- No copyrighted SWF, sound or screenshot bytes were uploaded by this test.

## Regression

`scripts/browser-original-touch-probe.mjs` is wired into `.github/workflows/original-ruffle-smoke.yml`. CI requires an authentic next-SWF HTTP 200, followed by at least one non-flat rendered frame. The workflow retains JSON observations only.

## Remaining gaps

- Actual iPhone Safari/WebKit: not tested.
- iOS gesture and audio unlock: not tested.
- Touch accuracy in all original scenes and controls: not tested.
- True game progression, jump-scare timing, complete puzzle and audio fidelity: not tested.
- Public distribution rights for the game's original bytes remain unresolved.

This is an incremental authentic-port compatibility result, **not a completed iOS port**.
