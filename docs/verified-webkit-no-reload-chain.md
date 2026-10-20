# Original The House (2005): repeated room transitions without a browser reload

Date: 2026-10-20. Verified against the genuine Sinthai Studio GameZIP in Playwright Linux WebKit with the official Ruffle 0.7.1 engine, private staging and 390x844 mobile-touch emulation.

## Stronger regression evidence

Run: https://github.com/chengboonrong/the-house-web-port/actions/runs/39437687515

| Step | Original button click | Resource response | Recovered colors | Same player remains attached | Host reload |
|---|---|---|---:|---|---:|
| Corridor -> Kitchen | (266,589) | HTTP 200 | 181 | Yes | 0 |
| Kitchen -> Bathroom | (151,589) | HTTP 200 | 122 | Yes | 0 |
| Bathroom -> Dining Room | (19,589) | HTTP 200 | 326 | Yes | 0 |

Every step was triggered by an unmodified original-game AVM1 button `GetURL(..., '_level0')`, without calling the research host's manual SWF selector between rooms.

The strict smoke test in `scripts/browser-original-webkit-chain.mjs` now checks:
- each specific original SWF returned HTTP 200
- each stage recovers a non-flat image
- the original `ruffle-player` DOM element remains attached throughout
- the host URL is always `/port.html`, with zero top-level navigation events after setup
- Ruffle remains playing and reports no page script exceptions

The WebKit workflow passed all these additional requirements.

## Remaining limitations

The source's native navigation was confirmed in **Linux WebKit**, not actual iPhone Safari on Apple hardware. Three successful room visits do **not** establish complete puzzle solving, every jump-scare event, sound output, background lifecycle stability or memory limits.

No original copyrighted SWF bytes have been committed or published. Distribution permission must be clarified before public hosting.
