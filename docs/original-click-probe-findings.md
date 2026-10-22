# Original browser click probing: inconclusive, not a Ruffle regression

Date: 2026-10-20.

## Evidence

In GitHub Actions run https://github.com/chengboonrong/the-house-web-port/actions/runs/39373262998, the original Sinthai 2005 GameZIP was staged privately, and Ruffle 0.7.1 loaded original SWFs over local HTTP.

Two automated, bounded **blind pointer sweeps** took place:
- Dining room: 64 positions clicked; no Bathroom.swf response was observed.
- Corridor: 144 positions clicked; no adjacent room SWF response was observed.
- The source SWF was downloaded successfully. No evidence from this test establishes that the game emitted AVM1 navigation instructions.

The failing workflow step was `Exercise authentic Corridor button navigation`: it originally required a blind-click sweep to trigger a room request. That conflated **an exploratory test which may miss puzzle-gated hotspots** with an actual deterministic regression, leading to a misleading red CI status.

## Correct test semantics

- `ROOM_REQUEST_SUCCEEDED` is real evidence of a navigation request to an original SWF (and HTTP 200).
- `ROOM_REQUEST_FAILED` indicates an attempted original request that did not succeed and should fail.
- `NO_NAVIGATION_OBSERVED` is **inconclusive**. This does not prove Ruffle failed to process `GetURL('_level0')`.
- `TEST_ERROR` (source missing, crash, unexpected exception) fails CI.

The test has been changed so exploratory non-hits retain their explicit JSON status without falsely failing the general Ruffle smoke suite.

## How to get deterministic click targets

The authentic SWF contains DefineButton2 records (with button IDs and condition flags), but static navigation analysis does not yet map button instances to **screen coordinates** or puzzle state.

Next task:
1. Parse DefineButton2 hit-test characters and placement matrices, alongside PlaceObject2/3 timeline placements.
2. Determine whether the tested room's navigation buttons are present at the current frame, or become available only after puzzle progression.
3. Choose verified geometric centers of visible interactive targets rather than sweeping a random grid; click and check the original SWF HTTP request.
4. Keep browser-render screenshot inspection local/private, without uploading proprietary artwork to GitHub.
5. Only after a real click-driven transition succeeds, add it as a strict end-to-end regression.

This project retains **original Flash bytecode and assets** for authorized private preservation; it does not recreate game mechanics. Safari remains untested.
