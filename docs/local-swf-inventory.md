# Local original SWF inventory and staged dependency testing

This pipeline is for a legally obtained personal research copy. It does not acquire game files, grant redistribution rights, or infer the real entry SWF name.

## Inspect contents without staging

```bash
node scripts/stage-swf.mjs --source "/path/to/original-copy" --entry "relative/path/to/entry.swf"
```

Outputs an inventory JSON with relative filenames, byte sizes, and SHA-256 checksums. It rejects symlinks and paths escaping the source tree. No files are copied without `--stage`.

## Stage locally (not for deployment)

```bash
node scripts/stage-swf.mjs --source "/path/to/original-copy" --entry "relative/path/to/entry.swf" --stage
npm run check:staged
npm run dev
```

Visit `http://localhost:5173/port.html` and click **Load staged manifest**. The original file tree is copied as-is to `public/original/`, ignored by git. The host uses Ruffle URL-mode so relative resources can be requested from their original sibling paths.

**Important:** Because Vite normally copies files from `public/` into production output, `vite.config.js` now aborts all production builds while `public/original/` exists. This prevents accidental inclusion in `dist/` via ordinary builds. Do not make this local dev server publicly accessible or expose the directory to the internet. No staging cleanup is automatic; delete `public/original/` manually after research.

The staging script writes its active manifest to `public/original/port-manifest.json`; the public template `public/port-manifest.json` remains disabled. `npm run check:staged` verifies every staged file against its source inventory's SHA-256 hashes. The development server binds to `127.0.0.1` by default; do not use `npm run dev:lan` with copyrighted research assets present. For controlled physical-device research later, use an explicit network-access plan and permissions.

The host only confirms that Ruffle accepted the entrypoint. It cannot certify that all dynamically loaded assets were found, all ActionScript features worked, or that iPhone Safari is compatible.

No original content belongs in a public PR unless redistribution rights are established.
