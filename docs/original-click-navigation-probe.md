# Original SWF click-navigation probes — current evidence

Date: 2026-10-20.

## Actual browser observations

Headless Chromium with official Ruffle and the original Sinthai The House (2005) Flashpoint GameZIP successfully loaded the real stage files. Automated **native mouse clicks**, not calls to Ruffle internals, were attempted:

- Dining Room: **64** grid click locations; no HTTP request for `Bathroom.swf` observed.
- Corridor: **144** grid click locations; no HTTP request for a sibling room SWF observed.
- Both source SWFs returned HTTP 200, and the probes did not record JavaScript page errors.
- The Corridor probe **failed its strict navigation assertion**; this is a legitimate unverified acceptance test, not a rendering regression.

Evidence: https://github.com/chengboonrong/the-house-web-port/actions/runs/39373262998

### Interpretation

This does **not** establish that Ruffle mishandles AVM1 `GetURL(..., '_level0')`. The grid probe does not know the actual on-screen location of navigation buttons, whether those buttons are displayed at the current timeline frame, or whether the game requires puzzle progression first. Some scenes can advance in response to specific interactions rather than arbitrary clicks. Therefore **"not observed" is not proof of broken navigation**.

## Concrete next investigation

Determine actual clickable hotspot coordinates for buttons found in `docs/verified-avm1-navigation.md`, including their display placements, hit areas and parent clip transforms at relevant frames, or use an authorized manual exploratory play session on the local-only host. Then test a known hotspot at the right stage frame with a validated transition request and subsequent Ruffle movie metadata. Record the exact button, frame and request status.

## Engineering correction

`public/port-host.js` now keeps polling the current original movie's Ruffle metadata (bounded to the lifetime of the player) so that a true `_level0` load from 600×600 room to another resolution updates the stage geometry. The old single-shot aspect ratio sync ran only when the host manually loaded a new movie.

The exploratory Corridor click test remains a **non-blocking diagnostic step** in GitHub Actions, with the JSON result preserved. The baseline title/room render smoke stays a strict acceptance test; a green workflow must not be interpreted as passed native room navigation. Original binaries and screenshots are not uploaded.

Legal permission and actual iPhone Safari verification remain unresolved.
