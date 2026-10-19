# REA investigation handoff for The House (2005)

Source: https://github.com/morluto/rea (package `rea-agents`; inspected 2026-10-20).

## Scope boundaries

REA supports browser observation, saved HAR/SAZ analysis, JavaScript application analysis, native binary analysis via supported providers, and Android APK analysis with JADX. The current README does **not** advertise an SWF/ActionScript-specific decompiler. Use FFDec for Flash structure and ActionScript, and Ruffle for original program execution.

### Research workflow A — original website and historic game pages

1. Install REA via `npx rea-agents setup` and connect to Codex (review configuration edits; restart agent).
2. Observe the official game page and legally accessible archival HTML wrappers using REA's browser observation workflow.
3. Export permissible request information (URLs, initiators, response types, timings and failures). Save HAR privately; it can include sensitive cookies or tokens.
4. Analyze saved HAR with REA. Compare actual observed requests with the static references reported by our `inspect-flash-references.mjs`.
5. Distinguish observations from conjecture. A URL reference is not a working original SWF nor a grant of redistribution rights.

### Research workflow B — Android port as secondary reference

REA can inspect the MattDev2606 Android port's APK via JADX if a lawful copy is available. Cocos2d-x app native execution is inside `libcocos2dcpp.so` and will require separate native analysis. Treat the Android version as a *comparison port*, not proof of original SWF structure or behavior.

Related: https://github.com/WolffsRoom/TheHouse2Vita

### Research workflow C — original SWF

Once original files are acquired lawfully, use `scripts/inspect-swf-structure.mjs` and FFDec for actual Flash metadata, ActionScript and tag relationships. Use Ruffle to attempt original execution, then REA for observations of the browser wrapper/network layer only.

## Handoff specification

For every discovered resource: `source_url`, `capture_date`, `game_identity`, `observed_request`, `runtime_status`, `sha256_if_available`, `confidence`, `redistribution_rights`. Do not commit SWF/APK binaries, extracted assets, private HAR files or credentials.

## Decision

REA is a useful complementary forensic tool, **not** a dependency of the production Safari player. Keep the runtime lightweight: original SWF + Ruffle; use REA/FFDec during authorized investigation only.
