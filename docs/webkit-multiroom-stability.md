# Sustained multi-room original Ruffle WebKit playback verification

Date: 2026-10-21.

## Previous authenticated milestone

Three genuine, sequential AVM1 GetURL(_level0) transitions on the unmodified Sinthai 2005 Flashpoint archive have been verified in one Linux Playwright WebKit session:

1. Corridor → Kitchen, button at original SWF stage (266,589)
2. Kitchen → Bathroom, button at (151,589)
3. Bathroom → Dining Room, button at (19,589)

Each SWF returned HTTP 200, restored non-flat imagery, and kept the original Ruffle player active. Evidence: https://github.com/chengboonrong/the-house-web-port/actions/runs/39429785055

## New stability-regression expectations

`scripts/browser-original-webkit-chain.mjs` now, for **each** original transition:

- records the elapsed wall-clock time between beginning its real touch attempt and observing the original destination SWF response;
- checks after the existing scene-recovery interval that the frame is non-flat and player is running;
- waits an **additional second**, repeats the screenshot pixel-diversity and Ruffle isPlaying checks and retains only frame hashes and aggregate metadata (never screenshots or SWF bytes);
- ensures no original SWF network request was reported failed;
- checks the host did not reload and the same original Ruffle DOM player remained attached.

A frame changing by itself is not proof of intended horror animation playback. Even two successive non-flat frames only establish that the player did not immediately go blank after the transition.

## Unverified

- Exact original puzzles and jumpscare event sequences, including state-dependent transitions and synchrony.
- Audible audio on a physical iPhone, Safari-specific WebAudio policies, memory/GPU limits and native touch latency.
- Rights clearance before any public release of the original game assets.

The test is Linux WebKit, **not physical iOS Safari**.

## Passive Dining Room endurance regression (2026-10-21)

After the third original transition, the WebKit chain test additionally samples
four frames at three-second intervals (approximately 12 seconds). Each sample
records pixel diversity, frame hash, Ruffle playback status, whether the
original player is still connected, host path and navigation count, and any
failed original requests or page errors. The test fails if playback stops,
the scene becomes flat, the player is detached, the host navigates, or
original requests/errors fail.

This is an **endurance test**, not proof of a successful original puzzle,
horror event, animation progression, or audible soundtrack. Different frame
hashes are only observations and must not be treated as event verification.
Next genuine gameplay validation requires locating original SWF button/action
provenance and then checking a specific real event against browser evidence.

## Bounded render-recovery diagnostics (2026-10-22)

The original three-hop WebKit test now records metadata-only stage snapshots at
1.2, 3.0 and 7.4 seconds after observing each destination SWF response.
It reports the first sampled non-flat frame as a **bounded observation**, not
an exact recovery time, and preserves the established 7.4-second regression
checkpoint and later one-second stability assertion. The screenshots are kept
in memory only; diagnostic JSON contains aggregate color counts and hashes.

**Interpretation:** a non-flat frame can reflect a loader, menu or ordinary room
artwork. It is *not* evidence of puzzle progress, a jumpscare or correct audio.
No speculative hotspot is tapped or game state injected. A deterministic puzzle
regression still requires verified AVM1 action provenance, timeline visibility,
and a reproducible authentic input sequence.
