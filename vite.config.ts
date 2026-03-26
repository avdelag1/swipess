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
        // Vite may emit: <link rel="stylesheet" crossorigin href="..."> (crossorigin before href)
        // Use a flexible regex that matches any attribute order between rel and href.
        return html.replace(
          /<link\s+[^>]*?rel="stylesheet"[^>]*?href="(\/assets\/index-[^"]+\.css)"[^>]*?>/gi,
          '<link rel="preload" href="$1" as="style" fetchpriority="high" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="$1"></noscript>'
        );
      }
    },
    {
      // Replaces __BUILD_TIME__ in the copied public/sw.js with the real ISO timestamp.
      // public/ files are copied verbatim by Vite, so define() doesn't reach them.
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
