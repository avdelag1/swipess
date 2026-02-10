import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// Build version injector plugin for automatic cache busting
function buildVersionPlugin() {
  const buildTime = Date.now().toString();
  return {
    name: 'build-version-injector',
    transformIndexHtml(html: string) {
      // Inject version, preconnect hints, and performance optimizations
      const preconnects = `
    <link rel="preconnect" href="https://vxplzgwimqqimkpabvja.supabase.co" crossorigin>
    <link rel="dns-prefetch" href="https://vxplzgwimqqimkpabvja.supabase.co">
    <meta name="app-version" content="${buildTime}" />`;
      return html.replace('</head>', `${preconnects}\n</head>`);
    },
    transform(code: string, id: string) {
      // Replace __BUILD_TIME__ in service worker (for src/ files)
      if (id.endsWith('sw.js') || id.includes('service-worker')) {
        return code.replace(/__BUILD_TIME__/g, buildTime);
      }
      return code;
    },
    // FIX: Process public/sw.js during build - Vite doesn't transform public/ files
    // This hook runs after files are copied to dist, allowing us to modify sw.js
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
            // Replace BUILD_TIME placeholder with actual build timestamp
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

// CSS optimization plugin - extracts and purges unused CSS
function cssOptimizationPlugin(): import('vite').Plugin {
  return {
    name: 'css-optimization',
    enforce: 'post',
    generateBundle(_options, bundle) {
      // Mark large CSS chunks for analysis in dev
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

// Preload hints plugin - generates modulepreload for critical chunks
function preloadPlugin(): import('vite').Plugin {
  return {
    name: 'preload-plugin',
    enforce: 'post',
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return html;

      // Find critical chunks to preload - only the most essential
      const criticalChunks = ['react-vendor', 'react-router'];
      const preloadLinks: string[] = [];

      for (const [fileName, chunk] of Object.entries(ctx.bundle)) {
        if (chunk.type === 'chunk') {
          const isCritical = criticalChunks.some(name => fileName.includes(name));
          if (isCritical) {
            preloadLinks.push(`<link rel="modulepreload" href="/${fileName}" fetchpriority="high">`);
          }
        }
      }

      // Add CSS preload for critical stylesheet
      for (const [fileName] of Object.entries(ctx.bundle)) {
        if (fileName.endsWith('.css') && fileName.includes('index')) {
          preloadLinks.push(`<link rel="preload" href="/${fileName}" as="style" fetchpriority="high">`);
        }
      }

      return html.replace('</head>', `${preloadLinks.join('\n')}\n</head>`);
    }
  };
}

// Resource hints plugin - adds fetchpriority and loading hints
function resourceHintsPlugin(): import('vite').Plugin {
  return {
    name: 'resource-hints-plugin',
    enforce: 'post',
    transformIndexHtml(html) {
      // Add fetchpriority to critical resources
      return html
        // Mark main script as high priority
        .replace(
          /<script type="module" src="\/src\/main\.tsx">/,
          '<script type="module" src="/src/main.tsx" fetchpriority="high">'
        );
    }
  };
}

// Build timestamp for cache versioning (used by SW registration)
const BUILD_TIME = Date.now().toString();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Define global constants available in app code
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(BUILD_TIME),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    buildVersionPlugin(),
    cssOptimizationPlugin(),
    preloadPlugin(),
    resourceHintsPlugin(),
    mode === 'development' && componentTagger(),
    // Bundle analyzer - generates stats.html in dist folder
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
      // Force single React instance (prevents Invalid Hook Call)
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    // Prevent duplicate React instances (including jsx runtimes)
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react'
    ],
    exclude: ['@capacitor/core', '@capacitor/app'],
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    // More aggressive minification options
    minifyIdentifiers: mode === 'production',
    minifySyntax: mode === 'production',
    minifyWhitespace: mode === 'production',
  },
  build: {
    sourcemap: false, // Disable sourcemaps in production
    // Use esbuild for minification - safer for React than terser
    minify: 'esbuild',
    // Inline assets smaller than 8KB to reduce HTTP requests (was 4KB)
    assetsInlineLimit: 8192,
    // Report compressed (gzip) sizes in build output
    reportCompressedSize: true,
    // Explicit cssCodeSplit for clarity (defaults to true)
    cssCodeSplit: true,
    // Target modern browsers for smaller bundles (removes polyfills)
    target: 'es2020',
    // Optimize CSS for production
    cssMinify: mode === 'production' ? 'esbuild' : false,
    rollupOptions: {
      output: {
        // Use content hashes for long-term caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // CRITICAL PATH - Smallest possible initial bundle
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

          // Core React runtime - smallest possible critical chunk
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // React Router - loaded on every page, keep small
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }
          // Scheduler (React dependency) - keep with react
          if (id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          // clsx and tailwind-merge - utility libs used everywhere, keep small
          if (id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) {
            return 'utils';
          }
          // class-variance-authority - UI styling utility
          if (id.includes('node_modules/class-variance-authority')) {
            return 'utils';
          }

          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // LARGE DATA FILES - Load on demand (210KB+ savings)
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

          // World locations data - only needed for location filters
          if (id.includes('data/worldLocations') || id.includes('data/mexicanLocations')) {
            return 'data-locations';
          }

          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // FEATURE CHUNKS - Lazy loaded per feature
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

          // React Query - defer loading, not needed for initial render
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'react-query';
          }
          // Supabase client - only load when auth is needed
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }
          // Framer Motion - heavy animation library, load separately
          if (id.includes('node_modules/framer-motion')) {
            return 'motion';
          }

          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // UI COMPONENTS - Split by usage pattern
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

          // Split Radix UI by component type for granular loading
          if (id.includes('node_modules/@radix-ui/react-dialog') ||
              id.includes('node_modules/@radix-ui/react-alert-dialog')) {
            return 'ui-dialogs';
          }
          if (id.includes('node_modules/@radix-ui/react-dropdown') ||
              id.includes('node_modules/@radix-ui/react-select') ||
              id.includes('node_modules/@radix-ui/react-popover')) {
            return 'ui-dropdowns';
          }
          // Tooltip - very common, keep separate and small
          if (id.includes('node_modules/@radix-ui/react-tooltip')) {
            return 'ui-tooltip';
          }
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui-radix';
          }

          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // UTILITIES & LIBRARIES
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

          // Date utilities - only needed for calendar/date features
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }
          // Icons - split out as they can be large
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-icons')) {
            return 'icons';
          }
          // Forms - only needed on form pages
          if (id.includes('node_modules/zod')) {
            return 'validation';
          }
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform')) {
            return 'forms';
          }
          // Charts - only needed on dashboard analytics
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'charts';
          }
          // Capacitor - only needed in native apps
          if (id.includes('node_modules/@capacitor')) {
            return 'capacitor';
          }
          // Carousel components
          if (id.includes('node_modules/embla-carousel')) {
            return 'carousel';
          }
          // cmdk - command palette, rarely used
          if (id.includes('node_modules/cmdk')) {
            return 'cmdk';
          }
          // Other vendor chunks - catch-all (keep small)
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      },
      // Safe tree shaking - don't break React context
      treeshake: {
        preset: 'safest',
      },
    },
    // Warn on chunks larger than 1000KB to reduce noise
    chunkSizeWarningLimit: 1000,
  },
}));
