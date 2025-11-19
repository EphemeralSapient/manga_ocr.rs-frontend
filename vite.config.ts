import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: './',  // Use relative paths for Chrome extension
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    modulePreload: false,
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Service worker and content scripts need specific paths
          if (chunkInfo.name === 'background' || chunkInfo.name === 'content') {
            return 'scripts/[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // CSS files
          if (assetInfo.name?.endsWith('.css')) {
            return 'styles/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        compact: true,
        generatedCode: {
          constBindings: true,
          arrowFunctions: true,
          objectShorthand: true,
        },
      },
      treeshake: {
        moduleSideEffects: true,
        propertyReadSideEffects: false,
      },
    },
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: 'esbuild',
  },
  esbuild: {
    drop: ['debugger'],
    legalComments: 'none',
    treeShaking: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '.',
        },
        {
          src: 'rules.json',
          dest: '.',
        },
        {
          src: 'icons/*.png',
          dest: 'icons',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@components': resolve(__dirname, 'src/components'),
    },
  },
});
