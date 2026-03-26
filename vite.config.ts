import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
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
  ].filter(Boolean),
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
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096,
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'react-core';
          }
          if (id.includes('node_modules/@supabase') || id.includes('node_modules/@tanstack/react-query') || id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'backend-vendor';
          }
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/@radix-ui/') || id.includes('node_modules/lucide-react') || id.includes('node_modules/react-icons') || id.includes('node_modules/sonner') || id.includes('node_modules/cmdk') || id.includes('node_modules/vaul')) {
            return 'ui-vendor';
          }
          if (id.includes('node_modules/zod') || id.includes('node_modules/date-fns') || id.includes('node_modules/react-hook-form') || id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) {
            return 'logic-vendor';
          }
          if (id.includes('data/worldLocations') || id.includes('data/mexicanLocations')) {
            return 'data-locations';
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/victory-vendor') || id.includes('node_modules/d3-')) {
            return 'charts-vendor';
          }
          if (id.includes('node_modules/lottie-react') || id.includes('node_modules/lottie-web')) {
            return 'lottie-vendor';
          }
          if (id.includes('node_modules/@octokit')) {
            return 'git-vendor';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      },
      treeshake: {
        preset: 'recommended',
      },
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react',
      'clsx',
      'tailwind-merge'
    ],
    exclude: ['@capacitor/core', '@capacitor/ios', '@capacitor/android']
  }
}));
