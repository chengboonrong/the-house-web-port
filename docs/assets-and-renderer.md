# Data-driven scene rendering and asset loading

The scene renderer uses a layer list from `SceneSpec`, paints assets in deterministic list order, and toggles visibility according to `PortState.visibleLayers`. Layers are static images for now. The browser maintains a native aspect ratio and letterboxes through its layout. This is a preparatory runtime, **not a proven Flash renderer**.

`AssetLoader` deduplicates simultaneous and repeat URL requests, surfaces decoding failures, retries failures on subsequent requests, and preloads unique scene assets. For a verified preservation port, the next iteration must support sprite-sheet cropping, animation frames, blending, and synchronized audio/video.

`public/demo-room.svg` and `public/demo-mark.svg` are independently created fictional test illustrations. They are not assets from The House.

## Failure policy

Preloading errors appear in the demo status. No silent fallback pretends that a missing original asset has loaded successfully. The demo may still be navigated for engine exploration.

## Known limitations

- Only full-stage static layers are currently modeled.
- No SWF vector timeline or original ActionScript interpretation.
- No signed-off original scene layout or interaction sequence.
- No device-tested Safari compatibility yet.
