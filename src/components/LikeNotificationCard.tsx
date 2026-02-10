import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LikeNotificationPreview } from './LikeNotificationPreview';
import { LikeNotificationActions } from './LikeNotificationActions';
import { useLikeNotificationActions } from '@/hooks/useLikeNotificationActions';
import { useNavigate } from 'react-router-dom';

interface LikeNotificationCardProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    metadata?: {
      liker_id?: string;
      target_id?: string;
      target_type?: string;
    };
    related_user_id?: string;
    created_at: string;
    is_read: boolean;
  };
  onDismiss: (id: string) => void;
  currentUserRole?: 'client' | 'owner';
}

export function LikeNotificationCard({
  notification,
  onDismiss,
  currentUserRole,
}: LikeNotificationCardProps) {
  const navigate = useNavigate();
  const { acceptLike, rejectLike, isAccepting, isRejecting } = useLikeNotificationActions();

  const likerId = notification.metadata?.liker_id || notification.related_user_id;
  const targetId = notification.metadata?.target_id;
  const targetType = (notification.metadata?.target_type || 'listing') as 'listing' | 'profile';

  if (!likerId) {
    return null;
  }

  const handleAccept = () => {
    acceptLike({
      notificationId: notification.id,
      likerId,
      targetId: targetId || '',
      targetType,
    });
  };

  const handleReject = () => {
    rejectLike({ notificationId: notification.id });
    onDismiss(notification.id);
  };

  const handleChat = () => {
    // Navigate to messages/conversation
    navigate('/messages');
  };

  return (
    <Card className="p-4 relative overflow-hidden border-orange-200 bg-gradient-to-r from-orange-50/50 to-red-50/50">
      <div className="absolute top-2 right-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDismiss(notification.id)}
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4 pr-8">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-white fill-white" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground">{notification.title}</h4>
              {!notification.is_read && (
                <Badge variant="secondary" className="text-xs">New</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {notification.message}
            </p>
          </div>
        </div>

        {/* Preview - Shows limited info */}
        <div>
          <LikeNotificationPreview
            likerId={likerId}
            targetType={targetType}
            targetId={targetId}
            userRole={currentUserRole}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <LikeNotificationActions
            onAccept={handleAccept}
            onReject={handleReject}
            onChat={handleChat}
            isAccepting={isAccepting}
            isRejecting={isRejecting}
            variant="stacked"
            showChat={false}
          />

          {/* Privacy Info */}
          <p className="text-xs text-muted-foreground text-center mt-1">
            Their full profile will be revealed once you accept
          </p>
        </div>
      </div>
    </Card>
  );
}
