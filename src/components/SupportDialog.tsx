import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, HelpCircle, X, Send, Bug, DollarSign, User, Home, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

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
      toast({
        title: "Support ticket created",
        description: "We'll respond to your inquiry as soon as possible via email.",
      });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        logger.error('Error creating ticket:', error);
      }
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive",
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
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl bg-background rounded-lg shadow-xl overflow-hidden"
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Customer Support</h2>
              <p className="text-sm text-muted-foreground">
                Get help with your account, billing, or technical issues
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Create New Ticket */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Create Support Ticket</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={newTicket.category}
                  onValueChange={(value: any) => setNewTicket(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Input
                placeholder="Subject"
                value={newTicket.subject}
                onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
              />
              
              <Textarea
                placeholder="Describe your issue in detail..."
                value={newTicket.message}
                onChange={(e) => setNewTicket(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
              
              <Button
                onClick={handleCreateTicket}
                disabled={!newTicket.subject.trim() || !newTicket.message.trim() || createTicketMutation.isPending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </Card>

          {/* Previous Tickets */}
          <div>
            <h3 className="font-semibold mb-4">Your Support Tickets</h3>
            
            {ticketsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading tickets...
              </div>
            ) : tickets?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No support tickets yet. Create one above if you need help.
              </div>
            ) : (
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {tickets?.map((ticket: any) => {
                    const CategoryIcon = getCategoryIcon(ticket.category);
                    return (
                      <Card key={ticket.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <CategoryIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{ticket.subject}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {ticket.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
                                {ticket.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Contact Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Need immediate assistance?</h4>
            <p className="text-sm text-muted-foreground">
              For urgent issues, you can also reach out to us directly:
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-sm">📧 support@propertyapp.com</p>
              <p className="text-sm">🔔 We typically respond within 24 hours</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}