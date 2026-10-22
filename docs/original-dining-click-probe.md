# Authentic Dining Room click-through probe — 2026-10-20

## Live experiment

- Used the verified Sinthai 2005 GameZIP staged privately on GitHub Actions.
- Loaded original Dining room.swf under Ruffle 0.7.1 + Chromium (HTTP 200).
- Sent 64 genuine Playwright mouse clicks using an 8 by 8 grid.
- Observed no request to /original/Bathroom.swf and no JavaScript page errors.
- Workflow: https://github.com/chengboonrong/the-house-web-port/actions/runs/39373215167
- Script: scripts/probe-original-clicks.mjs

Status: NO_ROOM_TRANSITION_OBSERVED_IN_BOUNDED_CLICK_SWEEP.

## Interpretation

This is **not proof of Ruffle incompatibility**. The original game may require puzzle progression, exact button location, or timing. The test exercises real browser input but does not know the room's prerequisites.

The original file has a verified DefineButton2 button ID 90 whose AVM1 GetURL action targets Bathroom.swf on _level0. Upstream Ruffle's AVM1 implementation handles _level0 as an internal movie load. Neither fact proves the button was visible or activated during this sweep.

## Next evidence requirement

Trace original button 90 placement through PlaceObject2 and its sprite timeline, identify the actual hotspot/trigger frame, and drive a controlled interaction sequence. Log stages separately: resource request, HTTP success, metadata changes, displayed pixels. Do not publish original assets or screenshots.

## Explained 2026-10-22

Two causes, both now verified. Button 90 exists only on sprite 91's final stop
frame (461), reached by a 17-tap original button chain. Also, `Dining room.swf`
sets `Stage.scaleMode = "noScale"`, which made grid points map to the wrong
stage coordinates. See `verified-dining-room-puzzle.md`.
