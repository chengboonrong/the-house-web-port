# Verified continuous original-room navigation in WebKit (2026-10-20)

Verified from the unmodified Sinthai Studio The House (2005) Flashpoint original SWF package, run privately in a localhost Ruffle 0.7.1 player on Linux Playwright WebKit (390×844 touch emulation).

## TWO consecutive original scene transitions verified

Evidence: https://github.com/chengboonrong/the-house-web-port/actions/runs/39429244255

1. `Corridor.swf` → `Kitchen.swf`: First native touch at stage (266,589) activated the original button, Kitchen SWF loaded HTTP 200; stage remained non-flat (181 sampled colors), player readyState 2 / isPlaying true.
2. `Kitchen.swf` → `Bathroom.swf`: First native touch at stage (151,589) activated another original button, Bathroom SWF loaded HTTP 200; stage remained non-flat (122 sampled colors), player readyState 2 / isPlaying true.

No JavaScript page errors. **These transitions happened sequentially within the same browser-hosted original Flash player**, without resetting or artificially loading the destination from the host dropdown. Native `GetURL('_level0')` ActionScript was preserved.

A separate original-file static inspection establishes that Dining Room button 90 sits inside sprite 91, whose main-timeline placement is at (0,0), scale 1. Missing the Dining→Bathroom hotspot is not explained by a parent sprite translation; visibility/timeline/hit-shape and original puzzle conditions remain possible explanations.

## Regression strategy

`scripts/browser-original-webkit-chain.mjs` now requires the two established transitions and render recoveries to pass. It also attempts a **third** original button: Bathroom → Dining room, using the verified bottom-edge button 10 matrix origin (~13.3,585.3). A third-hop miss remains explicitly exploratory until an actual first success is observed.

The CI workflow `.github/workflows/original-webkit-probe.yml` runs the exact original GameZIP privately and uploads only JSON metadata, not original SWF or gameplay images.

## Scope

This is real Linux WebKit execution, **not iPhone Safari hardware**. Completing all puzzles, verifying jump scares and actual audio, performance/memory and legal permission for public redistribution are still pending.
