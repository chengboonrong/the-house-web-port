/** Public archive HTML attachment resolver; no downloads or network operations. */
function clean(text) {
  return text.replaceAll('\\/', '/').replaceAll('&amp;', '&').replaceAll('&#38;', '&')
    .replaceAll('&quot;', '"').replaceAll('&#x2F;', '/').replaceAll('&#47;', '/');
}
function expiryOf(url) {
  const expiry = url.searchParams.get('expires');
  if (!expiry || !/^\d{10,13}$/.test(expiry)) return null;
  const ms = Number(expiry) * (expiry.length > 10 ? 1 : 1000);
  return Number.isFinite(ms) && ms > 0 && ms < 8.64e15 ? ms : null;
}
function safeUrl(raw) {
  try {
    const url = new URL(clean(raw));
    if (url.protocol !== 'https:' || url.hostname !== 'blog.kakaocdn.net') return null;
    return url;
  } catch { return null; }
}
/** Resolve links whose attachment filename may be text rather than part of the signed CDN path. */
export function extractKakaoSwfs(html, requestedName) {
  if (typeof html !== 'string' || html.length > 8_000_000) throw new Error('Invalid HTML size');
  const decoded = clean(html);
  const found = new Map();
  const wanted = requestedName?.toLowerCase();

  function consider(raw, hintedName = '') {
    const url = safeUrl(raw);
    if (!url) return;
    let pathName = '';
    try { pathName = decodeURIComponent(url.pathname.split('/').at(-1) ?? ''); }
    catch { return; }
    const filename = /\.swf$/i.test(pathName) ? pathName : hintedName.trim();
    if (!/^[\w .-]+\.swf$/i.test(filename)) return;
    if (wanted && filename.toLowerCase() !== wanted) return;
    if (!found.has(url.href)) found.set(url.href, {url, filename, expiresAt:expiryOf(url)});
  }

  // The original filename may appear as an anchor's label or download attribute.
  const anchors = decoded.matchAll(/<a\b[^>]*>[\s\S]*?<\/a\s*>/gi);
  for (const match of anchors) {
    const anchor = match[0];
    const href = anchor.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (!href) continue;
    const download = anchor.match(/\bdownload\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const visible = anchor.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    const hinted = clean(download?.[1] ?? download?.[2] ?? '') ||
      visible.match(/([\w .-]+\.swf)/i)?.[1] || '';
    consider(href[1] ?? href[2], hinted);
  }

  // Also catch script/HTML URLs that themselves end with .swf.
  const urls = decoded.matchAll(/https?:\/\/[^\s"'<>\x00-\x1f`]+/gi);
  for (const match of urls) {
    const raw = match[0].replace(/[),;]+$/, '');
    if (/\.swf(?:\?|$)/i.test(raw)) consider(raw);
    if (found.size >= 100) break;
  }
  return [...found.values()].slice(0,100);
}
export function redactedAttachment(candidate, now = Date.now()) {
  return {
    filename: candidate.filename,
    host: candidate.url.hostname,
    pathname: candidate.url.pathname,
    expiresAt: candidate.expiresAt === null ? null : new Date(candidate.expiresAt).toISOString(),
    expired: candidate.expiresAt !== null && candidate.expiresAt <= now,
    hasTemporarySignature: ['signature','credential','token','key'].some(k => candidate.url.searchParams.has(k)),
  };
}
