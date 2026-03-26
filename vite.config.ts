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
          /<link rel="stylesheet" href="\/assets\/index-([a-zA-Z0-9_-]+)\.css">/gi,
          '<link rel="preload" href="/assets/index-$1.css" as="style" fetchpriority="high" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="/assets/index-$1.css"></noscript>'
        );
      }
    },
    {
      name: 'critical-preload-plugin',
      transformIndexHtml(html, ctx) {
        if (!ctx.bundle) return html;
        const preloads = [];
        for (const [key, chunk] of Object.entries(ctx.bundle)) {
          if (chunk.type === 'chunk' && (chunk.name === 'vendor' || chunk.name === 'main')) {
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
    cssCodeSplit: true,
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
              // Heavy/rare components isolated from critical path
              if (id.includes('recharts') || id.includes('lottie') || id.includes('octokit') || id.includes('victory')) {
                return 'rare-vendors';
              }
              // Framer-motion is heavy and only needed after first paint
              if (id.includes('framer-motion')) {
                return 'framer-motion';
              }
              // Supabase SDK - loaded after initial render
              if (id.includes('@supabase')) {
                return 'supabase';
              }
              // Radix UI - loaded on demand
              if (id.includes('@radix-ui')) {
                return 'radix';
              }
              return 'vendor';
            }
        }
      }
    }
  }
}));
