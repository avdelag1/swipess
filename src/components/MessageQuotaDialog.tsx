import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles, Crown, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { useMessagingQuota } from "@/hooks/useMessagingQuota";

interface MessageQuotaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  userRole: 'client' | 'owner' | 'admin';
  showTokenBalance?: boolean;
}

export function MessageQuotaDialog({ isOpen, onClose, onUpgrade, userRole, showTokenBalance = true }: MessageQuotaDialogProps) {
  const { tokenBalance: tb, tokenType: tt } = useMessagingQuota();
  const tokenBalance = typeof tb === 'number' ? tb : 0;
  const tokenType = typeof tt === 'string' ? tt : null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-auto">
        <DialogHeader className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center"
          >
            <MessageCircle className="w-8 h-8 text-white" />
          </motion.div>
          
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {tokenBalance > 0 ? `You Have ${tokenBalance} Tokens! 🎉` : 'Start More Conversations! 💬'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-center">
          {showTokenBalance && (
            <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-lg p-4 border border-amber-500/30">
              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
                <Coins className="w-5 h-5" />
                <span className="text-lg font-bold">{tokenBalance}</span>
                <span className="text-sm">tokens remaining</span>
              </div>
              {tokenType && (
                <p className="text-xs text-muted-foreground mt-1">
                  Type: {tokenType}
                </p>
              )}
            </div>
          )}
          
          {tokenBalance > 0 ? (
            <p className="text-muted-foreground leading-relaxed">
              You have enough tokens to connect with {userRole === 'client' ? 'properties' : 'clients'}! Start a conversation now.
            </p>
          ) : (
            <p className="text-muted-foreground leading-relaxed">
              You've used all your tokens. Upgrade your plan or buy more tokens to continue connecting with {userRole === 'client' ? 'properties' : 'clients'}!
            </p>
          )}

          <div className="space-y-3">
            <Button 
              onClick={onUpgrade}
              className="w-full h-12 bg-gradient-primary hover:bg-gradient-primary/90 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              View Upgrade Options
            </Button>
            
            <Button 
              onClick={onClose}
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Maybe Later
            </Button>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="w-4 h-4" />
              Upgrade for more tokens & premium features
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}