# Existing GitHub projects — reuse analysis (2026-10-20)

## Has anyone already ported The House (2005) by Sinthai?

**No independently verified public source port found in this search.** This is a search result, not a proof that none exists. Searches were scoped to combinations of Sinthai, The House, 2005, Ruffle, SWF, HTML5, and port. A similarly named repository `arturkot/the-house-game` is a separate HTML/CSS/JS adventure game; it is **not** a port of Sinthai's 2005 horror game.

## Reuse shortlist

| Project | Repo | Reuses original SWF? | Suitability |
|---|---|---|---|
| Ruffle | https://github.com/ruffle-rs/ruffle | Yes, browser Wasm emulator | **Primary path.** Existing selfhosted browser API obviates custom Flash engine. |
| Flash Arcade | https://github.com/anmol-pawa/flash-arcade | Yes, Internet Archive SWF with Ruffle | Good implementation reference for game catalog/host and asset loading; not evidence that The House is present or Safari works. |
| SWF-to-HTML5 Toolkit | https://github.com/sv1sjp/flash-swf-to-html5-toolkit | No; FFDec decompilation and rewrite | **Fallback only** if original SWF cannot be run faithfully. Emphasizes AS2-era files; uses GPL-3.0 code. |
| Guepard | https://github.com/superman2211/guepard | Converts SWF/FLA and AS3 to JavaScript | Candidate fallback for AS3; legacy Adobe AIR dependency, no validated compatibility for The House. |
| Lightspark | https://github.com/lightspark/lightspark | Yes, local/native Flash emulator | Desktop comparison, **not a native iPhone Safari solution**. |
| CheerpX for Flash | https://github.com/leaningtech/cheerpx-flash | Yes, browser virtualization of licensed Adobe player | Commercial licensing/HARMAN and enterprise contact required; not a freely reusable open-source runtime. |

## Decision

1. **Do not build a custom Flash engine.** Continue using the official Ruffle selfhosted runtime in PR #8.
2. Use `flash-arcade` as an architectural comparison, not a game asset source or proof of rights.
3. Keep FFDec / `flash-swf-to-html5-toolkit` in reserve until ActionScript version and incompatibilities are confirmed. Avoid importing GPL code into MIT-licensed application without deliberate licensing review.
4. Avoid confusing name-only matches with Sinthai's specific game. The `arturkot/the-house-game` repository is unrelated.
5. **Blocking input is still legitimate original SWF + dependencies**. No original SWF has been obtained, analyzed, or deployed in this project. Mobile compatibility remains unknown.

## Reference links
- Ruffle self-hosted documentation: https://github.com/ruffle-rs/ruffle/blob/master/web/packages/selfhosted/README.md
- Ruffle current project status: https://github.com/ruffle-rs/ruffle
- Browser-based SWF archive example: https://github.com/anmol-pawa/flash-arcade
- FFDec-based source migration approach: https://github.com/sv1sjp/flash-swf-to-html5-toolkit
- AS3 conversion candidate: https://github.com/superman2211/guepard
- Native Flash comparator: https://github.com/lightspark/lightspark
- Commercial browser runtime: https://github.com/leaningtech/cheerpx-flash

Research is not a runtime compatibility certification. Original game rights and source provenance must still be evaluated.
