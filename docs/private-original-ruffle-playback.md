# Run the authentic The House (2005) Flash locally through Ruffle

**Research use only.** This workflow does not commit, publicly host, or redistribute Sinthai's original game bytes. Confirm permission before publishing any playable distribution.

## Identity of our verified archival source

- Flashpoint UUID: `a8b2e1fb-e408-2f0f-b1b8-08537b0e864b`
- Original launch: `http://www.sinthaistudio.com/thehouse1/index.html`
- Original HTML embeds `Title.swf`.
- Confirmed original host game files: `Title.swf`, `Dining room.swf`, `Bathroom.swf`, `Kitchen.swf`, `Living room.swf`, `Corridor.swf`, `Credit.swf`.
- Source evidence: https://github.com/chengboonrong/the-house-web-port/actions/runs/39360466144

## Private local playback preparation

1. Obtain an authorized Flashpoint GameZIP matching the verified game ID **on your own device**, not by committing game files. Its exact filenames and hashes can be cross-checked against `docs/verified-original-flashpoint-gamezip.md`.
2. Run the stager below from the repository root. It selects only `content/www.sinthaistudio.com/thehouse1/` and creates an ignored private tree with **exact bytes and original filenames**.

```bash
python3 scripts/stage-original-gamezip.py "/path/to/your/flashpoint-gamezip.zip"
node scripts/check-staged-assets.mjs
```

3. Place the official Ruffle self-hosted distribution (including WASM, JS and license notices) under ignored `public/ruffle/`; see https://ruffle.rs/downloads/.
4. Run the loopback-only Vite dev server:

```bash
npm install
npm run dev
```

5. Open **http://127.0.0.1:5173/port.html** and choose **Load staged manifest**. The default entry should be `/original/Title.swf`. The research selector can independently load each room's SWF, including names containing spaces.

`Title.swf` is the authentic title movie, not the historic HTML wrapper. The existing SWF host does not reimplement the HTML page's obsolete plugin embeds. The Ruffle file URL's directory becomes its base so relative `GetURL` navigation can target the sibling original files.

## Critical behavior to verify

- Does the title actually show, play audio and respond to touch/mouse?
- Does title navigation reach `Dining room.swf`? The first-game Title's two GetURL buttons did not expose an `.swf` target during the first-pass scan.
- Can Dining Room reach Bathroom and later rooms through original button events?
- Does `Corridor.swf` transition to `Credit.swf`?
- When Ruffle handles AVM1 `GetURL`, does it *navigate the entire browser page* or preserve the player? **Do not assume GetURL transitions remain inside one Ruffle instance.** If full-page navigation occurs, add a local navigation interception/routing layer, or use a more suitable Ruffle API only after confirming actual behavior.
- Touch coordinates, audio policies and Safari memory must be checked on an iPhone eventually.

Use the existing **Export resource observations** button for partial browser request evidence, while noting that Performance entries do not prove successful downloads.

## Safety

Never build a production bundle while `public/original/` exists: `vite.config.js` blocks it. The dev server is localhost-only by default. Do not use the LAN mode or expose the port publicly with original files staged. Do not merge or release copyrighted SWFs without rights.

**Status:** this document describes a working staging code path tested on synthetic ZIPs; the real game has not yet been played successfully in Ruffle/Safari by this project.
