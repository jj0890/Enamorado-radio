import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['server/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  minify: false,
  splitting: false,
  sourcemap: true,
  outDir: 'dist',
  external: ['express', 'cors', 'helmet', 'pino'],
});