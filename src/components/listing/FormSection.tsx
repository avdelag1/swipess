import { cn } from '@/lib/utils';

type Accent = 'rose' | 'amber' | 'orange' | 'cyan' | 'emerald' | 'purple';

const ACCENT_DOT: Record<Accent, string> = {
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
  cyan: 'bg-cyan-500',
  emerald: 'bg-emerald-500',
  purple: 'bg-purple-500',
};

export function FormSection({
  title,
  accent = 'rose',
  children,
  className,
}: {
  title: string;
  accent?: Accent;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-3xl bg-card/80 backdrop-blur-sm border border-border shadow-md overflow-hidden', className)}>
      <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
        <div className={cn('w-2 h-2 rounded-full shrink-0', ACCENT_DOT[accent])} />
        <h3 className="text-sm font-bold text-foreground/90 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-5 pb-5 space-y-4">{children}</div>
    </div>
  );
}

export function FormFieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold text-foreground/80 mb-1.5">{children}</div>;
}