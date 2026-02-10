import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles, Crown } from "lucide-react";
import { motion } from "framer-motion";

interface MessageQuotaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  userRole: 'client' | 'owner' | 'admin';
}

export function MessageQuotaDialog({ isOpen, onClose, onUpgrade, userRole }: MessageQuotaDialogProps) {
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
            Start More Conversations! 💬
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-center">
          <p className="text-muted-foreground leading-relaxed">
            You've used all your message activations. Upgrade your plan or buy more activations to continue connecting with {userRole === 'client' ? 'properties' : 'clients'}!
          </p>

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
              Upgrade for more message activations & premium features
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}