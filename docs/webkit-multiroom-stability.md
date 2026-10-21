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
