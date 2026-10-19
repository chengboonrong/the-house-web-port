import './style.css';
import { advance, begin, initialState, type GameState, type Step } from './engine';

const steps: Step[] = [
  { target: 'frame', visual: 'A faint mark appears on the wall.', narration: 'Something has changed.' },
  { target: 'frame', visual: 'The frame appears to tilt.', narration: 'Did you see that?' },
  { target: 'frame', visual: 'The room falls silent.', narration: 'End of prototype.' }
];
let state: GameState = initialState;
const root = document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML = `
<div class="shell">
<header><span>FLASH-TO-WEB • RESEARCH PROTOTYPE</span><span>iPhone Safari target</span></header>
<section class="scene" data-stage="0" aria-label="Original placeholder scene">
<div class="frame" id="frame" role="button" tabindex="0" aria-label="Inspect picture frame"><div class="photo">?</div></div>
<div class="table"></div><div class="vignette"></div>
</section>
<div class="status" id="status" role="status"></div>
<div class="controls"><button id="start">START DEMO</button><button id="reset">RESET</button></div>
<p class="legal">Original demonstration art and behavior only. No original The House assets or code included.</p>
</div>`;
const status = document.querySelector<HTMLElement>('#status')!;
const scene = document.querySelector<HTMLElement>('.scene')!;
const frame = document.querySelector<HTMLElement>('#frame')!;
function render(message?: string) {
  status.textContent = message ?? (state.status === 'ready'
    ? 'Press START DEMO, then tap the picture frame three times.'
    : state.status === 'complete'
      ? 'Demo complete. Original game analysis remains pending.'
      : state.index === 0 ? 'Tap the picture frame.' : steps[state.index - 1].narration);
  scene.dataset.stage = String(state.index);
  frame.setAttribute('aria-disabled', String(state.status !== 'playing'));
}
function inspect() {
  const previous = state;
  state = advance(state, 'frame', steps);
  if (state !== previous) render(steps[previous.index].visual);
}
frame.addEventListener('click', inspect);
frame.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inspect(); }
});
document.querySelector('#start')!.addEventListener('click', () => { state = begin(); render(); });
document.querySelector('#reset')!.addEventListener('click', () => { state = initialState; render(); });
render();
