import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Plus, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';
import { formatDistanceToNow } from '@/utils/timeFormatter';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface ConversationHistoryPopoverProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  isDark: boolean;
}

export function ConversationHistoryPopover({
  conversations,
  currentConversationId,
  onSelect,
  onNewChat,
  isDark,
}: ConversationHistoryPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Conversation history"
          className={cn(
            "h-9 w-9 rounded-lg relative",
            isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          <History className="w-4 h-4" />
          {conversations.length > 0 && (
            <span className={cn(
              "absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full text-[7px] font-black flex items-center justify-center",
              isDark ? "bg-zinc-600 text-zinc-300" : "bg-gray-300 text-gray-600"
            )}>
              {conversations.length > 9 ? '9+' : conversations.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn(
          "w-64 p-2 rounded-2xl border shadow-2xl",
          isDark
            ? "bg-zinc-900 border-zinc-700/50 text-white"
            : "bg-white border-gray-200 text-gray-900"
        )}
      >
        {/* New Chat button */}
        <button
          onClick={() => { haptics.tap(); onNewChat(); }}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 transition-colors",
            isDark
              ? "bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 text-cyan-400 border border-cyan-500/20"
              : "bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-100"
          )}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold">New Chat</span>
        </button>

        {conversations.length === 0 ? (
          <div className={cn("px-3 py-4 text-center text-xs", isDark ? "text-zinc-600" : "text-gray-400")}>
            No past conversations yet
          </div>
        ) : (
          <>
            <p className={cn("px-3 py-1 text-[9px] font-black uppercase tracking-widest", isDark ? "text-zinc-600" : "text-gray-400")}>
              Recent
            </p>
            <ScrollArea className="max-h-80 pr-1">
              <div className="space-y-0.5">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => { haptics.tap(); onSelect(conv.id); }}
                    className={cn(
                      "w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-colors group",
                      conv.id === currentConversationId
                        ? isDark ? "bg-white/5 border border-white/5" : "bg-gray-50 border border-gray-100"
                        : isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
                    )}
                  >
                    <MessageSquare className={cn(
                      "w-3.5 h-3.5 mt-0.5 shrink-0",
                      conv.id === currentConversationId
                        ? isDark ? "text-cyan-400" : "text-cyan-600"
                        : isDark ? "text-zinc-600 group-hover:text-zinc-400" : "text-gray-400"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs font-medium leading-tight line-clamp-1",
                        conv.id === currentConversationId
                          ? isDark ? "text-white" : "text-gray-900"
                          : isDark ? "text-zinc-400 group-hover:text-zinc-200" : "text-gray-600"
                      )}>
                        {conv.title || 'Untitled'}
                      </p>
                      <p className={cn("text-[9px] mt-0.5", isDark ? "text-zinc-700" : "text-gray-300")}>
                        {formatDistanceToNow(conv.updated_at)}
                      </p>
                    </div>
                    {conv.id === currentConversationId && (
                      <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-full self-center", isDark ? "bg-cyan-500/10 text-cyan-400" : "bg-cyan-50 text-cyan-600")}>
                        NOW
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

