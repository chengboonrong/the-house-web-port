# Original The House (2005) SWF investigation

**Research date:** 2026-10-20. **Status:** historical evidence collected; no original SWF acquired or examined in this session.

## Verified public evidence

1. Official developer history: The House was created in 2005 by SINTHAI, using Adobe Flash and a point-and-click interaction model. Source: https://thehouse.online/thehouse1_info/
2. Official play site explicitly says desktop/laptop Chrome + Ruffle plugin, not iPhone Safari. Source: https://www.thehouse.online/game/
3. Contemporary review published September 8, 2005 and its walkthrough exist at https://games.jayisgames.com/review/the-house.php
4. Historical 2011 offline-play guide instructs users to open a file named `Title` for The House 1, suggesting an entry SWF named `Title.swf`; this name is **unverified**, and any download found there should not be presumed authorized or safe. Source: https://www.budiutomo.com/2011/12/game-horror-house-sinthai-1-2-link.html
5. Ruffle supports programmatic SWF loading through its self-hosted browser API: https://github.com/ruffle-rs/ruffle/blob/master/web/packages/selfhosted/README.md

## What has NOT been established

- Actual verified SWF URL and checksum
- Exact filenames, dependency graph, SWF version or ActionScript version
- Whether an individual SWF is sufficient to launch the game
- iPhone Safari playback and Ruffle compatibility
- Any right to redistribute the original game or its assets

## Next hands-on procedure

1. Obtain permission from the rights holder or a lawful research copy of the original SWF.
2. Run `shasum -a 256 path/to/file.swf` and `file path/to/file.swf`.
3. Inspect SWF locally in FFDec; note SWF version, stage size, frame rate, library assets, ActionScript and network dependencies.
4. Start the development server and visit `/ruffle-lab.html` on a desktop browser. Use its local file picker to load the SWF. Observe warnings in developer console.
5. Repeat on a physical iPhone Safari using a local SWF accessible from Files. A desktop development server can be opened on the phone over the same LAN using its local IP and port, subject to firewall permissions.
6. Record a screen capture including initial load, five-minute interaction, audio, scene changes, and exit.
7. Classify each compatibility finding as verified, inferred or unknown.

## Security and rights

- Never commit an original SWF or extracted copyright-protected game asset to this repository without appropriate license or permission.
- Do not run historical Flash executables, installers, or standalone players from untrusted mirrors.
- The local test harness itself uploads no SWF bytes, but a SWF may request external resources.
- The GitHub repository's MIT license applies only to original repository code, not the original The House content.

## Decision gate

**Ruffle wrapper first**, if complete behavior works in iPhone Safari and permission allows serving the original SWF and dependencies. **Behavior-equivalent TypeScript port second**, if concrete compatibility failures are documented.
