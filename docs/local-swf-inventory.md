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
npm run dev
```

Visit `http://localhost:5173/port.html` and click **Load staged manifest**. The original file tree is copied as-is to `public/original/`, ignored by git. The host uses Ruffle URL-mode so relative resources can be requested from their original sibling paths.

**Important:** Because Vite normally copies files from `public/` into production output, `vite.config.js` now aborts all production builds while `public/original/` exists. This prevents accidental inclusion in `dist/` via ordinary builds. Do not make this local dev server publicly accessible or expose the directory to the internet. No staging cleanup is automatic; delete `public/original/` manually after research.

The host only confirms that Ruffle accepted the entrypoint. It cannot certify that all dynamically loaded assets were found, all ActionScript features worked, or that iPhone Safari is compatible.

No original content belongs in a public PR unless redistribution rights are established.
