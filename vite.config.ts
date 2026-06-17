import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const mapboxToken = (
    env.VITE_MAPBOX_ACCESS_TOKEN
    || env.VITE_MAPBOX_TOKEN
    || env.MAPBOX_ACCESS_TOKEN
    || env.MAPBOX_TOKEN
    || env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    || ''
  ).trim().replace(/^['"]|['"]$/g, '');

  return {
  server: {
    host: "::",
    port: 8080,
  },
  // 🚀 Drop debugger only in production — keep console.warn/error for diagnostics
  ...(mode === 'production' ? {
    esbuild: {
      drop: ['debugger'],
    },
  } : {}),
  plugins: ([
    react(),
    ...(process.env.ANALYZE ? [(await import('rollup-plugin-visualizer')).visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })] : []),
    {
      name: 'sw-build-time-plugin',
      writeBundle(_options, bundle) {
        const swPath = path.resolve(__dirname, 'dist/sw.js');
        if (!existsSync(swPath)) return;

        const buildTime = new Date().toISOString();

        // Only precache boot-critical chunks — never maps/heic/lazy route bundles.
        const CRITICAL_VENDOR_PREFIXES = [
          'vendor-react-',
          'vendor-router-',
          'vendor-query-',
          'vendor-supabase-',
          'vendor-css-utils-',
          'vendor-i18n-',
        ];

        const precacheUrls = new Set<string>();

        const indexPath = path.resolve(__dirname, 'dist/index.html');
        if (existsSync(indexPath)) {
          const html = readFileSync(indexPath, 'utf-8');
          const entryScript = html.match(/<script[^>]+src="(\/assets\/[^"]+)"/);
          const entryCss = html.match(/<link[^>]+rel="stylesheet"[^>]+href="(\/assets\/[^"]+)"/);
          if (entryScript?.[1]) precacheUrls.add(entryScript[1]);
          if (entryCss?.[1]) precacheUrls.add(entryCss[1]);

          const assetRef = /(?:href|src)="(\/assets\/[^"?#]+)"/g;
          let match: RegExpExecArray | null;
          while ((match = assetRef.exec(html)) !== null) {
            const url = match[1];
            const fileName = url.split('/').pop() || '';
            if (CRITICAL_VENDOR_PREFIXES.some((prefix) => fileName.startsWith(prefix))) {
              precacheUrls.add(url);
            }
          }
        }

        for (const item of Object.values(bundle)) {
          if ((item as { type?: string }).type !== 'chunk') continue;
          const chunk = item as { fileName?: string; isEntry?: boolean };
          const fileName = chunk.fileName;
          if (!fileName?.startsWith('assets/')) continue;
          const base = fileName.split('/').pop() || '';
          if (chunk.isEntry) {
            precacheUrls.add(`/${fileName}`);
            continue;
          }
          if (CRITICAL_VENDOR_PREFIXES.some((prefix) => base.startsWith(prefix))) {
            precacheUrls.add(`/${fileName}`);
          }
        }

        const manifestJson = JSON.stringify([...precacheUrls].sort());
        let content = readFileSync(swPath, 'utf-8')
          .replace(/__BUILD_TIME__/g, buildTime)
          .replace(/__PRECACHE_MANIFEST__/g, manifestJson);

        writeFileSync(swPath, content);
      }
    },
    {
      name: 'critical-preload-plugin',
      transformIndexHtml(html: string, ctx: any) {
        if (!ctx.bundle) return html;
        const preloads: string[] = [];
        for (const [_key, chunk] of Object.entries(ctx.bundle)) {
          if ((chunk as any).type === 'chunk' && (chunk as any).isEntry) {
            preloads.push(`<link rel="modulepreload" href="/${(chunk as any).fileName}" fetchpriority="high" crossorigin>`);
          }
        }
        return html.replace('</head>', `${preloads.slice(0, 1).join('')}</head>`);
      }
    },
    {
      name: 'mapbox-token-meta',
      transformIndexHtml(html: string) {
        const token = mapboxToken;
        if (!token || !token.startsWith('pk.')) return html;
        const tag = `<meta name="swipess-mapbox-token" content="${token.replace(/"/g, '&quot;')}" />`;
        return html.replace('</head>', `${tag}</head>`);
      },
    }
  ] as any),
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
    // Accept MAPBOX_ACCESS_TOKEN on Vercel if user skipped the VITE_ prefix
    'import.meta.env.VITE_MAPBOX_ACCESS_TOKEN': JSON.stringify(mapboxToken),
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') {
          console.log('\n[CIRCULAR DEPENDENCY]', warning.message);
        }
        warn(warning);
      },
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
            // CRITICAL: Keep ALL of @radix-ui together with React in one chunk.
            // The bare utility packages (@radix-ui/primitive, @radix-ui/number)
            // have no "react-" in their path, so without this they fell through
            // to a separate 199-byte "vendor-radix" chunk that vendor-react then
            // imported from. If that micro-chunk 404s on a stale/mismatched deploy,
            // vendor-react fails to evaluate and every Radix primitive (Dialog
            // Portal/Content/Overlay/…) becomes undefined → React error #130 in
            // every dialog. Folding all of @radix-ui into vendor-react removes the
            // cross-chunk split entirely.
            if (id.includes('@radix-ui')) return 'vendor-react';
            if (id.includes('react-router')) return 'vendor-router';
            // Merge ALL React-dependent packages and common utilities into vendor-react to prevent cycles
            // This includes any package with "react" in the name or path, plus common utilities
            if (id.includes('zustand') || id.includes('use-sync-external-store') || id.includes('loose-envify') || id.includes('prop-types') || id.includes('object-assign') || id.includes('js-tokens') || id.includes('react-is') || /\/react-/.test(id) || /@[^/]+\/react-/.test(id) || id.includes('@floating-ui') || id.includes('aria-hidden') || id.includes('react-remove-scroll') || id.includes('react-style-singleton') || id.includes('get-nonce') || id.includes('cmdk') || id.includes('qrcode.react') || id.includes('tiny-invariant') || id.includes('tiny-warning') || id.includes('classnames') || id.includes('tslib')) return 'vendor-react';

            // ISOLATED HEAVY LIBRARIES — maximize cache persistence
            if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'vendor-motion';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('lucide-react') || id.includes('react-icons')) return 'vendor-icons';
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) return 'vendor-forms';
            if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
            if (id.includes('recharts') || id.includes('d3-') || id.includes('/d3/')) return 'vendor-viz';
            if (id.includes('embla-carousel')) return 'vendor-carousel';
            if (id.includes('browser-image-compression')) return 'vendor-img';
            if (id.includes('@tanstack')) return 'vendor-query';
            if (id.includes('date-fns')) return 'vendor-dates';
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) return 'vendor-css-utils';
            // Map / geo
            if (id.includes('mapbox') || id.includes('maplibre')) return 'vendor-maps';
            // Audio
            if (id.includes('howler') || id.includes('tone') || id.includes('wavesurfer')) return 'vendor-audio';
            // Crypto / encoding utils
            if (id.includes('tweetnacl') || id.includes('base64') || id.includes('js-sha') || id.includes('uuid')) return 'vendor-crypto';
            // Markdown / rich-text — folded into vendor-react because react-markdown imports from
            // remark/rehype/unified/hast-* which in turn reference React JSX runtime,
            // creating a vendor-react ↔ vendor-md circular chunk dependency. Keeping them
            // together avoids the cycle and simplifies caching (markdown deps change together).
            if (id.includes('react-markdown') || id.includes('marked') || id.includes('remark') || id.includes('rehype') || id.includes('micromark') || id.includes('mdast') || id.includes('unified') || id.includes('gray-matter') || id.includes('bail') || id.includes('trough') || id.includes('vfile') || id.includes('unist') || id.includes('hast') || id.includes('property-information') || id.includes('comma-separated-tokens') || id.includes('space-separated-tokens') || id.includes('zwitch') || id.includes('longest-streak') || id.includes('ccount') || id.includes('character-entities') || id.includes('decode-named-character-reference') || id.includes('devlop') || id.includes('is-plain-obj')) return 'vendor-react';
            // PDF
            if (id.includes('pdfjs') || id.includes('pdf-lib') || id.includes('jspdf')) return 'vendor-pdf';
            // Everything else falls through to default Rollup chunking
          }
        }
      }
    }
  }
};
});
