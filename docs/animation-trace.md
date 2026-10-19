# Animation and trace tooling

The port runner executes deterministic `opacity` actions (linear fades) with a foreground-time clock; switching tabs freezes progress. `goto` changes scenes and resets visible layer defaults. `PlaybackTrace` records bounded event metadata for future side-by-side comparisons.

No event in the fictional demo should be considered original The House behavior.

Remaining work: sprite frame animation, scene-transition preloading, checkpoint serialization, repeatable audio tests and visual regression.
