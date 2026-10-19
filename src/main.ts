import './style.css';
import { consume, createState, hitTest, setPaused, trigger, sceneById } from './port/engine';
import { demoSpec } from './port/demo';
import { fitStage, pointToStage } from './port/coords';
import type { PortState } from './port/types';

// Original-art placeholder: NOT footage, assets or reconstructed behavior from The House.
const root = document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML = `
<div class="shell">
  <header><span>FLASH-TO-WEB • PORT ENGINE LAB</span><span>iPhone Safari target</span></header>
  <section class="scene" data-stage="0" aria-label="Fictional interaction test room">
    <div class="frame" id="frame" role="button" tabindex="0" aria-label="Inspect picture frame"><div class="photo">?</div></div>
    <div class="table"></div><div class="vignette"></div>
  </section>
  <div class="status" id="status" role="status"></div>
  <div class="controls"><button id="start">START DEMO</button><button id="reset">RESET</button></div>
  <p class="legal">Fictional test fixture, not the original game. No The House graphics, sounds, code, or story are included.</p>
</div>`;

const status = document.querySelector<HTMLElement>('#status')!;
const sceneElement = document.querySelector<HTMLElement>('.scene')!;
const frame = document.querySelector<HTMLElement>('#frame')!;
let state: PortState = createState(demoSpec);
let generation = 0;
let resumed: (() => void) | null = null;
let remainingWait = 0;

function render() {
  status.textContent = state.message || (state.paused ? 'Paused while tab is in background.' : 'Tap the picture frame.');
  sceneElement.dataset.stage = String(state.counters.frameClicks ?? 0);
  frame.setAttribute('aria-disabled', String(state.paused || state.pending.length > 0));
}
function waitForeground(ms: number, version: number): Promise<boolean> {
  return new Promise(resolve => {
    const start = performance.now();
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let elapsed = 0;
    const finish = (completed: boolean) => {
      if (timeout !== null) clearTimeout(timeout);
      document.removeEventListener('visibilitychange', visibility);
      resolve(completed && version === generation);
    };
    const tick = () => {
      if (version !== generation) { finish(false); return; }
      if (document.hidden) return;
      remainingWait = 0;
      finish(true);
    };
    const visibility = () => {
      if (document.hidden) {
        if (timeout !== null) clearTimeout(timeout);
        elapsed += Math.max(0, performance.now() - (waitStarted ?? start));
        timeout = null;
      } else {
        waitStarted = performance.now();
        timeout = setTimeout(tick, Math.max(0, ms - elapsed));
      }
    };
    let waitStarted: number | null = start;
    remainingWait = ms;
    timeout = setTimeout(tick, ms);
    document.addEventListener('visibilitychange', visibility);
    resumed = () => finish(false);
  });
}
async function drain() {
  const version = generation;
  while (state.pending.length && version === generation) {
    if (document.hidden) return;
    const result = consume(demoSpec, state);
    state = result.state;
    render();
    if (result.effect?.kind === 'wait') {
      const ok = await waitForeground(result.effect.ms, version);
      if (!ok) return;
    }
  }
}
function inspectAt(clientX: number, clientY: number) {
  if (document.hidden || state.paused) return;
  const scene = sceneById(demoSpec, state.scene);
  const bounds = sceneElement.getBoundingClientRect();
  const fitted = fitStage(scene.width, scene.height, { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height });
  const point = pointToStage(clientX, clientY, scene.width, scene.height, fitted);
  if (!point) return;
  const id = hitTest(scene, point.x, point.y);
  if (!id) return;
  const next = trigger(demoSpec, state, id);
  if (next === state) return;
  state = next;
  void drain();
}
sceneElement.addEventListener('click', event => inspectAt(event.clientX, event.clientY));
frame.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    const bounds = frame.getBoundingClientRect();
    inspectAt(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
  }
});
document.querySelector('#start')!.addEventListener('click', () => {
  generation++; resumed?.(); resumed = null;
  state = createState(demoSpec); state.message = 'Tap the picture frame.'; render();
});
document.querySelector('#reset')!.addEventListener('click', () => {
  generation++; resumed?.(); resumed = null;
  state = createState(demoSpec); render();
});
document.addEventListener('visibilitychange', () => {
  state = setPaused(state, document.hidden);
  render();
  if (!document.hidden && state.pending.length && remainingWait === 0) void drain();
});
render();

