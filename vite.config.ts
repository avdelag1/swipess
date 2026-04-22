import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // 🚀 Drop console & debugger in production for clean Lighthouse scores
  ...(mode === 'production' ? {
    esbuild: {
      drop: ['console', 'debugger'],
    },
  } : {}),
  plugins: [
    react(),
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
        const preloads: string[] = [];
        for (const [_key, chunk] of Object.entries(ctx.bundle)) {
          if ((chunk as any).type === 'chunk' && (chunk as any).isEntry) {
            preloads.push(`<link rel="modulepreload" href="/${(chunk as any).fileName}" fetchpriority="high" crossorigin>`);
          }
        }
        return html.replace('</head>', `${preloads.slice(0, 1).join('')}</head>`);
      }
    }
  ],
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime',
      'scheduler', 'react-router-dom', '@tanstack/react-query', 'zustand', 'zustand/react',
      '@supabase/supabase-js', 'lucide-react',
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom', 'scheduler', 'react-router-dom', '@tanstack/react-query', 'zustand', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // CRITICAL: Match core React FIRST to prevent splitting across chunks
            // The bare 'react' package must be in the same chunk as react-dom & scheduler
            if (
              id.includes('/react-dom/') || 
              id.includes('/react/') || 
              id.includes('/scheduler/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react/') ||
              id.includes('node_modules/scheduler/')
            ) return 'vendor-react';
            if (id.includes('react-router')) return 'vendor-router';

            // ISOLATED HEAVY LIBRARIES — maximize cache persistence
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('lucide-react') || id.includes('react-icons')) return 'vendor-icons';
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) return 'vendor-forms';
            if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
            if (id.includes('recharts') || id.includes('victory')) return 'vendor-viz';
            if (id.includes('lottie')) return 'vendor-lottie';
            if (id.includes('embla-carousel')) return 'vendor-carousel';
            if (id.includes('browser-image-compression')) return 'vendor-img';
            
            if (id.includes('@tanstack')) return 'vendor-query';
            if (id.includes('zustand')) return 'vendor-state';
            if (id.includes('date-fns')) return 'vendor-dates';
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) return 'vendor-css-utils';
            
            // Everything else
            return 'vendor-misc';
          }
        }
      }
    }
  }
}));
