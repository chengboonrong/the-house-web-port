import './style.css';
import { hitTest, sceneById } from './port/engine';
import { demoSpec } from './port/demo';
import { fitStage, pointToStage } from './port/coords';
import { PortRunner } from './port/runner';
import { PortAudio } from './port/audio';
import { AssetLoader, decodeImage, sceneAssetUrls } from './port/assets';
import { SceneRenderer } from './port/renderer';

const root = document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML = `
<div class="shell">
  <header><span>FLASH-TO-WEB • PORT ENGINE LAB</span><span>Safari-compatible design target</span></header>
  <section class="port-viewport" aria-label="Fictional scene viewport">
    <div class="port-stage" id="stage" role="button" tabindex="0" aria-label="Explore the test room"></div>
  </section>
  <div class="status" id="status" role="status"></div>
  <div class="controls">
    <button id="start">START DEMO</button><button id="inspect">INSPECT FRAME</button>
    <button id="reset">RESET</button><button id="mute" aria-pressed="false">MUTE</button>
  </div>
  <p class="legal">Original fictional test art and events. This is not The House's original SWF or a gameplay-faithful port.</p>
</div>`;

const stage = document.querySelector<HTMLElement>('#stage')!;
const viewport = document.querySelector<HTMLElement>('.port-viewport')!;
const status = document.querySelector<HTMLElement>('#status')!;
const muteButton = document.querySelector<HTMLButtonElement>('#mute')!;
const renderer = new SceneRenderer(stage);
const assets = new AssetLoader(decodeImage);
const audio = new PortAudio();
let ready = false;
let currentScene = '';
const runner = new PortRunner(demoSpec, {
  onChange: state => {
    const scene = sceneById(demoSpec, state.scene);
    renderer.update(scene, state);
    currentScene = scene.id;
    status.textContent = state.paused ? 'Paused in background.' : state.message || (ready ? 'Tap the picture frame.' : 'Loading scene assets...');
  },
  onSound: id => { audio.play(id); }
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
  if (ready) runner.click('frame');
});
document.querySelector('#start')!.addEventListener('click', () => {
  void audio.unlock().catch(() => { /* sound is optional in the placeholder demo */ });
  if (ready) runner.start(performance.now());
});
document.querySelector('#reset')!.addEventListener('click', () => { if (ready) runner.reset(performance.now()); });
muteButton.addEventListener('click', () => {
  audio.setMuted(!audio.isMuted);
  muteButton.textContent = audio.isMuted ? 'UNMUTE' : 'MUTE';
  muteButton.setAttribute('aria-pressed', String(audio.isMuted));
});
document.addEventListener('visibilitychange', () => {
  runner.setVisibility(!document.hidden, performance.now());
  if (document.hidden) void audio.suspend();
  else void audio.resume().catch(() => {});
});

const resize = new ResizeObserver(syncStageSize);
resize.observe(viewport);
syncStageSize();
let animationFrame = 0;
function update(now: number) {
  runner.tick(now);
  animationFrame = requestAnimationFrame(update);
}
animationFrame = requestAnimationFrame(update);
window.addEventListener('pagehide', () => {
  cancelAnimationFrame(animationFrame);
  runner.setVisibility(false, performance.now());
  void audio.suspend();
});
window.addEventListener('pageshow', () => {
  runner.setVisibility(true, performance.now());
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(update);
});

void assets.preload(sceneAssetUrls(sceneById(demoSpec, currentScene))).then(() => {
  ready = true;
  runner.start(performance.now());
}).catch(error => {
  status.textContent = 'Failed to preload scene assets: ' + String(error);
});
