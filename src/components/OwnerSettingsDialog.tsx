import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, ExternalLink, FileText, X, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { AccountSecurity } from "./AccountSecurity";
import useAppTheme from "@/hooks/useAppTheme";
import { cn } from "@/lib/utils";

interface OwnerSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OwnerSettingsDialog({ open, onOpenChange }: OwnerSettingsDialogProps) {
  const navigate = useNavigate();
  const { isLight } = useAppTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="max-w-2xl p-0 border-none bg-transparent shadow-none">
        <div className={cn(
          "m-4 rounded-[3rem] backdrop-blur-[40px] border overflow-hidden shadow-3xl transition-all duration-700",
          isLight ? "bg-white/80 border-black/5" : "bg-black/80 border-white/5"
        )}>
          {/* Header */}
          <div className="p-10 pb-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-500 italic">Owner Config</span>
                </div>
                <h2 className={cn("text-4xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>System Settings</h2>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)}
                className={cn("w-12 h-12 rounded-2xl transition-all", isLight ? "bg-black/5 hover:bg-black/10" : "bg-white/5 hover:bg-white/10")}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="p-10 pt-0 space-y-10 max-h-[70vh] overflow-y-auto scrollbar-hide pb-20">
            {/* Security Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-70 italic">Identity Protocol</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-muted-foreground/10 to-transparent" />
              </div>

              <div className={cn(
                "rounded-[2rem] p-6 backdrop-blur-2xl transition-all duration-500",
                isLight ? "bg-black/[0.02]" : "bg-white/[0.02]"
              )}>
                <AccountSecurity userRole="owner" />
              </div>
            </div>

            {/* Legal Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-70 italic">Legal & Privacy</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-muted-foreground/10 to-transparent" />
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant="ghost" 
                  className={cn(
                    "justify-between h-16 rounded-[1.5rem] px-6 text-sm font-black uppercase italic tracking-tight transition-all",
                    isLight ? "bg-black/[0.03] hover:bg-black/[0.06]" : "bg-white/[0.03] hover:bg-white/[0.06]"
                  )}
                  onClick={() => { onOpenChange(false); navigate('/legal'); }}
                >
                  <div className="flex items-center gap-4">
                    <FileText className="w-5 h-5 opacity-70" />
                    <span>Terms of Protocol</span>
                  </div>
                  <ExternalLink className="w-4 h-4 opacity-20" />
                </Button>

                <Button 
                  variant="ghost" 
                  className={cn(
                    "justify-between h-16 rounded-[1.5rem] px-6 text-sm font-black uppercase italic tracking-tight transition-all",
                    isLight ? "bg-black/[0.03] hover:bg-black/[0.06]" : "bg-white/[0.03] hover:bg-white/[0.06]"
                  )}
                  onClick={() => { onOpenChange(false); navigate('/legal'); }}
                >
                  <div className="flex items-center gap-4">
                    <Shield className="w-5 h-5 opacity-70" />
                    <span>Privacy Logs</span>
                  </div>
                  <ExternalLink className="w-4 h-4 opacity-20" />
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-destructive opacity-70 italic">Termination Protocol</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-destructive/10 to-transparent" />
              </div>
              <div className={cn(
                "rounded-[2rem] p-6 backdrop-blur-2xl transition-all duration-500",
                isLight ? "bg-red-500/[0.02]" : "bg-red-500/[0.04]"
              )}>
                <DeleteAccountSection />
              </div>
            </div>

            {/* Footer info */}
            <div className="flex flex-col items-center pt-4 opacity-20">
               <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">Swipess industries • v3.3.1</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
