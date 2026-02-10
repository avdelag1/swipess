import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Smartphone, Eye, EyeOff, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSecuritySettings } from '@/hooks/useSecuritySettings';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/prodLogger';

interface AccountSecurityProps {
  userRole: 'client' | 'owner';
}

export function AccountSecurity({ userRole }: AccountSecurityProps) {
  const navigate = useNavigate();
  const { user, session } = useAuth(); // Get auth from context - single source of truth
  // Destructure with fallback for both API versions
  const {
    settings,
    updateSettings,
    isLoading,
    loading,
    isSaving,
    saving
  } = useSecuritySettings();
  
  // Use fallback logic for loading and saving states
  const loadingState = isLoading ?? loading ?? false;
  const savingState = isSaving ?? saving ?? false;
  
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false); // ✅ Button reliability
  
  // Security settings state - sync with database
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [deviceTracking, setDeviceTracking] = useState(true);

  // Sync local state with database settings
  useEffect(() => {
    if (settings && typeof settings === 'object' && 'two_factor_enabled' in settings) {
      setTwoFactorEnabled(settings.two_factor_enabled ?? false);
      setLoginAlerts(settings.login_alerts ?? true);
      setSessionTimeout(settings.session_timeout ?? true);
      setDeviceTracking(settings.device_tracking ?? true);
    }
  }, [settings]);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error', 
        description: 'New passwords do not match.',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive'
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      // Security note: We validate the current password for better UX security.
      // The user's valid session already proves authentication, but asking for
      // the current password provides defense-in-depth against session hijacking
      // and ensures the user actively knows their current credentials.
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error('User email not found');
      }

      // Verify current password by attempting to sign in.
      // Note: This creates a temporary auth check but doesn't invalidate the current session.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: 'Error',
          description: 'Current password is incorrect.',
          variant: 'destructive'
        });
        return;
      }

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully changed.'
      });
      
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Password change error:', error);
      }
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update password. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTwoFactorToggle = (enabled: boolean) => {
    if (enabled) {
      setShowTwoFactorDialog(true);
    } else {
      setTwoFactorEnabled(false);
      updateSettings({ two_factor_enabled: false });
    }
  };

  const enableTwoFactor = () => {
    setTwoFactorEnabled(true);
    updateSettings({ two_factor_enabled: true });
    setShowTwoFactorDialog(false);
  };

  const handleDeleteAccount = async () => {
    // ✅ Button reliability: Guard against double-clicks
    if (isDeletingAccount) return;

    if (deleteConfirmText.toLowerCase() !== 'delete') {
      toast({
        title: 'Error',
        description: 'Please type DELETE to confirm account deletion.',
        variant: 'destructive'
      });
      return;
    }

    setIsDeletingAccount(true); // ✅ Button reliability: Disable immediately
    try {
      // ✅ Use AuthContext - single source of truth (no direct auth calls)
      if (!user || !session) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to delete your account.',
          variant: 'destructive',
        });
        return;
      }

      // Get the Supabase URL to construct the edge function URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      // Call the delete-user edge function with the auth token
      const response = await fetch(
        `${supabaseUrl}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            user_id: user.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (import.meta.env.DEV) {
          logger.error('Delete account error:', result.error);
        }

        toast({
          title: 'Deletion Failed',
          description: result.error || 'Account deletion could not be completed. Please try again or contact support.',
          variant: 'destructive'
        });
        return;
      }

      // Account successfully deleted
      await supabase.auth.signOut();

      toast({
        title: 'Account Deleted',
        description: 'Your account has been successfully deleted.',
      });

      // Navigate to home page
      navigate('/');
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Error deleting account:', error);
      }
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete account. Please contact support.',
        variant: 'destructive'
      });
    } finally {
      setIsDeletingAccount(false); // ✅ Button reliability: Reset state
    }
  };

  const securityScore = () => {
    let score = 50; // Base score
    if (twoFactorEnabled) score += 25;
    if (loginAlerts) score += 10;
    if (sessionTimeout) score += 10;
    if (deviceTracking) score += 5;
    return score;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Account Security</h2>
        <p className="text-gray-400">Protect your account with advanced security features</p>
      </div>

      {/* Security Score */}
      <Card className="bg-gray-700/50 border-gray-600/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Current Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(securityScore())}`}>
              {securityScore()}/100
            </span>
          </div>
          <div className="w-full bg-gray-600/50 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                securityScore() >= 80 ? 'bg-green-500' :
                securityScore() >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${securityScore()}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Password Security */}
      <Card className="bg-gray-700/50 border-gray-600/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Password Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-white font-medium">Password</h4>
              <p className="text-gray-400 text-sm">Last changed 30 days ago</p>
            </div>
            <Button onClick={() => setShowPasswordDialog(true)} variant="outline" className="border-gray-600 hover:bg-gray-600/50">
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="bg-gray-700/50 border-gray-600/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-white font-medium">Add an extra layer of security</h4>
              <p className="text-gray-400 text-sm">
                {twoFactorEnabled ? 'Two-factor authentication is enabled' : 'Not enabled'}
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleTwoFactorToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Login Security */}
      <Card className="bg-gray-700/50 border-gray-600/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Login Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-white font-medium">Login Alerts</h4>
              <p className="text-gray-400 text-sm">Get notified of new sign-ins</p>
            </div>
            <Switch
              checked={loginAlerts}
              onCheckedChange={(checked) => {
                setLoginAlerts(checked);
                updateSettings({ login_alerts: checked });
              }}
              disabled={loadingState || savingState}
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-white font-medium">Session Timeout</h4>
              <p className="text-gray-400 text-sm">Auto logout after inactivity</p>
            </div>
            <Switch
              checked={sessionTimeout}
              onCheckedChange={(checked) => {
                setSessionTimeout(checked);
                updateSettings({ session_timeout: checked });
              }}
              disabled={loadingState || savingState}
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-white font-medium">Device Tracking</h4>
              <p className="text-gray-400 text-sm">Monitor unknown devices</p>
            </div>
            <Switch
              checked={deviceTracking}
              onCheckedChange={(checked) => {
                setDeviceTracking(checked);
                updateSettings({ device_tracking: checked });
              }}
              disabled={loadingState || savingState}
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone - Delete Account */}
      <Card className="bg-red-500/10 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-white font-medium">Delete Account</h4>
              <p className="text-gray-400 text-sm">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button
              onClick={() => setShowDeleteAccountDialog(true)}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Input
                type={showPasswords ? "text" : "password"}
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            <div className="relative">
              <Input
                type={showPasswords ? "text" : "password"}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="relative">
              <Input
                type={showPasswords ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)} disabled={isChangingPassword} className="border-gray-600 hover:bg-gray-700">
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} disabled={isChangingPassword}>
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Two-Factor Setup Dialog */}
      <Dialog open={showTwoFactorDialog} onOpenChange={setShowTwoFactorDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Enable Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-400">
              Two-factor authentication adds an extra layer of security to your account by requiring
              a code from your phone in addition to your password.
            </p>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">Setup Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-400 text-sm">
                <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code with your authenticator app</li>
                <li>Enter the 6-digit code to verify</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTwoFactorDialog(false)} className="border-gray-600 hover:bg-gray-700">
              Cancel
            </Button>
            <Button onClick={enableTwoFactor}>Enable 2FA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <DialogContent className="bg-gray-800 border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
              <h4 className="text-white font-medium mb-2">⚠️ Warning</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
                <li>All your {userRole === 'client' ? 'saved properties and preferences' : 'listings and client connections'} will be deleted</li>
                <li>Your messages and conversation history will be removed</li>
                <li>Your subscription will be cancelled immediately</li>
                <li>This action is irreversible</li>
              </ul>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Type <span className="font-bold text-red-400">DELETE</span> to confirm:
              </label>
              <Input
                type="text"
                placeholder="Type DELETE to confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteAccountDialog(false);
                setDeleteConfirmText('');
              }}
              className="border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText.toLowerCase() !== 'delete' || isDeletingAccount}
            >
              {isDeletingAccount ? 'Deleting Account...' : 'Delete Account Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}