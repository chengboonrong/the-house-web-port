# Runtime comparison: Ruffle versus WAFlash

Research date: 2026-10-20.

## Most important finding

The Korean archive *hosting The House (2005)* is not merely storing downloads. It publishes original first-game room pages and uses WAFlash, a WebAssembly Flash emulator, to offer mobile-browser playback.

Archive first room: https://vidkidz.tistory.com/541
Archive fifth room and SWF attachment list: https://vidkidz.tistory.com/546
WAFlash author's public repository: https://github.com/vidkidz/waflash

WAFlash README explicitly claims AS2/AS3 support. The archive operator's 2020 preservation announcement says mobile, iPhone and Safari support are intended. **Neither statement is a verified pass of The House 1 on iPhone Safari in our project.**

## Licensing and engineering implications

WAFlash's `vidkidz/waflash` GitHub repository currently contains an informational README, not the complete engine source and an explicit project LICENSE file. Treat it as *not proven to be freely redistributable*; do **not** vendor a WAFlash WASM/JS bundle from a third-party mirror on the assumption that GitHub visibility means open-source licensing.

Ruffle (https://github.com/ruffle-rs/ruffle) supplies a self-hosted open-source runtime and documented SWF URL loading APIs. It remains the production-primary technical candidate.

## Decision matrix

| Goal | Ruffle | WAFlash |
|---|---|---|
| Self-host with auditable permissive/open-source terms | Suitable with proper release notices | Redistribution license not confirmed |
| Use original first-game SWFs | Intended | Archive appears to use it |
| iPhone Safari support | Must verify with target SWFs | Target-specific pass unverified |
| Fix incompatibilities in engine | Upstream issue/patch possible | Source availability unclear |
| Public open-source project integration | Preferred | Research comparator, not bundled |

## Recommended minimal investigation

1. In an iPhone Safari browser, open the **archive's own** Dining Room page and see whether the original content starts and accepts touch interactions. This is external research and does not imply that we can redistribute content.
2. Compare the same SWF with our Ruffle host when a lawful local copy is acquired.
3. Record load, touchscreen hotspots, animations, audio and room progression separately.
4. Only consider WAFlash bundling after confirming engine licensing and the game's redistribution rights.

Do not replace Ruffle with unlicensed or opaque binary code just because a demo appears functional.
