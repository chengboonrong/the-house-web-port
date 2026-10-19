import './style.css';
import { hitTest, sceneById } from './port/engine';
import { demoSpec } from './port/demo';
import { fitStage, pointToStage } from './port/coords';
import { PortRunner } from './port/runner';
import { PortAudio } from './port/audio';

const root = document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML = `
<div class="shell">
<header><span>FLASH-TO-WEB • PORT ENGINE LAB</span><span>Safari-compatible design target</span></header>
<section class="scene" data-stage="0" aria-label="Fictional interaction test room">
  <div class="frame" id="frame" role="button" tabindex="0" aria-label="Inspect picture frame"><div class="photo">?</div></div>
  <div class="table"></div><div class="vignette"></div>
</section>
<div class="status" id="status" role="status"></div>
<div class="controls">
  <button id="start">START DEMO</button><button id="reset">RESET</button>
  <button id="mute" aria-pressed="false">MUTE</button>
</div>
<p class="legal">Fictional test fixture, not original The House behavior. Original copyrighted graphics, sounds, code and story are NOT included.</p>
</div>`;
const status = document.querySelector<HTMLElement>('#status')!;
const sceneElement = document.querySelector<HTMLElement>('.scene')!;
const frame = document.querySelector<HTMLElement>('#frame')!;
const muteButton = document.querySelector<HTMLButtonElement>('#mute')!;
const audio = new PortAudio();
const runner = new PortRunner(demoSpec, {
  onChange: state => {
    status.textContent = state.paused ? 'Paused while in background.' : state.message || 'Tap the picture frame.';
    sceneElement.dataset.stage = String(state.counters.frameClicks ?? 0);
    frame.setAttribute('aria-disabled', String(state.paused || state.pending.length > 0));
  },
  onSound: id => { audio.play(id); }
});
runner.start(performance.now());
function inspectAt(x: number, y: number) {
  const current = sceneById(demoSpec, runner.state.scene);
  const bounds = sceneElement.getBoundingClientRect();
  const fitted = fitStage(current.width, current.height, {
    left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height
  });
  const point = pointToStage(x, y, current.width, current.height, fitted);
  if (!point) return;
  const hotspot = hitTest(current, point.x, point.y);
  if (hotspot) runner.click(hotspot);
}
sceneElement.addEventListener('click', e => inspectAt(e.clientX, e.clientY));
frame.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const b = frame.getBoundingClientRect();
    inspectAt(b.left + b.width / 2, b.top + b.height / 2);
  }
});
document.querySelector('#start')!.addEventListener('click', () => {
  void audio.unlock().catch(() => { /* audio optional for this soundless demo */ });
  runner.start(performance.now());
});
document.querySelector('#reset')!.addEventListener('click', () => runner.reset(performance.now()));
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
