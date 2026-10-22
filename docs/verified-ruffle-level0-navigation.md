# Original The House 2005 navigation: GetURL("_level0") is an internal SWF load

Verified 2026-10-20 through original Flashpoint binary analysis and upstream Ruffle implementation.

## Critical finding

The original rooms use AVM1 `GetURL` with **target `_level0`** and relative filename URLs, e.g. `Bathroom.swf`, `Kitchen.swf`, `Dining room.swf`.

Evidence: https://github.com/chengboonrong/the-house-web-port/actions/runs/39370952574

**This is not a browser-window `_self` navigation.** In Ruffle, the AVM1 `action_get_url` implementation checks for targets beginning with `_level` and, for a valid numeric level, calls `get_or_create_level(level_id)` and `load_manager.load_movie_into_clip`. The navigation backend is not used for these calls. Relevant Ruffle source: https://github.com/ruffle-rs/ruffle/blob/master/core/src/avm1/activation.rs

Consequently, prior proposals to intercept all room-navigation links at the browser layer were not justified. **Keep `allowScriptAccess:false`** by default. Ruffle's URL loader should retain the same-origin staged directory as `base` so relative movie loading can find the seven original SWFs.

### Observed target categories

- Room SWF navigation links: `_level0`, relative SWF filenames
- Corridor to credits: `_level0`, relative `Credit.swf`
- Credit's two external URL buttons: `_blank`, absolute URL (actual destinations omitted)
- Title.swf's two non-SWF actions: `_self`, URL classification OTHER; do **not** assume these are gameplay transitions

## Original-file private staging tested on genuine archive

The GameZIP research workflow now invokes `scripts/stage-original-gamezip.py` on the actual Sinthai Flashpoint archive **within an ephemeral runner**. It successfully staged 12 original-site files including `Title.swf`, verified `port-manifest.json` points to `/original/Title.swf`, checked the inventory and file existence, and did not upload SWFs.

Evidence: https://github.com/chengboonrong/the-house-web-port/actions/runs/39371062085

## Not established

We have validated original AVM1 instruction targets and the actual archive-to-staging pathway, but have **not yet rendered the full game in Ruffle** or proven successful frame-to-frame transitions/audio and iPhone Safari behavior. Ruffle's internal loading pathway is supported by its current source, but runtime failure is still possible from security settings, base URL, media or emulator compatibility.

No original game binary or proprietary assets are committed. Public playable release requires appropriate redistribution authorization.
