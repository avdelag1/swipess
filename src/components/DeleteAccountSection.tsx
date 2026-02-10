import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { toast } from 'sonner';

/**
 * DeleteAccountSection Component
 *
 * Provides a user-facing UI for account deletion with:
 * - Clear warning about permanent data loss
 * - Two-step confirmation (button + dialog)
 * - Type "DELETE" to confirm pattern
 * - Loading states
 * - Error handling
 *
 * Legal Requirements:
 * - GDPR Article 17 (Right to Erasure)
 * - CCPA Section 1798.105 (Right to Delete)
 * - App Store Review Guidelines 5.1.1(v)
 */
export function DeleteAccountSection() {
  const [confirmText, setConfirmText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { deleteAccount, isDeleting, error } = useDeleteAccount();
  const navigate = useNavigate();

  const isConfirmValid = confirmText.toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmValid) {
      toast.error('Please type DELETE to confirm');
      return;
    }

    const result = await deleteAccount();

    if (result.success) {
      toast.success('Account deleted successfully', {
        description: 'Your data has been permanently removed'
      });
      // User is automatically signed out by the hook
      navigate('/', { replace: true });
    } else {
      toast.error('Failed to delete account', {
        description: result.error || 'Please try again or contact support'
      });
    }
  };

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-destructive/10 p-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-destructive">Delete Account</CardTitle>
            <CardDescription className="mt-1.5">
              Permanently delete your account and all associated data
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border border-destructive/20 bg-background p-4 space-y-2">
          <p className="text-sm font-medium text-destructive">
            This action cannot be undone. This will permanently delete:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li className="list-disc">Your profile and account information</li>
            <li className="list-disc">All your listings and property data</li>
            <li className="list-disc">Your messages and conversations</li>
            <li className="list-disc">Your matches, likes, and swipe history</li>
            <li className="list-disc">All uploaded images and files</li>
            <li className="list-disc">Your subscription and payment history</li>
          </ul>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full"
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete My Account
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4 pt-2">
                <p>
                  This action <strong>cannot be undone</strong>. All your data will be
                  permanently deleted from our servers.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete">
                    Type <strong>DELETE</strong> to confirm:
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    autoComplete="off"
                    disabled={isDeleting}
                    className="font-mono"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={!isConfirmValid || isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-xs text-center text-muted-foreground">
          Need help? Contact support before deleting your account
        </p>
      </CardContent>
    </Card>
  );
}
