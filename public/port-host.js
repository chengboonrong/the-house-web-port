// Native port host for an original SWF. Does not implement game scenes or mechanics.
const stage = document.querySelector('#stage');
const status = document.querySelector('#status');
const input = document.querySelector('#file');
let current = null;
const note = message => { status.textContent = message; };
async function requireRuffle() {
  if (!window.RufflePlayer?.newest) {
    note('Ruffle runtime is missing. Install the official self-hosted distribution under public/ruffle/ (see docs/original-port-host.md).');
    return null;
  }
  return window.RufflePlayer.newest();
}
function clear() {
  if (current?.remove) current.remove();
  current = null;
  stage.replaceChildren();
}
async function mount(source) {
  const ruffle = await requireRuffle();
  if (!ruffle) return;
  clear();
  const player = ruffle.createPlayer();
  current = player;
  stage.appendChild(player);
  try {
    // URL mode preserves relative dependency resolution for same-origin staged collections.
    await player.ruffle().load(source);
    note('SWF entrypoint loaded. Game completeness and iPhone Safari compatibility are unverified. Inspect the original actions, audio, and network requests.');
  } catch (error) {
    note('Ruffle loading failed: ' + String(error));
  }
}
document.querySelector('#local').addEventListener('click', async () => {
  const file = input.files?.[0];
  if (!file || !/\.swf$/i.test(file.name)) { note('Select a local .swf file first.'); return; }
  // Byte-loading handles one SWF only. It does not reconstruct companion-file paths.
  const ruffle = await requireRuffle();
  if (!ruffle) return;
  clear();
  const player = ruffle.createPlayer();
  current = player;
  stage.appendChild(player);
  try {
    await player.ruffle().load({data: await file.arrayBuffer()});
    note('Single SWF supplied to Ruffle; external relative dependencies are NOT mapped. This does not establish a complete port.');
  } catch (error) {
    note('Local SWF load failed: ' + String(error));
  }
});
document.querySelector('#staged').addEventListener('click', async () => {
  try {
    // The staging script writes the *local* manifest beside the original assets.
    // Never consult the deliberately disabled public template.
    const response = await fetch('/original/port-manifest.json', {cache:'no-store'});
    if (!response.ok) throw new Error('manifest HTTP '+response.status);
    const manifest = await response.json();
    if (manifest.enabled !== true || manifest.format !== 'swf-local-manifest-v1' || typeof manifest.entry !== 'string' ||
      !/^\/original\/[a-zA-Z0-9_./-]+\.swf$/i.test(manifest.entry) ||
      manifest.entry.split('/').includes('..')) {
      throw new Error('Authorized SWF entry not configured. Staging is disabled by default.');
    }
    // Do not require HEAD; SWF hosts and static file servers may deny it.
    // Ruffle's URL loader is responsible for fetching dependencies relative to entry.
    await mount(manifest.entry);
  } catch (error) { note('Staged load unavailable: '+String(error)); }
});
document.querySelector('#reset').addEventListener('click', () => { clear(); note('Unloaded.'); });
const script = document.createElement('script');
script.src = '/ruffle/ruffle.js';
script.onload = () => note('Ruffle ready. Select local SWF or staged manifest.');
script.onerror = () => note('Ruffle distribution not staged. See docs/original-port-host.md');
document.head.appendChild(script);
