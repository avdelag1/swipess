import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, X, Send, Bug, DollarSign, User, Home, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

interface SupportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'client' | 'owner' | 'admin';
}

export function SupportDialog({ isOpen, onClose, userRole }: SupportDialogProps) {
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    category: 'general' as const,
    priority: 'medium' as const,
  });

  const queryClient = useQueryClient();
  const { isLight } = useAppTheme();

  // Fetch user's support tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['user-support-tickets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  // Create new ticket
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: typeof newTicket) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: ticketData.subject,
          message: ticketData.message,
          category: ticketData.category || 'general',
          priority: ticketData.priority || 'medium',
          user_email: user.email || '',
          user_role: userRole,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-support-tickets'] });
      setNewTicket({
        subject: '',
        message: '',
        category: 'general',
        priority: 'medium',
      });
      toast.success("Support ticket created", {
        description: "We'll respond to your inquiry as soon as possible via email.",
      });
    },
    onError: (error) => {
      logger.error('Error creating ticket:', error);
      toast.error("Error", {
        description: "Failed to create support ticket. Please try again.",
      });
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return Bug;
      case 'billing': return DollarSign;
      case 'account': return User;
      case 'property': return Home;
      case 'matching': return MessageCircle;
      default: return Info;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 text-red-500';
      case 'low': return 'bg-violet-500/10 text-violet-500';
      case 'medium': return 'bg-amber-500/10 text-amber-500';
      case 'high': return 'bg-rose-500/10 text-rose-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-violet-500/10 text-violet-500';
      case 'in_progress': return 'bg-amber-500/10 text-amber-500';
      case 'resolved': return 'bg-rose-500/10 text-rose-500';
      case 'closed': return 'bg-gray-500/10 text-gray-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const handleCreateTicket = () => {
    if (newTicket.subject.trim() && newTicket.message.trim()) {
      createTicketMutation.mutate(newTicket);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className={cn(
          "w-full max-w-2xl backdrop-blur-[40px] rounded-[3rem] shadow-3xl overflow-hidden border transition-all duration-700",
          isLight ? "bg-white/90 border-black/5" : "bg-black/90 border-white/5"
        )}
      >
        <div className="p-10 pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-500 italic">Neural Support</span>
              </div>
              <h2 className={cn("text-3xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>Customer Sync</h2>
              <p className="text-sm font-medium opacity-70 leading-relaxed pt-1">
                Access help for account protocols, liquidations, or neural glitches.
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className={cn("w-12 h-12 rounded-2xl transition-all", isLight ? "bg-black/5 hover:bg-black/10" : "bg-white/5 hover:bg-white/10")}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-10 pt-0 space-y-10 max-h-[70vh] overflow-y-auto scrollbar-hide pb-20">
          {/* Create New Ticket */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-70 italic">New Protocol</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-muted-foreground/10 to-transparent" />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={newTicket.category}
                  onValueChange={(value: any) => setNewTicket(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className={cn(
                    "h-14 rounded-2xl px-5 font-bold uppercase text-[11px] tracking-widest transition-all",
                    isLight ? "bg-black/[0.03] border-black/10" : "bg-white/[0.03] border-white/10"
                  )}>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className={cn("rounded-2xl backdrop-blur-xl", isLight ? "bg-white/95 border-black/10" : "bg-black/95 border-white/10")}>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="matching">Matching</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={newTicket.priority}
                  onValueChange={(value: any) => setNewTicket(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className={cn(
                    "h-14 rounded-2xl px-5 font-bold uppercase text-[11px] tracking-widest transition-all",
                    isLight ? "bg-black/[0.03] border-black/10" : "bg-white/[0.03] border-white/10"
                  )}>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className={cn("rounded-2xl backdrop-blur-xl", isLight ? "bg-white/95 border-black/10" : "bg-black/95 border-white/10")}>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Input
                placeholder="SUBJECT PROTOCOL"
                value={newTicket.subject}
                onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                className={cn(
                  "h-16 rounded-[1.5rem] px-6 font-bold text-sm placeholder:opacity-20 transition-all",
                  isLight ? "bg-black/[0.03] border-black/10" : "bg-white/[0.03] border-white/10"
                )}
              />
              
              <Textarea
                placeholder="Describe your issue in detail..."
                value={newTicket.message}
                onChange={(e) => setNewTicket(prev => ({ ...prev, message: e.target.value }))}
                className={cn(
                  "min-h-[160px] rounded-[1.5rem] p-6 font-medium placeholder:opacity-20 resize-none transition-all",
                  isLight ? "bg-black/[0.03] border-black/10" : "bg-white/[0.03] border-white/10"
                )}
              />
              
              <Button
                onClick={handleCreateTicket}
                disabled={!newTicket.subject.trim() || !newTicket.message.trim() || createTicketMutation.isPending}
                className="w-full h-16 rounded-[1.8rem] bg-purple-600 hover:bg-purple-500 text-white font-black uppercase italic tracking-widest shadow-2xl transition-all disabled:opacity-70"
              >
                <Send className="h-5 w-5 mr-3" />
                {createTicketMutation.isPending ? 'Syncing...' : 'Initiate Ticket'}
              </Button>
            </div>
          </div>

          {/* Previous Tickets */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-70 italic">Active Logs</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-muted-foreground/10 to-transparent" />
            </div>
            
            {ticketsLoading ? (
              <div className="text-center py-12 opacity-70 text-[10px] font-black uppercase tracking-widest">
                Retrieving data...
              </div>
            ) : tickets?.length === 0 ? (
              <div className="text-center py-12 opacity-70 text-[10px] font-black uppercase tracking-widest">
                No active protocols.
              </div>
            ) : (
              <div className="space-y-4">
                {tickets?.map((ticket: any) => {
                  const CategoryIcon = getCategoryIcon(ticket.category);
                  return (
                    <div key={ticket.id} className={cn(
                      "p-6 rounded-[1.8rem] border transition-all group",
                      isLight ? "bg-black/[0.03] border-black/5 hover:bg-black/[0.06]" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
                    )}>
                      <div className="flex items-start gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-[1rem] border flex items-center justify-center flex-shrink-0 transition-all",
                          isLight ? "bg-white/50 border-black/5" : "bg-black/50 border-white/5"
                        )}>
                           <CategoryIcon className="h-5 w-5 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={cn("text-[14px] font-black uppercase italic tracking-tight mb-1 truncate", isLight ? "text-black" : "text-white")}>{ticket.subject}</h4>
                          <p className="text-[11px] font-medium opacity-70 line-clamp-2 leading-relaxed">
                            {ticket.message}
                          </p>
                          <div className="flex items-center gap-3 mt-4">
                            <div className={cn(
                              "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                              getStatusColor(ticket.status)
                            )}>
                              {ticket.status.replace('_', ' ')}
                            </div>
                            <div className={cn(
                              "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                              getPriorityColor(ticket.priority)
                            )}>
                              {ticket.priority}
                            </div>
                            <div className={cn("flex-1 h-px", isLight ? "bg-black/5" : "bg-white/5")} />
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-20 italic">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className={cn(
            "p-8 rounded-[2rem] border relative overflow-hidden transition-all",
            isLight ? "bg-black/[0.02] border-black/5" : "bg-white/[0.02] border-white/5"
          )}>
             <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-purple-500/10 blur-[40px] rounded-full pointer-events-none" />
             <h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-3 italic">Emergency Relay</h4>
             <p className="text-[12px] font-medium opacity-70 leading-relaxed mb-4">
               For high-priority matrix failures, contact our direct uplink:
             </p>
             <div className="space-y-2">
               <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", isLight ? "bg-black/5" : "bg-white/5")}>
                     <MessageCircle className="w-3.5 h-3.5 opacity-70" />
                  </div>
                  <p className={cn("text-[13px] font-black italic tracking-tight", isLight ? "text-black" : "text-white")}>support@swipess.app</p>
               </div>
               <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-20 italic pl-11">24h Response Protocol</p>
             </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
