# Animation and trace tooling

The port runner executes deterministic `opacity` actions (linear fades) with a foreground-time clock; switching tabs freezes progress. `goto` changes scenes and resets visible layer defaults. `PlaybackTrace` records bounded event metadata for future side-by-side comparisons.

No event in the fictional demo should be considered original The House behavior.

Remaining work: sprite frame animation, scene-transition preloading, checkpoint serialization, repeatable audio tests and visual regression.

## Fictional two-room navigation fixture

The sample contains `test-room` and `test-hall`, with a `door` and a `return` hotspot. All three SVG graphics are original test assets. Both scenes are preloaded before enabling interactions. The HTML demo includes accessible buttons for navigating when tap targets are difficult to discover. These controls and story beats are not The House behavior.

## Timeline semantics

Actions execute in order. `wait` blocks subsequent actions for its foreground duration. `opacity` linearly interpolates between current and target opacity, blocking until completion. `goto` ends the current action sequence and loads the destination's default layer visibility and opacity. Game counters currently persist across scene transitions, while visible layers reset on entry.
