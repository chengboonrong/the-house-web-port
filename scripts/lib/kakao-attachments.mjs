/**
 * Pure HTML extractor for public archive SWF links.
 * No network, downloading or signature logging.
 */
export function extractKakaoSwfs(html, requestedName) {
  if (typeof html !== 'string' || html.length > 8_000_000) throw new Error('Invalid HTML size');
  const clean = text => text.replaceAll('\\/', '/').replaceAll('&amp;', '&')
    .replaceAll('&#38;', '&').replaceAll('&quot;', '"').replaceAll('&#x2F;', '/');
  const decoded = clean(html);
  const candidates = [];
  const seen = new Set();
  // Match signed attachment URLs even when query delimiters are HTML-encoded.
  const regex = /https?:\/\/[^\s"'<>\x00-\x1f`]+/g;
  for (const item of decoded.matchAll(regex)) {
    const raw = item[0].replace(/[),;]+$/, '');
    try {
      const u = new URL(raw);
      if (u.protocol !== 'https:' || u.hostname !== 'blog.kakaocdn.net') continue;
      if (!/\.swf$/i.test(u.pathname)) continue;
      const file = decodeURIComponent(u.pathname.split('/').at(-1) || '');
      if (requestedName && file.toLowerCase() !== requestedName.toLowerCase()) continue;
      if (seen.has(u.href)) continue;
      seen.add(u.href);
      const expiry = u.searchParams.get('expires');
      let expiresAt = null;
      if (expiry && /^\d{10,13}$/.test(expiry)) {
        const ms = Number(expiry) * (expiry.length > 10 ? 1 : 1000);
        if (Number.isFinite(ms) && ms > 0 && ms < 8.64e15) expiresAt = ms;
      }
      candidates.push({url:u,filename:file,expiresAt});
      if (candidates.length >= 100) break;
    } catch { /* malformed URL */ }
  }
  return candidates;
}
export function redactedAttachment(candidate, now = Date.now()) {
  return {
    filename: candidate.filename,
    host: candidate.url.hostname,
    pathname: candidate.url.pathname,
    expiresAt: candidate.expiresAt === null ? null : new Date(candidate.expiresAt).toISOString(),
    expired: candidate.expiresAt !== null && candidate.expiresAt <= now,
    hasTemporarySignature: ['signature','credential','token'].some(k => candidate.url.searchParams.has(k)),
  };
}
