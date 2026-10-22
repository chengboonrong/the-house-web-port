# Original Dining Room puzzle completed by touch in WebKit

Date: 2026-10-22. Original Sinthai Studio Flashpoint GameZIP (SHA-256 of
`Dining room.swf` `53457442…63b5`), Ruffle 0.7.1, Playwright WebKit with a
390 × 844 touch viewport. Not a physical iPhone.

## What the original SWF does

Static analysis (`scripts/inspect-original-button-placements.py`, raw SWF bytes;
cross-checked locally against a JPEXS FFDec 26.4.0 decompile that is not part of
the repository):

- `Title.swf` runs `getURL("rooms.html","_self")`, and the original `rooms.html`
  embeds `Dining room.swf` at its native 600 × 600. The Dining Room is the
  first room of the 2005 game.
- The room is sprite 91 (461 frames) on main depth 1, fading in over main
  frames 135–152. Its frame scripts are only `stop()`, on frames 1, 15, 30, 64,
  79, 85, 103, 118, 128, 131, 233, 270, 290, 305, 365, 385, 400, 410 and 461.
- Each stop frame shows buttons whose only action is `gotoAndPlay(n)` on
  sprite 91. Three hit shapes are reused: a 58 × 92 quadrilateral (the picture
  on the floor), a 350 × 440 rectangle (the picture held close) and a 53 × 54
  rectangle (a ball).
- Button 90, the only Dining Room `GetURL("Bathroom.swf","_level0")`, is
  placed **only on stop frame 461**, the end of the room. This is why the
  2026-10-20 64-click grid on the opening state could not leave the room.

The inspector replays sprite 91's display list, composes button hit-test
bounds into stage pixels and does a breadth-first search over stop frames.
The shortest route has 17 taps, and the inspector tool reproduces the FFDec result exactly:

| Stop | Button | Event | Stage tap (px) | Plays to |
|---:|---:|---|---|---:|
| 1 | 19 | release | 149.7, 468.3 | 15 |
| 15 | 30 | release | 300.4, 380.3 | 30 |
| 30 | 32 | release | 149.7, 468.3 | 64 |
| 64 | 39 | release | 300.4, 380.3 | 79 |
| 79 | 40 | release | 149.7, 468.3 | 103 |
| 103 | 44 | release | 300.4, 380.3 | 118 |
| 118 | 45 | release | 149.7, 468.3 | 128 |
| 128 | 51 | release | 149.7, 468.3 | 131 |
| 131 | 53 | release | 149.7, 468.3 | 233 |
| 233 | 57 | release | 300.4, 380.3 | 270 |
| 270 | 63 | release | 149.7, 468.3 | 290 |
| 290 | 64 | release | 300.4, 380.3 | 305 |
| 305 | 65 | release | 351.0, 277.3 | 365 |
| 365 | 69 | release | 149.7, 468.3 | 385 |
| 385 | 70 | release | 300.4, 380.3 | 400 |
| 400 | 71 | **rollOver** | 351.5, 277.0 | 410 |
| 410 | 80 | release | 149.7, 468.3 | 461 |
| 461 | 90 | release | 487.2, 200.0 | `Bathroom.swf` on `_level0` |

The same search finds button routes in `Bathroom.swf` (12 taps, exit to
`Kitchen.swf`) and `Kitchen.swf` (18 taps, exit to `Living room.swf`). Those
two routes have not been run in a browser.

## Two port defects found and fixed in the host

Neither fix changes SWF bytes or game state. Both are in `public/port-host.js`.

1. **noScale crop.** `Title.swf` and `Dining room.swf` set
   `Stage.scaleMode = "noScale"`. At the original 600 × 600 embed this was
   invisible. In the 362 px phone player Ruffle showed only the central
   362 × 362 stage pixels: no navigation bar, no exit link, and every tap
   mapped to the wrong stage point. The fix is Ruffle's `forceScale: true`, which keeps the
   default `showAll`. No original script reads `Stage.width`/`height`.
2. **AVM1 `on(rollOver)` cannot fire from touch in Ruffle 0.7.1.** A tap
   delivers `pointerover`, `pointerdown`, `pointerup`, with no `pointermove`.
   Ruffle's `update_mouse_state` (core/src/player.rs, v0.7.1 and current
   master) sees the hover change only after the button is down. It treats
   that as a drag, and for AVM1 sends `DragOver` but never `RollOver`.
   `on(release)` buttons still work; button 71 at frame 400 never fires, so the
   room cannot be finished. A mouse hover fires it (checked locally). The host
   now dispatches one `pointermove` at the touch point before Ruffle handles a
   non-mouse `pointerdown`. That is the hover-then-press sequence a mouse makes.
   Mouse input is untouched.

## Browser regression

`scripts/browser-original-webkit-chain.mjs metadata.json` keeps the
Corridor → Kitchen → Bathroom → Dining Room chain and endurance checks, then
reads the inspector's Dining Room route and:

1. **Control:** taps the exit link's position while sprite 91 is on frame 1.
   Button 90 does not exist yet, so the test requires zero `Bathroom.swf` requests.
2. Taps the 17 route points with touch, waiting `2 × playFrames / fps + 1 s`
   after each tap. Stop frames hold, so a long wait is safe.
3. Taps the same exit position again and requires a new `Bathroom.swf`
   request with HTTP 200/304, a non-flat stage, a playing player and the same player element.

Only button 90's action can request `Bathroom.swf` from this room, and it
exists only on frame 461. So the request proves that the original button
chain ran to the end through touch input.

Local macOS WebKit 26.6 run: control 0 requests, 17 steps, exit 1 request
(HTTP 200), 142 sampled colours, still playing, same player, no page errors.
With the touch adapter disabled, the same run exits 1: the control and all 17
taps run, but the exit tap produces 0 `Bathroom.swf` requests. The rollOver
step never fires, so frame 461 is never reached.

## Observed but not asserted

These come from private local screenshots, which are not committed or uploaded. They are
descriptions, not CI evidence:

- From stop 131, button 53 plays frames 135–233. The family drawing appears behind shattered
  glass with a distorted face; sounds 61 and 62 start on frame 232.
- After the ball rollOver, a dark splatter replaces the ball (frames 405–410).
- FFDec's reference render of frame 420 is a full-screen face, the jump
  scare after button 80 (sound 83 starts on frame 417). The browser run did
  not capture that moment.
- At frame 461 a red "Go to the next room ▶" link appears, and tapping it shows
  the original "2nd room / The BATHROOM" title card.

## Still unverified

- Physical iPhone Safari: the real touch pointer sequence, adapter behaviour,
  tap precision and audio unlock.
- Audible sound and jump-scare timing against original Flash Player.
- The Bathroom and Kitchen routes in a browser, and the Living room, Corridor and
  Credit structures. The inspector found no stop-frame route for these.
- Rights to redistribute the original game.
