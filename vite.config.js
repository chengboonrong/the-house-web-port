import { defineConfig } from 'vite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [{
    name: 'protect-local-original-swf',
    apply: 'build',
    buildStart() {
      if (existsSync(resolve('public/original'))) {
        throw new Error('Refusing production build: local original SWF research files are staged under public/original. Move them outside public before building.');
      }
    }
  }]
});
