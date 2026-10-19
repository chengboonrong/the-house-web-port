# Browser test workflow

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

These smoke tests exercise original fictional artwork only. GitHub Actions uses desktop Chromium and validates the animated scene, two-room navigation, checkpoint restore, and debugger output.

Not covered: original SWF compatibility, real iPhone Safari, audio fidelity, copyrighted content, or pixel-perfect original game parity.
