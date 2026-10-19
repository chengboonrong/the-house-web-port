# Portable scene specification (unverified scaffold)

This schema is an original porting implementation, **not** extracted from The House.

- Coordinates are native stage pixels, with `fitStage` and `pointToStage` performing aspect-fit conversion.
- Rules select the first matching hotspot + counter guard.
- `trigger` locks interaction while its action queue is being executed.
- `consume` applies one action at a time. The host must handle `wait` and `sound` effects; `goto` validates the destination.
- `PausableClock` measures foreground elapsed time, not wall time.
- `validateSpec` detects broken dimensions, layers, rules, wait intervals and destinations.

## Future research integration

Create only evidence-backed scene files once original Flash assets and behavior can be inspected. Track each scene's source, verification status, and timestamps separately. The included `demoSpec` uses **fictional** events to exercise the state engine.

## Remaining implementation tasks

- Connect the new engine to the scene renderer (the existing placeholder app still uses the earlier demo engine).
- Build an asynchronous action runner for wait and audio with cancellation/visibility handling.
- Bind a renderer to verified scene assets and allow declarative animation definitions.
- Add robust browser integration tests and validate iPhone Safari behavior when the user resumes hardware testing.
