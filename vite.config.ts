import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: { singleQuote: true, printWidth: 120, sortPackageJson: true },
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      input: { popup: 'index.html', background: 'src/background.ts' },
      output: { entryFileNames: '[name].js' },
    },
  },
  test: {
    environment: 'happy-dom',
    define: { __DEV__: true },
  },
});
