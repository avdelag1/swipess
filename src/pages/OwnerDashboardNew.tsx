/** SPEED OF LIGHT: Owner Dashboard - Direct Client Cards */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useSmartClientMatching } from '@/hooks/useSmartMatching';
import { useStartConversation } from '@/hooks/useConversations';
import { toast as sonnerToast } from 'sonner';
import { Search, RefreshCw, MessageCircle, Heart, User, MapPin, DollarSign, Home, Car, Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

function ClientCard({ client, onLike, onMessage }: { client: any; onLike: () => void; onMessage: () => void }) {
  const mainImage = client.images?.[0];
  
  const budgetText = client.budget_min && client.budget_max
    ? `$${client.budget_min.toLocaleString()} - $${client.budget_max.toLocaleString()}`
    : client.budget_max ? `Up to $${client.budget_max.toLocaleString()}` : null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-black/50 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10">
      <div className="relative h-64 bg-gradient-to-br from-purple-900/30 to-blue-900/30">
        {mainImage ? <img src={mainImage} alt={client.full_name || 'Client'} className="w-full h-full object-cover" /> : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center"><User className="w-12 h-12 text-white/30" /></div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-2xl font-bold text-white">{client.full_name || 'Anonymous'}</h3>
          {client.city && <div className="flex items-center gap-1 text-white/60 mt-1"><MapPin className="w-4 h-4" /><span>{client.city}</span></div>}
        </div>
      </div>
      <div className="p-4 space-y-3">
        {budgetText && (
          <div className="flex items-center gap-2 text-white bg-white/5 rounded-lg p-3">
            <div className="p-1.5 bg-green-500/20 rounded-md"><DollarSign className="w-4 h-4 text-green-400" /></div>
            <span className="font-medium">{budgetText}<span className="text-white/50">/month</span></span>
          </div>
        )}
        <div className="flex gap-2">
          <Button onClick={onLike} variant="outline" className="flex-1 border-white/20 hover:bg-white/10 h-12"><Heart className="w-5 h-5 mr-2" />Like</Button>
          <Button onClick={onMessage} className="flex-1 bg-white text-black hover:bg-white/90 h-12 font-semibold"><MessageCircle className="w-5 h-5 mr-2" />Message</Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function OwnerDashboardNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: clients = [], isLoading, error, refetch, isRefetching } = useSmartClientMatching(user?.id, undefined, 0, 50, false);
  const startConversation = useStartConversation();

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter((c: any) => c.full_name?.toLowerCase().includes(query) || c.city?.toLowerCase().includes(query));
  }, [clients, searchQuery]);

  const handleRefresh = async () => { setIsRefreshing(true); await refetch(); setIsRefreshing(false); };

  const handleLike = (clientId: string) => {
    sonnerToast.success('Liked!', { description: 'Client added to your likes' });
  };

  const handleMessage = async (clientId: string) => {
    sonnerToast.loading('Starting conversation...');
    const result = await startConversation.mutateAsync({ otherUserId: clientId, initialMessage: "Hi! I'd like to connect.", canStartNewConversation: true });
    if (result?.conversationId) { sonnerToast.dismiss(); navigate(`/messages?conversationId=${result.conversationId}`); }
  };

  const handleView = (clientId: string) => { navigate(`/owner/view-client/${clientId}`); };

  return (
    <div className="h-full flex flex-col bg-black">
      <div style={{ backgroundColor: '#ff0000', padding: '20px', color: 'white', fontWeight: 'bold', fontSize: '18px', lineHeight: '1.8' }}>
        <div>🔴 OWNER DASHBOARD DEBUG</div>
        <div>User ID: {user?.id || 'NO USER - NOT LOGGED IN'}</div>
        <div>Clients Loaded: {clients?.length || 0}</div>
        <div>Filtered Clients: {filteredClients?.length || 0}</div>
        <div>Loading: {isLoading ? 'YES' : 'NO'}</div>
        <div>Error: {error?.message || 'NONE'}</div>
      </div>

      <div className="flex-shrink-0 p-4 border-b border-white/10 bg-black/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Discover Clients</h1>
            <p className="text-white/50 text-sm">{filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} to connect with</p>
          </div>
          <Button onClick={handleRefresh} variant="secondary" className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600" disabled={isLoading || isRefetching}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input placeholder="Search by name or city..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-black/50 rounded-3xl overflow-hidden border border-white/10 animate-pulse">
                <div className="h-64 bg-white/10" />
                <div className="p-4 space-y-3"><div className="h-6 w-3/4 bg-white/10 rounded" /><div className="h-4 w-1/2 bg-white/10 rounded" /><div className="h-12 w-full bg-white/10 rounded mt-4" /></div>
              </div>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4"><User className="w-10 h-10 text-white/20" /></div>
            <h3 className="text-xl font-semibold text-white mb-2">No Clients Found</h3>
            <p className="text-white/50 text-sm">{searchQuery ? 'Try adjusting your search' : 'No client profiles available'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
            <AnimatePresence mode="popLayout">
              {filteredClients.map((client: any) => (
                <ClientCard key={client.user_id || client.id} client={client} onLike={() => handleLike(client.user_id || client.id)} onMessage={() => handleMessage(client.user_id || client.id)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
