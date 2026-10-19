import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

/** Deterministic tests require no AI subscription or API key. */
export default {
  targets: [{
    engine: web(),
    app: {
      url: 'http://127.0.0.1:5173',
      command: { executable: 'npm', args: ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173'], reuseExisting: true },
    },
  }],
} satisfies E2EConfig;
