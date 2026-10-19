# Live public archive attachment acquisition — research only

The archive at https://vidkidz.tistory.com/541 exposes a `Diningroom.swf` link hosted on a Kakao CDN. Its URL contains temporary `expires` and `signature` values, so copying the URL into the source repository is unreliable. The browser/web retrieval tool did not return its SWF bytes in the current research environment.

To resolve the *current public article* at run time, on a machine with ordinary access:

```bash
node scripts/resolve-kakao-swf.mjs https://vidkidz.tistory.com/541 Diningroom.swf
```

This prints **only redacted metadata**, including filename, host/path and expiry (not signing parameters). It makes one request to the public article.

For an **authorized personal research copy only**, optionally:

```bash
node scripts/resolve-kakao-swf.mjs https://vidkidz.tistory.com/541 Diningroom.swf --download
node scripts/inspect-swf-structure.mjs research-private/Diningroom.swf
```

The opt-in download:
- Only accepts public HTTPS links on the known Kakao attachment host
- Refuses expired links, oversized files, malformed SWF signatures and existing destination files
- Stores a validated private SWF under git-ignored `research-private/`
- Prints SHA-256/byte length without publishing game data
- Does not bypass authentication, signatures or access controls

**Security:** Do not stage or serve this private directory publicly. Original copyright and redistribution permission have not been established. A valid SWF signature does not prove byte-for-byte identity with the 2005 release; further provenance comparison is essential.

**Open questions:** The archive may provide a different markup structure, a signed URL may already be expired, or server protections may block requests. These failures must remain explicit. Nothing in this procedure proves first-game inter-room navigation or iPhone Safari compatibility.
