import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Shield, Lock, Smartphone, Eye, EyeOff, AlertTriangle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSecuritySettings } from '@/hooks/useSecuritySettings';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/prodLogger';
import { motion, AnimatePresence } from 'framer-motion';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

interface AccountSecurityProps {
  userRole: 'client' | 'owner';
}

export function AccountSecurity({ userRole }: AccountSecurityProps) {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { isLight } = useAppTheme();
  
  const {
    settings,
    updateSettings,
    isLoading: settingsLoading
  } = useSecuritySettings();

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync local state with database settings
  const [localSettings, setLocalSettings] = useState({
    two_factor_enabled: false,
    login_alerts: true,
    session_timeout: true,
    device_tracking: true
  });

  useEffect(() => {
    if (settings) {
      const s = settings as any;
      setLocalSettings({
        two_factor_enabled: s.two_factor_enabled ?? false,
        login_alerts: s.login_alerts ?? true,
        session_timeout: s.session_timeout ?? true,
        device_tracking: s.device_tracking ?? true
      });
    }
  }, [settings]);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Validation Error', { description: 'Please fill in all fields.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Validation Error', { description: 'New passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        toast.error('Security Alert', { description: 'Current password verification failed.' });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success('Security Updated', { description: 'Your access credentials have been successfully rotated.' });
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      logger.error('Password change error:', error);
      toast.error('Error', { description: error.message || 'Failed to update credentials.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const toggleSetting = (key: keyof typeof localSettings) => {
    const newValue = !localSettings[key];
    setLocalSettings(prev => ({ ...prev, [key]: newValue }));
    updateSettings({ [key]: newValue });
  };

  const securityScore = () => {
    let score = 50;
    if (localSettings.two_factor_enabled) score += 25;
    if (localSettings.login_alerts) score += 10;
    if (localSettings.session_timeout) score += 10;
    if (localSettings.device_tracking) score += 5;
    return score;
  };

  const SettingRow = ({ icon: Icon, title, description, checked, onToggle, disabled }: any) => (
    <div className={cn(
      "flex items-center justify-between p-6 rounded-[1.8rem] transition-all border",
      isLight ? "bg-black/[0.02] border-black/5" : "bg-white/[0.02] border-white/5"
    )}>
      <div className="flex items-center gap-5">
        <div className={cn(
          "w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all border",
          isLight ? "bg-white/50 border-black/5" : "bg-black/50 border-white/5"
        )}>
          <Icon className="w-5 h-5 opacity-70" />
        </div>
        <div className="space-y-0.5">
          <h4 className={cn("text-[14px] font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>{title}</h4>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{description}</p>
        </div>
      </div>
      <Switch 
        checked={checked} 
        onCheckedChange={onToggle} 
        disabled={disabled}
        className={cn(
          "data-[state=checked]:bg-rose-500",
          !isLight && "bg-white/10"
        )}
      />
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Security Health */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-rose-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 italic">Security Status</span>
           </div>
           <span className={cn("text-xl font-black italic", securityScore() >= 80 ? "text-rose-500" : "text-violet-500")}>
             {securityScore()}% SECURE
           </span>
        </div>
        
        <div className={cn("w-full h-1.5 rounded-full overflow-hidden", isLight ? "bg-black/5" : "bg-white/5")}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${securityScore()}%` }}
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              securityScore() >= 80 ? "bg-rose-500 shadow-[0_0_15px_rgba(235,72,152,0.4)]" : "bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.4)]"
            )}
          />
        </div>
      </div>

      <div className="space-y-4">
        <SettingRow 
          icon={Smartphone} 
          title="2FA Protocol" 
          description="Biometric & Device Verification" 
          checked={localSettings.two_factor_enabled}
          onToggle={() => toggleSetting('two_factor_enabled')}
        />
        
        <SettingRow 
          icon={Shield} 
          title="Login Alerts" 
          description="Neural Intrusion Detection" 
          checked={localSettings.login_alerts}
          onToggle={() => toggleSetting('login_alerts')}
        />

        <Button 
          variant="ghost" 
          className={cn(
            "w-full h-20 rounded-[2rem] px-6 justify-between transition-all border",
            isLight ? "bg-black/[0.02] border-black/5 hover:bg-black/[0.04]" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
          )}
          onClick={() => setShowPasswordDialog(true)}
        >
          <div className="flex items-center gap-5">
            <div className={cn(
              "w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all border",
              isLight ? "bg-white/50 border-black/5" : "bg-black/50 border-white/5"
            )}>
              <Lock className="w-5 h-5 opacity-70" />
            </div>
            <div className="text-left space-y-0.5">
              <h4 className={cn("text-[14px] font-black uppercase italic tracking-tight", isLight ? "text-black" : "text-white")}>Access Key</h4>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Rotate your security credentials</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 opacity-20" />
        </Button>
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-md">
          <div className={cn(
            "m-4 rounded-[3rem] backdrop-blur-[50px] border p-10 overflow-hidden shadow-3xl",
            isLight ? "bg-white/95 border-black/5" : "bg-black/95 border-white/5"
          )}>
            <div className="space-y-8">
              <div className="space-y-2">
                 <h3 className={cn("text-2xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>Rotate Credentials</h3>
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Confirm identity to modify access</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPasswords ? "text" : "password"}
                    placeholder="CURRENT PROTOCOL"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={cn(
                      "h-16 rounded-2xl px-6 font-bold text-sm transition-all",
                      isLight ? "bg-black/[0.03] border-black/10" : "bg-white/[0.03] border-white/10"
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                <Input
                  type={showPasswords ? "text" : "password"}
                  placeholder="NEW PROTOCOL"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={cn(
                    "h-16 rounded-2xl px-6 font-bold text-sm transition-all",
                    isLight ? "bg-black/[0.03] border-black/10" : "bg-white/[0.03] border-white/10"
                  )}
                />

                <Input
                  type={showPasswords ? "text" : "password"}
                  placeholder="CONFIRM NEW PROTOCOL"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "h-16 rounded-2xl px-6 font-bold text-sm transition-all",
                    isLight ? "bg-black/[0.03] border-black/10" : "bg-white/[0.03] border-white/10"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPasswordDialog(false)}
                  className={cn("h-14 rounded-xl font-bold uppercase tracking-widest opacity-60", isLight ? "border-black/10" : "border-white/10")}
                >
                  Abord
                </Button>
                <Button 
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword}
                  className="h-14 rounded-xl bg-black text-white dark:bg-white dark:text-black font-black uppercase italic tracking-widest shadow-2xl"
                >
                  {isChangingPassword ? 'Syncing...' : 'Update'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
