# TesterArmy e2e evaluation

Source: https://github.com/tester-army/e2e (Apache-2.0).
Initial experiment based on the upstream Vite example: https://github.com/tester-army/e2e/tree/main/examples/with-vite

## Purpose
Evaluate a second testing framework without deleting or replacing the already passing Playwright tests.

## Architecture
- Existing Playwright tests: repeatable deterministic CI baseline.
- TesterArmy `e2e`: separate deterministic browser tests of interaction, navigation, and checkpoint persistence.
- Future optional agent tests: plain-language exploratory QA, **not enabled**, requiring a separately configured model/provider, spending limits and secret management.
- WebKit engine is *not equivalent* to a physical iPhone Safari test.

## Run
```bash
npm install
npm run test:army
```

No AI key is required for tests that only use locators and assertions.

## Evaluation gates
- [ ] Confirm framework package installation and runtime on CI
- [ ] Compare flakiness and duration with Playwright
- [ ] Add useful failure diagnostics without collecting private data
- [ ] Do not promote this experiment to required CI until stable
- [ ] Keep manual iPhone Safari verification deferred as requested

`e2e` is pre-1.0 software; configuration may change.
