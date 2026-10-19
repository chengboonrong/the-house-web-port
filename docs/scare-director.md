# Scare Director — authoring milestone

We separated reusable horror choreography from event rules via `scarePreset(name)`, which returns a fresh list of typed timeline actions. Its sequences are **fictional examples**, not original The House timings, effects, or assets.

Presets may combine text, layered image changes, waits, sounds, opacity, screen flash and camera shake. The existing runner executes all actions in order and the cinematic renderer composites nonblocking visual effects.

## Reduced motion and flashing

The runtime exposes **Reduce effects**, on by default when the browser reports `prefers-reduced-motion: reduce`. Users can override it. In reduced mode the scene remains interactive, while flash intensity is disabled and camera shake is suppressed. Animation-layer playback may also be held at a stable frame.

No original copyrighted game content has been incorporated. Original SWF evaluation and physical iPhone Safari verification remain deferred.
