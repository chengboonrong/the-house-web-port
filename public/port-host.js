// Native port host for an original SWF. Does not implement game scenes or mechanics.
const stage = document.querySelector('#stage');
const status = document.querySelector('#status');
const input = document.querySelector('#file');
let current = null;
const note = message => { status.textContent = message; };
// Ruffle 0.7.1 fires an AVM1 on(rollOver) only for a pointermove made while
// no button is down. A touch tap starts with pointerdown, so Ruffle treats the
// hover as a drag and the rollOver never runs (the Dining Room needs one).
// Hover at the touch point first, as a mouse would, then let the tap through.
stage.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse' || !event.isTrusted) return;
  event.composedPath()[0].dispatchEvent(new PointerEvent('pointermove', {
    bubbles: true, composed: true, clientX: event.clientX, clientY: event.clientY,
    pointerId: event.pointerId, pointerType: event.pointerType, isPrimary: event.isPrimary}));
}, true);
async function requireRuffle() {
  if (!window.RufflePlayer?.newest) {
    note('Ruffle runtime is missing. Install the official self-hosted distribution under public/ruffle/ (see docs/original-port-host.md).');
    return null;
  }
  return window.RufflePlayer.newest();
}
function synchronizeNativeStage(player) {
  // Continue watching the original SWF level: GetURL('Room.swf', '_level0')
  // replaces the movie INSIDE this same player element, with potentially
  // different native width/height. Stop automatically after unloading.
  const sync = () => {
    if (current !== player || !player.isConnected) return;
    try {
      const movie = player.ruffle?.()?.metadata;
      if (movie?.width > 0 && movie?.height > 0) {
        const ratio = String(movie.width) + ' / ' + String(movie.height);
        if (stage.style.aspectRatio !== ratio) stage.style.aspectRatio = ratio;
      }
    } catch { /* Ruffle may be between two movies during a level-0 load. */ }
    setTimeout(sync, 400);
  };
  sync();
}
function clear() {
  if (current?.remove) current.remove();
  current = null;
  stage.replaceChildren();
  stage.style.aspectRatio = '';
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
    synchronizeNativeStage(player);
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
    synchronizeNativeStage(player);
    note('Single SWF supplied to Ruffle; external relative dependencies are NOT mapped. This does not establish a complete port.');
  } catch (error) {
    note('Local SWF load failed: ' + String(error));
  }
});
const stagedSelect = document.querySelector('#staged-entry');
let verifiedLocalEntries = [];
let defaultEntry = null;
function validOriginalPath(path) {
  return typeof path === 'string' &&
    /^\/original\/[a-zA-Z0-9_./ -]+\.swf$/i.test(path) &&
    !path.split('/').includes('..') && !path.split('/').includes('.');
}
async function loadInventory() {
  const [manifestResponse, inventoryResponse] = await Promise.all([
    fetch('/original/port-manifest.json', {cache:'no-store'}),
    fetch('/original/inventory.json', {cache:'no-store'})
  ]);
  if (!manifestResponse.ok || !inventoryResponse.ok) throw new Error('Local manifest/inventory is missing');
  const [manifest, inventory] = await Promise.all([manifestResponse.json(),inventoryResponse.json()]);
  if (manifest.enabled !== true || manifest.format !== 'swf-local-manifest-v1' ||
      inventory.format !== 'swf-local-ledger-v1' || !Array.isArray(inventory.files) ||
      !validOriginalPath(manifest.entry)) throw new Error('Invalid local research manifest');
  const entries = inventory.files.filter(file => file && typeof file.path === 'string' &&
    validOriginalPath('/original/' + file.path)).map(file => '/original/' + file.path);
  if (!entries.includes(manifest.entry)) throw new Error('Entrypoint not listed in staged inventory');
  verifiedLocalEntries = entries;
  defaultEntry = manifest.entry;
  stagedSelect.replaceChildren();
  for (const entry of entries) {
    const option = document.createElement('option');
    option.value = entry;
    option.textContent = entry.split('/').pop();
    stagedSelect.appendChild(option);
  }
  stagedSelect.value = defaultEntry;
  return manifest.entry;
}
async function loadStagedEntry(entry) {
  if (!verifiedLocalEntries.includes(entry)) throw new Error('SWF is not listed in local staged inventory');
  const base = entry.slice(0, entry.lastIndexOf('/') + 1);
  // Title.swf and Dining room.swf set Stage.scaleMode = "noScale". Sinthai's
  // rooms.html embedded the 600x600 rooms at native size, where that was
  // invisible; in a smaller phone player it crops the room and its buttons.
  // forceScale keeps Ruffle's default showAll without touching the SWF.
  await mount({url:entry, base, allowScriptAccess:false, forceScale:true});
}
document.querySelector('#staged').addEventListener('click', async () => {
  try {
    const entry = await loadInventory();
    await loadStagedEntry(entry);
  } catch(error) {note('Local staged load failed: ' + String(error));}
});
document.querySelector('#load-entry').addEventListener('click', async () => {
  try {
    if (!verifiedLocalEntries.length) await loadInventory();
    await loadStagedEntry(stagedSelect.value);
  } catch(error) {note('Selected SWF load failed: '+String(error));}
});
document.querySelector('#reset').addEventListener('click', () => { clear(); note('Unloaded.'); });
document.querySelector('#diagnostics').addEventListener('click', () => {
  const items = performance.getEntriesByType('resource')
    .filter(entry => {
      try { return new URL(entry.name).origin === location.origin && new URL(entry.name).pathname.startsWith('/original/'); }
      catch { return false; }
    })
    .slice(-200).map(entry => ({
      path: new URL(entry.name).pathname,
      startTimeMs: Math.round(entry.startTime),
      durationMs: Math.round(entry.duration),
      transferSize: entry.transferSize ?? null,
      decodedBodySize: entry.decodedBodySize ?? null
    }));
  const payload = { format: 'swf-resource-observations-v1', note: 'Performance entries do not establish request success or complete game dependencies.', resources: items };
  const blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'swf-resource-observations.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
const script = document.createElement('script');
script.src = '/ruffle/ruffle.js';
script.onload = () => note('Ruffle ready. Select local SWF or staged manifest.');
script.onerror = () => note('Ruffle distribution not staged. See docs/original-port-host.md');
document.head.appendChild(script);
