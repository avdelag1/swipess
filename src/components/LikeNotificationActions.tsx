import { Button } from '@/components/ui/button';
import { Flame, MessageCircle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LikeNotificationActionsProps {
  onAccept: () => void;
  onReject: () => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
  variant?: 'inline' | 'stacked';
  showChat?: boolean;
  onChat?: () => void;
}

export function LikeNotificationActions({
  onAccept,
  onReject,
  isAccepting = false,
  isRejecting = false,
  variant = 'inline',
  showChat = false,
  onChat,
}: LikeNotificationActionsProps) {
  const isLoading = isAccepting || isRejecting;

  if (variant === 'stacked') {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <Button
          onClick={onAccept}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          {isAccepting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Flame className="w-4 h-4 mr-2 fill-current" />
              Accept & Connect
            </>
          )}
        </Button>

        {showChat && (
          <Button
            onClick={onChat}
            disabled={isLoading}
            variant="outline"
            className="w-full border-orange-200 hover:bg-orange-50"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Open Chat
          </Button>
        )}

        <Button
          onClick={onReject}
          disabled={isLoading}
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
        >
          {isRejecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Dismissing...
            </>
          ) : (
            <>
              <X className="w-4 h-4 mr-2" />
              Not Interested
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Accept/Connect Button */}
      <Button
        onClick={onAccept}
        disabled={isLoading}
        size="sm"
        className={cn(
          'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
          'transition-all duration-200'
        )}
      >
        {isAccepting ? (
          <>
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Flame className="w-3 h-3 mr-1.5 fill-current" />
            Accept
          </>
        )}
      </Button>

      {/* Chat Button - appears after accept */}
      {showChat && (
        <Button
          onClick={onChat}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="border-orange-200 hover:bg-orange-50"
        >
          <MessageCircle className="w-3 h-3 mr-1.5" />
          Chat
        </Button>
      )}

      {/* Reject/Not Interested Button */}
      <Button
        onClick={onReject}
        disabled={isLoading}
        size="sm"
        variant="ghost"
        className="text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        {isRejecting ? (
          <>
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            Dismissing...
          </>
        ) : (
          <>
            <X className="w-3 h-3 mr-1.5" />
            Skip
          </>
        )}
      </Button>
    </div>
  );
}
