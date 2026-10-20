# Verified Ruffle browser audio API activity on original The House (2005)

Date: 2026-10-20. This records results from the **actual** verified Sinthai Studio Flashpoint GameZIP played with Ruffle 0.7.1 in headless Chromium on a temporary GitHub Actions runner, not simulated audio.

Evidence: https://github.com/chengboonrong/the-house-web-port/actions/runs/39376495898

Probe: `scripts/browser-original-audio-probe.mjs`, integrated in `.github/workflows/original-ruffle-smoke.yml`.

## Observed facts

The probe instruments browser WebAudio APIs without capturing PCM, SWF binaries, audio assets or screenshots, then loads the original Title.swf, sends a browser click, and loads the original Dining room.swf.

| Browser observation | Before load | Title loaded | After user click | Dining Room loaded |
|---|---:|---:|---:|---:|
| AudioContext objects constructed | 0 | 1 | 1 | 2 |
| Context resume calls | 0 | 1 | 1 | 2 |
| AudioBufferSourceNode.start calls, cumulative | 0 | 40 | 97 | 176 |
| AudioContext latest observed state | — | running | running | running |
| Ruffle player isPlaying | — | true | true | true |

Both original SWF resource fetches returned HTTP 200. Chromium reported no page errors. These are **real playback API calls**, stronger than merely finding embedded `DefineSound`/`StartSound` tags in the source file.

The browser probe now requires a WebAudio context, original source starts and a running context, and fails CI if these observations are missing. The instrumentation preserves original AudioContext class behavior and forwards native calls, but that intervention should still be understood as measurement rather than evidence of unmodified user hardware behavior.

## What remains unknown

A running WebAudio context and source-start calls do **not** prove sound is audible or correct on physical hardware. Headless Chromium, Ruffle WebAudio scheduling, device audio output configuration and Safari's gesture/autoplay restrictions may differ.

Do not state that iPhone Safari sound works without **actual device testing**, and do not upload copyrighted audio for testing/publication without rights.

## Follow-on actions

- Observe actual audio output from a permitted non-headless browser, without redistributing copyrighted assets.
- Check AudioContext state before/after Safari user activation; ensure prompts/touch events unlock sound.
- Validate audible background music and discrete jump-scare effects in a real playthrough, and timing/synchronization with room transitions.
