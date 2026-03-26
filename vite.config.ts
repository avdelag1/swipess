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
        // MATCH ALL CSS LINKS: This is the hammer. If it's a stylesheet, make it async.
        // On 4G, blocking on many small CSS files is LCP suicide.
        return html.replace(
          /<link rel="stylesheet" [^>]*href="([^">]+\.css)"[^>]*>/gi,
          '<link rel="preload" href="$1" as="style" fetchpriority="high" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="$1"></noscript>'
        );
      }
    },
    {
      name: 'critical-preload-plugin',
      transformIndexHtml(html, ctx) {
        if (!ctx.bundle) return html;
        const preloads = [];
        for (const [key, chunk] of Object.entries(ctx.bundle)) {
          // Identify the main application entry point and vendor core
          if (chunk.type === 'chunk' && (chunk.name === 'index' || chunk.name === 'vendor' || chunk.name === 'main')) {
            preloads.push(`<link rel="modulepreload" href="/${chunk.fileName}" fetchpriority="high" crossorigin>`);
          }
        }
        return html.replace('</head>', `${preloads.join('')}</head>`);
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
    cssCodeSplit: false, // FORCE ALL CSS INTO ONE FILE TO MINIMIZE REQUEST COUNT ON 4G
    reportCompressedSize: false,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          // MONOLITHIC CHUNKING: To hit 100/100 on 4G, we minimize request counts.
          // Grouping all dependencies into ONE vendor chunk is actually faster on high-latency mobile networks
          // than many small chunks due to HTTP/2 multiplexing overhead and TCP slow start.
          if (id.includes('node_modules')) {
            // Keep heavy/rare components isolated so they don't bloat the critical path
            if (id.includes('recharts') || id.includes('lottie') || id.includes('octokit') || id.includes('victory') || id.includes('embla-carousel')) {
              return 'rare-vendors';
            }
            
            // Critical libraries that are large
            if (id.includes('framer-motion')) return 'framer-motion';
            if (id.includes('lucide-react')) return 'lucide-react';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('@tanstack')) return 'tanstack';
            if (id.includes('radix-ui')) return 'radix-ui';
            if (id.includes('i18next')) return 'i18n';
            if (id.includes('date-fns')) return 'date-fns';
            if (id.includes('zustand')) return 'zustand';
            
            // Standard vendor for everything else (React, etc)
            return 'vendor';
          }
        }
      }
    }
  }
}));
