
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/utils/prodLogger";

interface OwnerSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OwnerSettingsDialog({ open, onOpenChange }: OwnerSettingsDialogProps) {
  const [notifications, setNotifications] = useState(true);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to delete your account.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted.',
      });

      // Sign out after successful deletion
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } catch (error: any) {
      logger.error('Delete account error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white/10 backdrop-blur border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle>Owner Settings</DialogTitle>
          <DialogDescription className="text-white/70">
            Manage your account preferences and notification settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="space-y-1">
              <span className="font-medium">Email Notifications</span>
              <p className="text-sm text-white/60">Receive updates about new client applications and messages</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          {/* Danger Zone */}
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-semibold">Danger Zone</h3>
              </div>
              <p className="text-sm text-white/70">
                Once you delete your account, there is no going back. This will permanently delete your profile, listings, messages, and all associated data.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Delete Account Permanently
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-background border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
