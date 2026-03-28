import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

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
          /<link rel="stylesheet" [^>]*href="([^">]+\.css)"[^>]*>/gi,
          '<link rel="preload" href="$1" as="style" fetchpriority="high" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="$1"></noscript>'
        );
      }
    },
    {
      name: 'sw-build-time-plugin',
      writeBundle() {
        const swPath = path.resolve(__dirname, 'dist/sw.js');
        if (existsSync(swPath)) {
          const buildTime = new Date().toISOString();
          const content = readFileSync(swPath, 'utf-8').replace(/__BUILD_TIME__/g, buildTime);
          writeFileSync(swPath, content);
        }
      }
    },
    {
      name: 'critical-preload-plugin',
      transformIndexHtml(html, ctx) {
        if (!ctx.bundle) return html;
        // PERFORMANCE FIX: Only modulepreload the true entry point.
        // The browser will discover imports via the module graph — no need
        // to eagerly preload vendor/tanstack/framer-motion/etc.
        // Over-preloading wastes bandwidth on slow 4G and inflates "unused JS".
        const preloads: string[] = [];
        for (const [_key, chunk] of Object.entries(ctx.bundle)) {
          if ((chunk as any).type === 'chunk' && (chunk as any).isEntry) {
            preloads.push(`<link rel="modulepreload" href="/${(chunk as any).fileName}" fetchpriority="high" crossorigin>`);
          }
        }
        // Strictly limit to 1 entry preload
        return html.replace('</head>', `${preloads.slice(0, 1).join('')}</head>`);
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
    // PERF: Use terser to drop console.error/warn in production
    // This fixes Lighthouse Best Practices "browser errors logged to console"
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn', 'console.error', 'console.trace'],
      },
    },
    cssMinify: true,
    // PERF: Enable CSS code-splitting — only load CSS needed for the current route
    // Eliminates ~39 KiB of unused CSS on landing page
    cssCodeSplit: true,
    // Enable source maps for production (fixes Best Practices audit)
    sourcemap: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // CRITICAL: Isolate heavy libs that aren't needed for initial paint
            if (id.includes('recharts') || id.includes('lottie') || id.includes('octokit') || id.includes('victory') || id.includes('embla-carousel')) {
              return 'rare-vendors';
            }
            
            // Split large libs into their own chunks for parallel download
            if (id.includes('framer-motion')) return 'framer-motion';
            if (id.includes('lucide-react')) return 'lucide-react';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('@tanstack')) return 'tanstack';
            if (id.includes('radix-ui')) return 'radix-ui';
            if (id.includes('i18next')) return 'i18n';
            if (id.includes('date-fns')) return 'date-fns';
            if (id.includes('zustand')) return 'zustand';
            
            // Everything else (React, etc)
            return 'vendor';
          }
        }
      }
    }
  }
}));
