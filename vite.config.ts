import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// Build version injector plugin for automatic cache busting
function buildVersionPlugin() {
  const buildTime = Date.now().toString();
  return {
    name: 'build-version-injector',
    transformIndexHtml(html: string) {
      const preconnects = `
    <link rel="preconnect" href="${process.env.VITE_SUPABASE_URL || ''}" crossorigin>
    <link rel="dns-prefetch" href="${process.env.VITE_SUPABASE_URL || ''}">
    <meta name="app-version" content="${buildTime}" />`;
      return html.replace('</head>', `${preconnects}\n</head>`);
    },
    transform(code: string, id: string) {
      if (id.endsWith('sw.js') || id.includes('service-worker')) {
        return code.replace(/__BUILD_TIME__/g, buildTime);
      }
      return code;
    },
    writeBundle: {
      sequential: true,
      order: 'post' as const,
      async handler(options: { dir?: string }) {
        const fs = await import('fs');
        const nodePath = await import('path');
        const outDir = options.dir || 'dist';
        const swPath = nodePath.default.join(outDir, 'sw.js');

        try {
          if (fs.existsSync(swPath)) {
            let swContent = fs.readFileSync(swPath, 'utf-8');
            swContent = swContent.replace(/__BUILD_TIME__/g, buildTime);
            fs.writeFileSync(swPath, swContent, 'utf-8');
            console.log(`[build-version-injector] sw.js updated with version: ${buildTime}`);
          }
        } catch (e) {
          console.error('[build-version-injector] Failed to process sw.js:', e);
        }
      }
    }
  };
}

function cssOptimizationPlugin(): import('vite').Plugin {
  return {
    name: 'css-optimization',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && chunk.type === 'asset') {
          const source = 'source' in chunk ? chunk.source : undefined;
          const size = typeof source === 'string' ? source.length : 0;
          if (size > 50000) {
            console.log(`[CSS Optimization] Large CSS file detected: ${fileName} (${Math.round(size / 1024)}KB)`);
          }
        }
      }
    }
  };
}

function preloadPlugin(): import('vite').Plugin {
  return {
    name: 'preload-plugin',
    enforce: 'post',
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return html;

      const criticalChunks = ['react-vendor', 'react-router', 'react-query', 'supabase', 'motion', 'utils'];
      const preloadLinks: string[] = [];

      for (const [fileName, chunk] of Object.entries(ctx.bundle)) {
        if (chunk.type === 'chunk') {
          const isCritical = criticalChunks.some(name => fileName.includes(name));
          if (isCritical) {
            preloadLinks.push(`<link rel="modulepreload" href="/${fileName}" fetchpriority="high">`);
          }
        }
      }

      for (const [fileName] of Object.entries(ctx.bundle)) {
        if (fileName.endsWith('.css') && fileName.includes('index')) {
          preloadLinks.push(`<link rel="preload" href="/${fileName}" as="style" fetchpriority="high">`);
        }
      }

      return html.replace('</head>', `${preloadLinks.join('\n')}\n</head>`);
    }
  };
}

function resourceHintsPlugin(): import('vite').Plugin {
  return {
    name: 'resource-hints-plugin',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(
          /<script type="module" src="\/src\/main\.tsx">/,
          '<script type="module" src="/src/main.tsx" fetchpriority="high">'
        );
    }
  };
}

export default defineConfig(({ mode }) => ({
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(Date.now().toString()),
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
  plugins: [
    react(),
    buildVersionPlugin(),
    cssOptimizationPlugin(),
    preloadPlugin(),
    resourceHintsPlugin(),
    mode === 'production' && visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      dompurify: path.resolve(__dirname, "./node_modules/dompurify"),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', '@tanstack/react-query'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react',
      'dompurify',
      'zustand',
    ],
    exclude: ['@capacitor/core', '@capacitor/app'],
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    minifyIdentifiers: mode === 'production',
    minifySyntax: mode === 'production',
    minifyWhitespace: mode === 'production',
    target: 'es2022',
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    assetsInlineLimit: 8192,
    reportCompressedSize: true,
    cssCodeSplit: true,
    target: 'es2022',
    cssMinify: mode === 'production' ? 'esbuild' : false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }
          if (id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) {
            return 'utils';
          }
          if (id.includes('node_modules/class-variance-authority')) {
            return 'utils';
          }
          if (id.includes('data/worldLocations') || id.includes('data/mexicanLocations')) {
            return 'data-locations';
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'react-query';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'motion';
          }
          if (id.includes('pages/EventosFeed') || id.includes('pages/EventoDetail')) {
            return 'feed';
          }
          if (id.includes('pages/PriceTracker') || id.includes('pages/LocalIntel') || id.includes('pages/VideoTours')) {
            return 'explorer';
          }
          if (id.includes('node_modules/@radix-ui/react-dialog') ||
            id.includes('node_modules/@radix-ui/react-alert-dialog')) {
            return 'ui-dialogs';
          }
          if (id.includes('node_modules/@radix-ui/react-dropdown') ||
            id.includes('node_modules/@radix-ui/react-select') ||
            id.includes('node_modules/@radix-ui/react-popover')) {
            return 'ui-dropdowns';
          }
          if (id.includes('node_modules/@radix-ui/react-tooltip')) {
            return 'ui-tooltip';
          }
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui-radix';
          }
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-icons')) {
            return 'icons';
          }
          if (id.includes('node_modules/zod')) {
            return 'validation';
          }
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform')) {
            return 'forms';
          }
          if (id.includes('node_modules/@capacitor')) {
            return 'capacitor';
          }
          if (id.includes('node_modules/embla-carousel')) {
            return 'carousel';
          }
          if (id.includes('node_modules/cmdk')) {
            return 'cmdk';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      },
      treeshake: {
        preset: 'safest',
      },
      onwarn(warning, warn) {
        if (warning.code === 'MISSING_EXPORT' && warning.exporter?.includes('dompurify')) return;
        warn(warning);
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
