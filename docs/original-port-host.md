# Original SWF port host (actual preservation path)

Open `/port.html`. This entrypoint is **not** the fictional two-room demo; it uses Ruffle to execute a lawfully obtained **original SWF** if provided.

## Ruffle installation

Ruffle recommends hosting the official self-hosted distribution on your web server. Download a release from https://ruffle.rs/downloads/ and place the complete self-hosted contents (including `ruffle.js`, WASM and associated files) in `public/ruffle/`. Keep its license notices and use an unmodified distribution. This directory is excluded from the public repository until licensing and packaging are reviewed.

## Two loading modes

1. **Local single SWF** — user selects a file; the browser passes its byte array to Ruffle. Useful for research. It cannot automatically satisfy games that load companion SWFs, images, audio or XML by relative URL.
2. **Staged multi-file collection** — preserve the *original directory tree and filenames* under local `public/original/`. Use `node scripts/stage-swf.mjs --source /path/to/authorized-copy --entry path/to/confirmed-entry.swf --stage` to generate **`public/original/port-manifest.json` and `inventory.json`**. Do not modify the disabled public template. The host loads the manifest and checks that the entry exists in the inventory before passing `{url, base}` to Ruffle. You may choose any staged SWF from the local inventory selector to inspect independently. This is a research control, not a replacement for original game navigation.

Do not commit, distribute, or deploy original game content until permission is confirmed. Confirm actual filename from original evidence. Do not assume that a third-party archive is authorized.

## Known prerequisites / limitations

- Official site https://www.thehouse.online/game/ advises using a desktop Chrome browser with Ruffle. The mobile port is **not yet verified**.
- No original `.swf` has been inspected or included.
- No ActionScript rewrite, artificial room logic, or game artwork is used in this host.
- Ruffle's browser compatibility, relative dependency paths, networking, audio autoplay, and device memory still require investigation.
- A local SWF may load but fail partway through because required external files are absent.
- This is an engineering host, not a claim of successful game preservation.

## Next artifact

With permission and a verified source copy, create a dependency ledger listing SHA-256, original path, MIME, size, requests made at runtime, and any blocked API calls. Keep original bytes out of public Git until the rights decision is resolved.

## Verified Ruffle load API

Ruffle's documented URL loading options support `{ url: '/original/...swf', base: '/original/...' }`. `base` controls relative paths referenced by the Flash content; it does not rewrite hard-coded absolute third-party URLs. The host keeps `allowScriptAccess:false`. See https://ruffle.rs/js-docs/master/interfaces/Config.URLLoadOptions.html.

The staged room selector is **not** the game's original menu. It enables inspecting each archived SWF separately while we locate the original entrypoint and transitions. Only locally staged paths from the inventory can be selected. No original SWF bytes have been fetched or added to this repository.
