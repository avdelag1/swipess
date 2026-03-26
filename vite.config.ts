import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    {
      name: 'async-css-plugin',
      transformIndexHtml(html) {
        return html.replace(
          /<link rel="stylesheet" href="\/assets\/index-([a-z0-9]+)\.css">/gi,
          '<link rel="preload" href="/assets/index-$1.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="/assets/index-$1.css"></noscript>'
        );
      }
    },
    {
      name: 'preload-critical-chunks',
      transformIndexHtml(html, ctx) {
        if (!ctx.bundle) return html;

        const criticalChunks = ['react-core', 'backend-vendor', 'ui-vendor', 'logic-vendor'];
        const preloadLinks: string[] = [];

        for (const [fileName, chunk] of Object.entries(ctx.bundle)) {
          if (chunk.type === 'chunk' && criticalChunks.some(name => chunk.name && chunk.name.includes(name))) {
            preloadLinks.push(`<link rel="modulepreload" href="/${fileName}" crossorigin>`);
          }
        }

        if (preloadLinks.length === 0) return html;
        return html.replace('</head>', `${preloadLinks.join('\n')}\n</head>`);
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 2000,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'react-core';
          }
          if (id.includes('node_modules/react-router')) {
            return 'react-core';
          }
          if (id.includes('node_modules/@supabase') || id.includes('node_modules/@tanstack/react-query') || id.includes('node_modules/i18next')) {
            return 'backend-vendor';
          }
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/@radix-ui/') || id.includes('node_modules/lucide-react') || id.includes('node_modules/sonner') || id.includes('node_modules/vaul')) {
            return 'ui-vendor';
          }
          if (id.includes('node_modules/zod') || id.includes('node_modules/date-fns') || id.includes('node_modules/react-hook-form') || id.includes('node_modules/clsx')) {
            return 'logic-vendor';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      },
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      }
    }
  }
}));
