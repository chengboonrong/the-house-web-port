# Original room transition recovery and sound investigation (2026-10-20)

This investigation ran the authenticated Sinthai 2005 Flashpoint original GameZIP on GitHub Actions in real Chromium using Ruffle 0.7.1. Only JSON evidence and explicitly requested temporary stage screenshots were retained; original SWF source bytes were never committed.

## Verified Corridor → Dining Room transition

Source workflow: https://github.com/chengboonrong/the-house-web-port/actions/runs/39375063196

The original Corridor button at a Flash stage origin near (13.25, 585.25) was clicked. The unmodified AVM1 `GetURL('Dining room.swf','_level0')` resulted in `/original/Dining%20room.swf` HTTP 200. No page JavaScript exceptions were reported.

The first screenshot immediately after navigation appeared almost entirely black. We therefore updated `scripts/browser-original-navigation.mjs` to record three distinct elapsed times after the request, including pixel variation and hashed screenshot checks:

| Time after click | Sampled unique colors | Bright pixel ratio | Observation |
|---|---:|---:|---|
| ~0.5 s | 2 | 0.0064 | Essentially black |
| ~2.3 s | 6 | 0.0077 | Very dark transition |
| ~6.5 s | 470 | 0.0697 | Real original Dining Room background and bottom navigation are visible |

The 6.5-second screenshot was inspected visually: it shows the monochrome original room with red text and the historic bottom room navigation links. This establishes actual *post-click rendering recovery*; it is not merely a successful HTTP request or arbitrary animation changing pixels.

The player-level metadata after transition remained reported as 600×600, 20 frames, 24 FPS, SWF v5; this may reflect the host/outer movie metadata rather than the currently loaded child movie and should not be used as a definitive scene identifier.

**Remaining runtime tasks:** verify that this later scene accepts interactions and runs intended horror event animations, test repeated room transitions without Ruffle reboot, and validate mobile WebKit touch/audio.

## Real SWF sound resources

Static reader `scripts/inspect-original-sound-tags.py` parses original FWS sound tag counts from top-level timelines and nested DefineSprite records, without extracting audio. Real archive evidence: https://github.com/chengboonrong/the-house-web-port/actions/runs/39375396198

| Original SWF | DefineSound | StartSound | SoundStreamHead2 |
|---|---:|---:|---:|
| Title | 6 | 2 | 7 |
| Dining room | 16 | 26 | 11 |
| Bathroom | 15 | 26 | 9 |
| Kitchen | 15 | 17 | 11 |
| Living room | 16 | 18 | 11 |
| Corridor | 14 | 14 | 12 |
| Credit | 4 | 2 | 8 |

**This confirms audio tags/assets are embedded but does not establish audible playback.** Actual browser sound is subject to device audio hardware, autoplay policy, user gestures, browser audio context state, and Ruffle's codec implementation. We must test on real Safari before making sound-support claims.

## Preservation / public release

No original game binaries are checked into this public repository. Research screenshots and assets are not authorization to host and redistribute a playable original publicly. The original rights-holder's distribution permission remains unresolved.
