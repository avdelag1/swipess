import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Gauge, Zap, Eye, Move, Clock, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, Image, FileCode,
  FileType, Film, TrendingDown, Info,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { initWebVitalsMonitoring } from '@/utils/webVitals';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VitalMetric {
  name: string;
  label: string;
  value: number | null;
  unit: string;
  good: number;
  poor: number;
  icon: React.ReactNode;
  description: string;
}

interface AuditIssue {
  id: string;
  title: string;
  savingsKib?: number;
  savingsMs?: number;
  category: 'image' | 'js' | 'css' | 'network' | 'render';
  severity: 'high' | 'medium' | 'low';
  description: string;
}

// ─── Lighthouse data (from PageSpeed Insights report, Mar 25 2026) ─────────────

const LIGHTHOUSE_SCORES = {
  performance: 65,
  accessibility: 82,
  bestPractices: 96,
  seo: 100,
};

const LIGHTHOUSE_VITALS = {
  fcp: 4400,   // ms
  lcp: 5700,   // ms
  tbt: 0,      // ms
  cls: 0,      // unitless
  si: 6100,    // ms
};

const AUDIT_ISSUES: AuditIssue[] = [
  {
    id: 'image-delivery',
    title: 'Improve image delivery',
    savingsKib: 91,
    category: 'image',
    severity: 'high',
    description:
      'Swipess-logo.webp is 1536×1024 but displayed at 517×345 (–57 KiB). ' +
      'Swipess-logo.png should be converted to modern formats (–34 KiB).',
  },
  {
    id: 'unused-js',
    title: 'Reduce unused JavaScript',
    savingsKib: 140,
    category: 'js',
    severity: 'high',
    description:
      'vendor.js has 85 KiB of unused code. supabase.js has 34 KiB unused. ' +
      'feed.js has 21 KiB unused. Consider dynamic imports and tree-shaking.',
  },
  {
    id: 'unused-css',
    title: 'Reduce unused CSS',
    savingsKib: 39,
    category: 'css',
    severity: 'high',
    description:
      'index.css transfers 41 KiB but 39 KiB is unused on first load. ' +
      'Consider PurgeCSS or splitting critical/non-critical CSS.',
  },
  {
    id: 'render-blocking',
    title: 'Eliminate render-blocking requests',
    savingsMs: 170,
    category: 'render',
    severity: 'high',
    description:
      'index.css (41.5 KiB) blocks the initial render for 1,330 ms. ' +
      'Inline critical CSS and defer the rest.',
  },
  {
    id: 'cache-ttl',
    title: 'Use efficient cache lifetimes',
    savingsKib: 222,
    category: 'network',
    severity: 'medium',
    description:
      'Swipess-logo-video.mp4 (2,078 KiB), Swipess-brand-logo.webp (65 KiB), and ' +
      'Swipess-logo.png (63 KiB) only have a 7-day cache TTL. Increase to ≥ 1 year.',
  },
  {
    id: 'large-payloads',
    title: 'Avoid enormous network payloads',
    savingsKib: undefined,
    category: 'network',
    severity: 'medium',
    description:
      'Total transfer: 2,769 KiB. Swipess-logo-video.mp4 alone is 2,078 KiB. ' +
      'Compress the video or lazy-load it after interaction.',
  },
  {
    id: 'minify-js',
    title: 'Minify JavaScript',
    savingsKib: 6,
    category: 'js',
    severity: 'low',
    description:
      'icons.js (15 KiB) has 6.4 KiB of unminified code. ' +
      'Ensure Terser/ESBuild minification is applied to all chunks.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 90) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function _scoreBg(score: number) {
  if (score >= 90) return 'bg-emerald-500/10 border-emerald-500/30';
  if (score >= 50) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-red-500/10 border-red-500/30';
}

function vitalStatus(metric: VitalMetric): 'good' | 'needs-improvement' | 'poor' | 'waiting' {
  if (metric.value === null) return 'waiting';
  if (metric.value <= metric.good) return 'good';
  if (metric.value <= metric.poor) return 'needs-improvement';
  return 'poor';
}

function vitalColor(status: ReturnType<typeof vitalStatus>) {
  if (status === 'good') return 'text-emerald-500';
  if (status === 'needs-improvement') return 'text-amber-500';
  if (status === 'poor') return 'text-red-500';
  return 'text-muted-foreground';
}

function vitalBg(status: ReturnType<typeof vitalStatus>) {
  if (status === 'good') return 'border-emerald-500/30 bg-emerald-500/5';
  if (status === 'needs-improvement') return 'border-amber-500/30 bg-amber-500/5';
  if (status === 'poor') return 'border-red-500/30 bg-red-500/5';
  return 'border-border bg-card';
}

function formatValue(value: number | null, unit: string) {
  if (value === null) return '—';
  if (unit === 'ms') return value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value)} ms`;
  if (unit === 's') return `${(value / 1000).toFixed(1)} s`;
  return value.toFixed(3);
}

function categoryIcon(category: AuditIssue['category']) {
  switch (category) {
    case 'image': return <Image className="w-4 h-4" />;
    case 'js': return <FileCode className="w-4 h-4" />;
    case 'css': return <FileType className="w-4 h-4" />;
    case 'network': return <Film className="w-4 h-4" />;
    case 'render': return <Move className="w-4 h-4" />;
  }
}

function severityBadge(severity: AuditIssue['severity']) {
  if (severity === 'high') return 'bg-red-500/10 text-red-500 border-red-500/30';
  if (severity === 'medium') return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
  return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
}

// ─── Gauge arc component ──────────────────────────────────────────────────────

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const radius = 36;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-14 overflow-hidden">
        <svg width="96" height="56" viewBox="0 0 96 56" className="absolute inset-0">
          {/* Track */}
          <path
            d="M 8,48 A 40,40 0 0 1 88,48"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-muted/20"
          />
          {/* Value arc */}
          <path
            d="M 8,48 A 40,40 0 0 1 88,48"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${offset}`}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <span
          className="absolute bottom-0 left-0 right-0 text-center text-xl font-bold"
          style={{ color }}
        >
          {score}
        </span>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminPerformanceDashboard() {
  const [liveMetrics, setLiveMetrics] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);
  const initialized = useRef(false);

  // Collect live web vitals from the browser
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    initWebVitalsMonitoring((metric) => {
      setLiveMetrics((prev) => ({ ...prev, [metric.name]: metric.value }));
      setLastUpdated(new Date());
    });
  }, []);

  const vitals: VitalMetric[] = [
    {
      name: 'LCP',
      label: 'Largest Contentful Paint',
      value: liveMetrics['LCP'] ?? LIGHTHOUSE_VITALS.lcp,
      unit: 'ms',
      good: 2500,
      poor: 4000,
      icon: <Eye className="w-5 h-5" />,
      description: 'Time until the largest visible element is rendered.',
    },
    {
      name: 'FCP',
      label: 'First Contentful Paint',
      value: LIGHTHOUSE_VITALS.fcp,
      unit: 'ms',
      good: 1800,
      poor: 3000,
      icon: <Zap className="w-5 h-5" />,
      description: 'Time until the first text or image is painted.',
    },
    {
      name: 'TBT',
      label: 'Total Blocking Time',
      value: liveMetrics['TBT'] ?? LIGHTHOUSE_VITALS.tbt,
      unit: 'ms',
      good: 200,
      poor: 600,
      icon: <Clock className="w-5 h-5" />,
      description: 'Sum of long task durations between FCP and TTI.',
    },
    {
      name: 'CLS',
      label: 'Cumulative Layout Shift',
      value: liveMetrics['CLS'] ?? LIGHTHOUSE_VITALS.cls,
      unit: '',
      good: 0.1,
      poor: 0.25,
      icon: <Move className="w-5 h-5" />,
      description: 'Measures unexpected layout shifts during page load.',
    },
    {
      name: 'FID',
      label: 'First Input Delay',
      value: liveMetrics['FID'] ?? null,
      unit: 'ms',
      good: 100,
      poor: 300,
      icon: <Gauge className="w-5 h-5" />,
      description: 'Delay between first user interaction and browser response.',
    },
    {
      name: 'SI',
      label: 'Speed Index',
      value: LIGHTHOUSE_VITALS.si,
      unit: 'ms',
      good: 3400,
      poor: 5800,
      icon: <TrendingDown className="w-5 h-5" />,
      description: 'How quickly page contents are visibly populated.',
    },
  ];

  const totalSavingsKib = AUDIT_ISSUES.reduce((s, a) => s + (a.savingsKib ?? 0), 0);
  const totalSavingsMs = AUDIT_ISSUES.reduce((s, a) => s + (a.savingsMs ?? 0), 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <PageHeader
          title="Performance Dashboard"
          subtitle="Live web vitals + Lighthouse audit · Swipess.com"
          backTo="/admin/eventos"
          actions={
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
            </div>
          }
        />

        {/* ── Lighthouse scores ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-border bg-card p-5 mb-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Lighthouse Scores</h2>
            <span className="ml-auto text-xs text-muted-foreground">Mar 25, 2026 · Moto G Power · Slow 4G</span>
          </div>
          <div className="flex flex-wrap justify-around gap-4">
            <ScoreGauge score={LIGHTHOUSE_SCORES.performance} label="Performance" />
            <ScoreGauge score={LIGHTHOUSE_SCORES.accessibility} label="Accessibility" />
            <ScoreGauge score={LIGHTHOUSE_SCORES.bestPractices} label="Best Practices" />
            <ScoreGauge score={LIGHTHOUSE_SCORES.seo} label="SEO" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />0–49 Poor
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />50–89 Needs work
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />90–100 Good
            </div>
          </div>
        </motion.section>

        {/* ── Core Web Vitals ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mb-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">Core Web Vitals</h2>
            <span className="text-xs text-muted-foreground">
              Live values override Lighthouse estimates when available
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {vitals.map((metric, i) => {
              const status = vitalStatus(metric);
              return (
                <motion.div
                  key={metric.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.07 + i * 0.04 }}
                  className={cn(
                    'rounded-xl border p-3 flex flex-col gap-1',
                    vitalBg(status),
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className={cn('flex items-center gap-1.5', vitalColor(status))}>
                      {metric.icon}
                      <span className="text-xs font-semibold">{metric.name}</span>
                    </div>
                    {status === 'good' && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                    {status === 'poor' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                    {status === 'needs-improvement' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                    {status === 'waiting' && <Info className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                  <div className={cn('text-2xl font-bold', vitalColor(status))}>
                    {formatValue(metric.value, metric.unit)}
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{metric.description}</p>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Good ≤ {formatValue(metric.good, metric.unit)} · Poor &gt; {formatValue(metric.poor, metric.unit)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* ── Potential savings summary ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 mb-5 flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-sm font-semibold text-foreground">Potential savings</span>
          </div>
          <div className="flex flex-wrap gap-4 ml-auto text-sm">
            <div className="text-center">
              <div className="text-xl font-bold text-amber-500">{totalSavingsKib} KiB</div>
              <div className="text-xs text-muted-foreground">transfer reduction</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-amber-500">{totalSavingsMs} ms</div>
              <div className="text-xs text-muted-foreground">render unblock</div>
            </div>
          </div>
        </motion.section>

        {/* ── Audit issues ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <h2 className="text-sm font-semibold text-foreground mb-3">Audit Issues</h2>
          <div className="flex flex-col gap-2">
            {AUDIT_ISSUES.map((issue, i) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.17 + i * 0.04 }}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedAudit(expandedAudit === issue.id ? null : issue.id)}
                >
                  <span className={cn('text-muted-foreground', {
                    'text-red-500': issue.severity === 'high',
                    'text-amber-500': issue.severity === 'medium',
                    'text-blue-500': issue.severity === 'low',
                  })}>
                    {categoryIcon(issue.category)}
                  </span>
                  <span className="flex-1 text-sm font-medium text-foreground">{issue.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {issue.savingsKib != null && (
                      <span className="text-xs text-muted-foreground">–{issue.savingsKib} KiB</span>
                    )}
                    {issue.savingsMs != null && (
                      <span className="text-xs text-muted-foreground">–{issue.savingsMs} ms</span>
                    )}
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', severityBadge(issue.severity))}>
                      {issue.severity}
                    </span>
                  </div>
                </button>
                {expandedAudit === issue.id && (
                  <div className="px-4 pb-3 pt-1 text-sm text-muted-foreground border-t border-border bg-muted/20">
                    {issue.description}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Accessibility note ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          className="mt-5 rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Accessibility Flags</h2>
            <span className={cn('ml-auto text-sm font-bold', scoreColor(LIGHTHOUSE_SCORES.accessibility))}>
              {LIGHTHOUSE_SCORES.accessibility}
            </span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Tour "close" button has no accessible name — add <code className="text-xs bg-muted px-1 rounded">aria-label</code></li>
            <li>
              <code className="text-xs bg-muted px-1 rounded">user-scalable=no</code> in viewport blocks zoom for low-vision users
            </li>
            <li>
              Some text/button contrasts fail WCAG AA — review muted foreground tokens against backgrounds
            </li>
          </ul>
        </motion.section>

        {/* ── Security note ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.4 }}
          className="mt-4 rounded-2xl border border-border bg-card p-4 mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground">Security Headers</h2>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>CSP uses <code className="text-xs bg-muted px-1 rounded">unsafe-inline</code> — migrate to nonces or hashes</li>
            <li>CSP defined in <code className="text-xs bg-muted px-1 rounded">&lt;meta&gt;</code> tag — move to HTTP header</li>
            <li>No <code className="text-xs bg-muted px-1 rounded">Cross-Origin-Opener-Policy</code> header set</li>
            <li>HSTS missing <code className="text-xs bg-muted px-1 rounded">includeSubDomains</code> and <code className="text-xs bg-muted px-1 rounded">preload</code> directives</li>
          </ul>
        </motion.section>
      </div>
    </div>
  );
}


