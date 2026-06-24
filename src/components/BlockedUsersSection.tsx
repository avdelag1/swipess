import { ShieldOff, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';
import { useBlockedUsers, useUnblockUser } from '@/hooks/useBlocking';

/**
 * Settings section that lets users review and unblock the people they've
 * blocked. Blocking itself lives in chats; this is the management surface.
 */
export function BlockedUsersSection() {
  const { isLight } = useAppTheme();
  const { data: blocked = [], isLoading } = useBlockedUsers();
  const unblock = useUnblockUser();

  return (
    <div className={cn(
      "space-y-6 p-8 rounded-[2.5rem] backdrop-blur-3xl transition-all duration-700",
      isLight ? "bg-white/40" : "bg-black/40"
    )}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Trust &amp; Safety</span>
        </div>
        <h2 className={cn("text-3xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>Blocked Users</h2>
        <p className="text-sm font-medium opacity-70 leading-relaxed">
          People you block can't message you or appear in your feed. You can unblock anyone here at any time.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm font-bold opacity-50">Loading…</p>
      ) : blocked.length === 0 ? (
        <div className={cn("p-6 rounded-2xl text-center", isLight ? "bg-slate-50" : "bg-white/5")}>
          <ShieldOff className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-bold opacity-60">You haven't blocked anyone.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {blocked.map((u) => (
            <div
              key={u.blocked_id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl border",
                isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"
              )}
            >
              <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
                ) : (
                  <UserX className="w-5 h-5 opacity-40" />
                )}
              </div>
              <span className="flex-1 min-w-0 truncate font-bold text-sm">{u.full_name}</span>
              <Button
                variant="outline"
                disabled={unblock.isPending}
                onClick={() => unblock.mutate(u.blocked_id)}
                className="h-10 px-4 rounded-full font-black uppercase tracking-widest text-[11px]"
              >
                {unblock.isPending ? '…' : 'Unblock'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
