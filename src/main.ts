import './style.css';
import { hitTest, sceneById } from './port/engine';
import { demoSpec } from './port/demo';
import { fitStage, pointToStage } from './port/coords';
import { PortRunner } from './port/runner';
import { PortAudio } from './port/audio';
import { AssetLoader, decodeImage, portAssetUrls } from './port/assets';
import { SceneRenderer } from './port/renderer';
import { CinematicEffects } from './port/cinematics';
import { PlaybackTrace } from './port/trace';
import { SAVE_KEY, createCheckpoint, parseCheckpoint } from './port/save';

const root = document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML = `
<div class="shell">
  <header><span>FLASH-TO-WEB • PORT ENGINE LAB</span><span>Safari-compatible design target</span></header>
  <section class="port-viewport" aria-label="Fictional scene viewport">
    <div class="port-stage" id="stage" role="button" tabindex="0" aria-label="Explore the test room"></div><div id="flash-overlay" class="flash-overlay" aria-hidden="true"></div>
  </section>
  <div class="status" id="status" role="status"></div>
  <div class="controls">
    <button id="start">START DEMO</button><button id="inspect">INSPECT FRAME</button><button id="navigate">GO TO HALL</button>
    <button id="reset">RESET</button><button id="effects" aria-pressed="false">REDUCE EFFECTS: OFF</button><button id="save">SAVE</button><button id="load">RESUME</button><button id="mute" aria-pressed="false">MUTE</button>
  </div>
  <details class="debug-panel"><summary>Playback Debugger</summary><pre id="debug-status"></pre><button id="export-trace">EXPORT TRACE</button><button id="clear-trace">CLEAR TRACE</button><pre id="debug-trace"></pre></details>
  <p class="legal">Original fictional test art and events. This is not The House's original SWF or a gameplay-faithful port.</p>
</div>`;

const stage = document.querySelector<HTMLElement>('#stage')!;
const viewport = document.querySelector<HTMLElement>('.port-viewport')!;
const status = document.querySelector<HTMLElement>('#status')!;
const muteButton = document.querySelector<HTMLButtonElement>('#mute')!;
const renderer = new SceneRenderer(stage);
const cinematics = new CinematicEffects(stage, document.querySelector<HTMLElement>('#flash-overlay')!);
const effectsButton = document.querySelector<HTMLButtonElement>('#effects')!;
let reducedEffects = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function applyEffectsPreference() {
  cinematics.setReducedMotion(reducedEffects);
  renderer.setReducedMotion(reducedEffects);
  effectsButton.textContent = reducedEffects ? 'REDUCE EFFECTS: ON' : 'REDUCE EFFECTS: OFF';
  effectsButton.setAttribute('aria-pressed', String(reducedEffects));
}
applyEffectsPreference();
effectsButton.addEventListener('click', () => { reducedEffects = !reducedEffects; applyEffectsPreference(); });
const assets = new AssetLoader(decodeImage);
const audio = new PortAudio();
const trace = new PlaybackTrace();
const debugStatus = document.querySelector<HTMLElement>('#debug-status')!;
const debugTrace = document.querySelector<HTMLElement>('#debug-trace')!;
function refreshDebugger() {
  debugStatus.textContent = JSON.stringify({ scene: runner.state.scene, counters: runner.state.counters,
    opacity: runner.state.layerOpacity, busy: runner.busy, paused: runner.state.paused }, null, 2);
  debugTrace.textContent = trace.export();
}
let ready = false;
let currentScene = '';
const runner = new PortRunner(demoSpec, {
  onChange: state => {
    const scene = sceneById(demoSpec, state.scene);
    renderer.update(scene, state);
    if (currentScene !== scene.id) {
      currentScene = scene.id;
      cinematics.reset();
      requestAnimationFrame(syncStageSize);
    }
    status.textContent = state.paused ? 'Paused in background.' : state.message || (ready ? 'Tap the picture frame.' : 'Loading scene assets...');
    refreshDebugger();
  },
  onSound: id => { audio.play(id); },
  onVisual: (action, now) => { cinematics.enqueue(action, now); },
  onEvent: entry => { trace.append(entry); }
});
runner.start(performance.now());

function syncStageSize() {
  const scene = sceneById(demoSpec, runner.state.scene);
  const b = viewport.getBoundingClientRect();
  const fitted = fitStage(scene.width, scene.height, { left: 0, top: 0, width: b.width, height: b.height });
  stage.style.width = fitted.width + 'px';
  stage.style.height = fitted.height + 'px';
  stage.style.left = fitted.left + 'px';
  stage.style.top = fitted.top + 'px';
}

function inspectAt(clientX: number, clientY: number) {
  if (!ready) return;
  const scene = sceneById(demoSpec, runner.state.scene);
  const bounds = stage.getBoundingClientRect();
  const fitted = { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height };
  const point = pointToStage(clientX, clientY, scene.width, scene.height, fitted);
  if (!point) return;
  const hotspot = hitTest(scene, point.x, point.y);
  if (hotspot) runner.click(hotspot);
}

stage.addEventListener('click', e => inspectAt(e.clientX, e.clientY));
stage.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    runner.click('frame');
  }
});
document.querySelector('#inspect')!.addEventListener('click', () => {
  if (ready && runner.state.scene === 'test-room') runner.click('frame');
});
document.querySelector('#navigate')!.addEventListener('click', () => {
  if (ready) runner.click(runner.state.scene === 'test-room' ? 'door' : 'return');
});
document.querySelector('#save')!.addEventListener('click', () => {
  const checkpoint = createCheckpoint(runner.state, runner.busy);
  if (!checkpoint) { status.textContent = 'Finish the current animation before saving.'; return; }
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(checkpoint)); status.textContent = 'Checkpoint saved locally.'; }
  catch { status.textContent = 'Browser storage unavailable.'; }
});
document.querySelector('#load')!.addEventListener('click', () => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const checkpoint = raw ? parseCheckpoint(raw, demoSpec) : null;
    if (!checkpoint) { status.textContent = 'No valid checkpoint found.'; return; }
    cinematics.reset();
    runner.restore(checkpoint, performance.now());
    status.textContent = 'Checkpoint resumed.';
  } catch { status.textContent = 'Browser storage unavailable.'; }
});
document.querySelector('#export-trace')!.addEventListener('click', () => {
  const data = new Blob([trace.export()], { type: 'application/json' });
  const url = URL.createObjectURL(data);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'port-trace.json';
  anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
});
document.querySelector('#clear-trace')!.addEventListener('click', () => { trace.clear(); refreshDebugger(); });
document.querySelector('#start')!.addEventListener('click', () => {
  void audio.unlock().catch(() => { /* sound is optional in the placeholder demo */ });
  if (ready) { trace.clear(); cinematics.reset(); runner.start(performance.now()); }
});
document.querySelector('#reset')!.addEventListener('click', () => { if (ready) { trace.clear(); cinematics.reset(); runner.reset(performance.now()); } });
muteButton.addEventListener('click', () => {
  audio.setMuted(!audio.isMuted);
  muteButton.textContent = audio.isMuted ? 'UNMUTE' : 'MUTE';
  muteButton.setAttribute('aria-pressed', String(audio.isMuted));
});
document.addEventListener('visibilitychange', () => {
  runner.setVisibility(!document.hidden, performance.now());
  renderer.setVisibility(!document.hidden, performance.now());
  cinematics.setVisibility(!document.hidden, performance.now());
  if (document.hidden) void audio.suspend();
  else void audio.resume().catch(() => {});
});

const resize = new ResizeObserver(syncStageSize);
resize.observe(viewport);
syncStageSize();
let animationFrame = 0;
function update(now: number) {
  runner.tick(now);
  renderer.tick(now);
  cinematics.tick(now);
  animationFrame = requestAnimationFrame(update);
}
animationFrame = requestAnimationFrame(update);
window.addEventListener('pagehide', () => {
  cancelAnimationFrame(animationFrame);
  runner.setVisibility(false, performance.now());
  renderer.setVisibility(false, performance.now());
  cinematics.setVisibility(false, performance.now());
  void audio.suspend();
});
window.addEventListener('pageshow', () => {
  runner.setVisibility(true, performance.now());
  renderer.setVisibility(true, performance.now());
  cinematics.setVisibility(true, performance.now());
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(update);
});

void assets.preload(portAssetUrls(demoSpec)).then(() => {
  ready = true;
  runner.start(performance.now());
}).catch(error => {
  status.textContent = 'Failed to preload scene assets: ' + String(error);
});
