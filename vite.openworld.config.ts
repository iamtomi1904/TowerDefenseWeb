import {defineConfig} from 'vite';

export default defineConfig({
  publicDir: false,
  build: {
    target: 'es2022',
    outDir: 'public/openworld',
    emptyOutDir: true,
    lib: {
      entry: 'src/openworld/main.ts',
      formats: ['es'],
      fileName: () => 'openworld.js'
    },
    chunkSizeWarningLimit: 2000
  }
});
