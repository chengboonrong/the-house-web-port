# Cinematic effects API

The port engine now supports **nonblocking** scene effects in its declarative event actions:

```ts
{ kind: 'flash', color: '#ffffff', opacity: 0.65, ms: 350 }
{ kind: 'shake', strength: 7, ms: 600 }
```

- `flash` renders a fading solid-color overlay above the scene.
- `shake` offsets the displayed scene with a decaying deterministic oscillation.
- Effects may overlap other event actions; they do not block click logic or subsequent timeline actions.
- Active visual effects are paused when the document is hidden and discarded by Restart, Reset, Resume, or scene navigation.
- Inputs are bounded by validation (duration 0–60000 ms, opacity 0–1, shake strength 0–24 stage-independent CSS pixels, six-digit hex color).
- The sample uses fictional events and artwork **only**; these are not authentic The House jump scares.
- Respect accessibility preferences before deploying intense flicker/flash effects. Add a reduced-motion toggle when preparing a public release.

## Architectural boundary

`PortRunner` emits declarative visual effects; `CinematicEffects` owns browser presentation. The effects controller can later be replaced or upgraded without changing the scene data or event sequencer.

Known gaps: per-layer shake, compositing modes, complex tween curves, and evidence-backed original Flash event timing.
