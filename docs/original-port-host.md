# Original SWF port host (actual preservation path)

Open `/port.html`. This entrypoint is **not** the fictional two-room demo; it uses Ruffle to execute a lawfully obtained **original SWF** if provided.

## Ruffle installation

Ruffle recommends hosting the official self-hosted distribution on your web server. Download a release from https://ruffle.rs/downloads/ and place the complete self-hosted contents (including `ruffle.js`, WASM and associated files) in `public/ruffle/`. Keep its license notices and use an unmodified distribution. This directory is excluded from the public repository until licensing and packaging are reviewed.

## Two loading modes

1. **Local single SWF** — user selects a file; the browser passes its byte array to Ruffle. Useful for research. It cannot automatically satisfy games that load companion SWFs, images, audio or XML by relative URL.
2. **Staged multi-file collection** — preserve the *original directory tree and filenames* under local `public/original/`. Create a local copy of `public/port-manifest.json` with `enabled:true` and `entry:"/original/Title.swf"` (entry is an example, **not** verified as the actual original filename). This mode passes a URL to Ruffle so relative requests may resolve against the staged collection.

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
