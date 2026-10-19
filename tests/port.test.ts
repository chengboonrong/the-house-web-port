import { describe, expect, test } from 'vitest';
import { createState, hitTest, trigger, consume, setPaused } from '../src/port/engine';
import { fitStage, pointToStage } from '../src/port/coords';
import { PausableClock } from '../src/port/clock';
import { validateSpec } from '../src/port/validate';
import { demoSpec } from '../src/port/demo';

describe('data-driven engine', () => {
  test('valid demo fixture', () => expect(validateSpec(demoSpec)).toEqual([]));
  test('hotspot containment and ordering', () => {
    const scene = demoSpec.scenes[0];
    expect(hitTest(scene, 245, 80)).toBe('frame');
    expect(hitTest(scene, 400, 80)).toBeNull();
  });
  test('click launches ordered actions and locks while pending', () => {
    const initial = createState(demoSpec);
    const triggered = trigger(demoSpec, initial, 'frame');
    expect(triggered.counters.frameClicks).toBe(1);
    expect(trigger(demoSpec, triggered, 'frame')).toBe(triggered);
    let step = consume(demoSpec, triggered);
    expect(step.effect?.kind).toBe('text');
    step = consume(demoSpec, step.state);
    expect(step.state.visibleLayers.mark).toBe(true);
    const second = trigger(demoSpec, step.state, 'frame');
    expect(second.counters.frameClicks).toBe(2);
    expect(consume(demoSpec, second).effect?.kind).toBe('text');
  });
  test('pause ignores interactions and action consumption', () => {
    const paused = setPaused(createState(demoSpec), true);
    expect(trigger(demoSpec, paused, 'frame')).toBe(paused);
    expect(consume(demoSpec, paused).state).toBe(paused);
  });
});
describe('Safari geometry and clocks', () => {
  test('letterbox maps central tap into SWF coordinates', () => {
    const fit = fitStage(640, 480, { left: 0, top: 0, width: 390, height: 700 });
    expect(fit.width).toBe(390);
    expect(fit.height).toBe(292.5);
    expect(pointToStage(195, 350, 640, 480, fit)).toEqual({ x: 320, y: 240 });
    expect(pointToStage(195, 100, 640, 480, fit)).toBeNull();
  });
  test('paused time excludes background duration', () => {
    const clock = new PausableClock();
    clock.start(100); clock.pause(250); clock.start(5000);
    expect(clock.value(5050)).toBe(200);
  });
});
