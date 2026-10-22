# WebKit consecutive original-room interaction investigation (2026-10-20)

This report covers the second step after the established **original Corridor -> Dining Room** touch transition. All tests use the verified Sinthai 2005 GameZIP, original AVM1 bytecode, Ruffle 0.7.1, Linux Playwright WebKit, a 390x844 touch viewport and an ephemeral localhost host.

## New result

In https://github.com/chengboonrong/the-house-web-port/actions/runs/39423030000:

- Corridor -> Dining Room succeeded on the first original-button touch, HTTP 200, followed by 267 sampled colors in the non-flat recovered image.
- The test continued on the same player and tried **15 bounded touch coordinates** near the Dining Room nested button origin and room edges.
- No `Bathroom.swf` request was observed in that 15-touch sample.
- Browser JavaScript errors: 0.

The Dining Room to Bathroom button belongs to a nested Sprite (character 90 in Sprite 91), so its placement transform origin at (398.45,194.35) is relative to the parent; a hit-test or puzzle/animation state may prevent it from being clickable at these coordinates. **The absence of a request is inconclusive, not a verified Ruffle or WebKit failure.**

## Improved regression after this observation

`scripts/browser-original-webkit-probe.mjs` now also records post-continuation stage pixel diversity and player readiness, and rejects an actual crash, missing Ruffle interface, unexpectedly flat screen, or page script errors after these attempts. A valid first transition remains the strict CI pass criterion; a second room transition is reported, not fabricated.

## Next step for deterministic second-room taps

Before claiming authentic multi-room progression, analyze exact DefineButton2 hit shape and nested Sprite 91 world placement, or complete the original Dining Room puzzle legitimately through the player. Only then use the observed original button geometry as a strict browser regression. Do not alter protected SWF bytecode or invent a synthetic game state.

The first transition and ongoing playback checks are **Linux WebKit**, not physical iPhone Safari; real-device touch, GPU, WebAudio and copyright licensing are still open.
