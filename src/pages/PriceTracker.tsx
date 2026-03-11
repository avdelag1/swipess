import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface PricePoint {
  neighborhood: string;
  month: number;
  year: number;
  avg_price: number;
  listing_count: number;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ZONE_COLORS: Record<string, string> = {
  'Aldea Zamá': '#f59e0b',
  'La Veleta': '#10b981',
  'Region 15': '#3b82f6',
  'Tulum Beach Zone': '#ef4444',
};

export default function PriceTracker() {
  const [data, setData] = useState<PricePoint[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      const { data: prices } = await supabase.from('price_history').select('*').order('year').order('month');
      setData((prices as any[]) || []);
      setIsLoading(false);
    };
    fetchPrices();
  }, []);

  const neighborhoods = useMemo(() => [...new Set(data.map(d => d.neighborhood))], [data]);

  const chartData = useMemo(() => {
    const months = MONTH_LABELS.map((label, i) => {
      const monthData: any = { name: label };
      const filtered = selectedZone === 'all' ? neighborhoods : [selectedZone];
      filtered.forEach(zone => {
        const point = data.find(d => d.month === i + 1 && d.neighborhood === zone);
        if (point) monthData[zone] = point.avg_price;
      });
      return monthData;
    });
    return months;
  }, [data, selectedZone, neighborhoods]);

  const getStats = (zone: string) => {
    const zoneData = data.filter(d => d.neighborhood === zone).sort((a, b) => a.month - b.month);
    if (zoneData.length < 2) return { current: 0, change: 0 };
    const current = zoneData[zoneData.length - 1]?.avg_price || 0;
    const prev = zoneData[zoneData.length - 2]?.avg_price || current;
    const change = prev ? ((current - prev) / prev) * 100 : 0;
    return { current, change };
  };

  const formatPrice = (val: number) => `$${(val / 1000).toFixed(0)}K`;

  const activeZones = selectedZone === 'all' ? neighborhoods : [selectedZone];

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Price Tracker
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Tulum rental pricing trends by neighborhood</p>
      </div>

      {/* Zone filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
        <button
          onClick={() => setSelectedZone('all')}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all border',
            selectedZone === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/50 text-muted-foreground'
          )}
        >All Zones</button>
        {neighborhoods.map(zone => (
          <button
            key={zone}
            onClick={() => setSelectedZone(zone)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all border',
              selectedZone === zone ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/50 text-muted-foreground'
            )}
          >{zone}</button>
        ))}
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-64 rounded-2xl bg-card animate-pulse" />
      ) : (
        <div className="bg-card rounded-2xl border border-border/30 p-4 mb-6">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                {activeZones.map(zone => (
                  <linearGradient key={zone} id={`grad-${zone.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ZONE_COLORS[zone] || '#6366f1'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ZONE_COLORS[zone] || '#6366f1'} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatPrice} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                formatter={(value: number) => [`$${value.toLocaleString()} MXN`, '']}
              />
              {activeZones.map(zone => (
                <Area
                  key={zone}
                  type="monotone"
                  dataKey={zone}
                  stroke={ZONE_COLORS[zone] || '#6366f1'}
                  strokeWidth={2}
                  fill={`url(#grad-${zone.replace(/\s/g, '')})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        {neighborhoods.map(zone => {
          const { current, change } = getStats(zone);
          const isUp = change > 0;
          return (
            <div
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={cn(
                'p-4 rounded-2xl border cursor-pointer transition-all',
                selectedZone === zone ? 'border-primary/50 bg-primary/5' : 'border-border/30 bg-card'
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ZONE_COLORS[zone] || '#6366f1' }} />
                <h4 className="text-xs font-semibold text-foreground truncate">{zone}</h4>
              </div>
              <p className="text-lg font-bold text-foreground">${current.toLocaleString()}</p>
              <div className={cn('flex items-center gap-1 text-xs font-medium', isUp ? 'text-red-400' : 'text-green-400')}>
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(change).toFixed(1)}% vs last month
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
