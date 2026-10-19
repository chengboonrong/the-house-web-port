# First-game SWF archive source checks (2026-10-20)

A public WAFlash archive has posts covering five rooms and a Credits attachment for **The House 1 (2005)**. The attachment anchor for Dining Room resolves to a signed HTTPS URL under `blog.kakaocdn.net` with a pathname ending in `Diningroom.swf` and `expires` parameter.

Source: https://vidkidz.tistory.com/541

## Network evidence and limits

- The archive post and its clickable signed SWF attachment URL were located through web-page retrieval.
- Attempting to open the SWF through the web retrieval channel returned a cache miss.
- A separate container HTTP request **failed at DNS resolution** of `blog.kakaocdn.net`. It did not receive an HTTP response, so do not label this HTTP 403/404 or an expired signature.
- **No SWF bytes were obtained**, no SHA-256 was computed, and no executable completeness/compatibility claim is made.

## Batch source check on a machine with ordinary network access

To scan public pages for current signed SWF URLs, printing **redacted metadata only**:

```bash
npm run research:source-check
```

To check only the first room:

```bash
npm run research:source-check -- --only=Diningroom.swf
```

For an authorized, opt-in personal research download to git-ignored `research-private/`:

```bash
npm run research:source-check -- --download
```

The command reports the status for each documented candidate, rather than treating one failure as a complete archive failure. The download option never bypasses signatures, permissions, rate limits or authentication.

After lawful acquisition:

```bash
node scripts/inspect-swf-structure.mjs research-private/Diningroom.swf
node scripts/inspect-flash-references.mjs research-private/Diningroom.swf
```

The filenames and pages are sourced from the public archive, but game-original authenticity, exact loader dependency graph, runtime execution and redistribution rights remain unknown. Avoid publishing binary copies without rights clearance.
