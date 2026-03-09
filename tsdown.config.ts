import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  format: 'esm',
  target: 'node18',
  clean: true,
  minify: true,
  outputOptions: {
    postBanner: '#!/usr/bin/env node',
  },
});
