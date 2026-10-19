# Checkpoints, frame sequencing and trace debugger

The versioned checkpoint format serializes only stable scene state: scene ID, counters, visibility, opacity, and status text. Pending actions and animation clock offsets are deliberately excluded. A mid-event checkpoint must be rejected; this avoids silently dropping effects during restore.

`parseCheckpoint` checks the version, payload size, value types, known scene and known layer IDs. Stored JSON is untrusted. Local browser persistence is optional, and failure to access localStorage must not block the game.

`FramePlayer` is a small source-neutral sequential frame sampler with looping and pause/resume. It is **not** SWF vector timeline playback; no original game frames are included.

`PlaybackTrace` already records bounded events. The forthcoming in-page diagnostic panel displays the current scene, counters, effects and trace JSON export without logging sensitive device data.

All demo images, animations and events are fictional test fixtures, not restored The House content.
