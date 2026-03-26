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
        // Regex covers full Vite hash character set: lowercase, uppercase, digits, underscore, hyphen
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
          if (chunk.type === 'chunk' && (chunk.name === 'react-core' || chunk.name === 'main')) {
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
          if (!id.includes('node_modules')) return;

          // React core — tiny, always needed, preloaded
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'react-core';
          }
          // Router — needed for navigation
          if (id.includes('react-router')) {
            return 'router';
          }
          // Supabase — only needed after auth check, load separately
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          // Framer Motion — large animation library, not needed for first paint
          if (id.includes('framer-motion')) {
            return 'motion';
          }
          // Radix UI — component library
          if (id.includes('@radix-ui')) {
            return 'radix';
          }
          // Heavy/rarely used — keep out of critical path
          if (id.includes('recharts') || id.includes('lottie') || id.includes('octokit') || id.includes('victory')) {
            return 'rare-vendors';
          }
          // Everything else
          return 'vendor';
        }
      }
    }
  }
}));
