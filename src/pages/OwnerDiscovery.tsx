import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function OwnerDiscovery() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen fixed inset-0 z-[50] bg-black flex flex-col items-center justify-center p-8 text-center">
       <div className="mb-10 opacity-20">
          <Sparkles className="w-16 h-16 text-[#EB4898]" />
       </div>
       <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-4">Discovery Redirected</h1>
       <p className="text-[11px] font-black uppercase tracking-widest text-white/40 mb-12 max-w-xs">The scouting radar has been taken offline for structural recalibration.</p>
       <Button 
         onClick={() => navigate('/owner/dashboard')}
         className="w-full max-w-xs h-16 rounded-[2rem] bg-white text-black font-black uppercase italic tracking-widest shadow-2xl active:scale-95"
       >
         <ArrowLeft className="w-5 h-5 mr-3" /> Return to Dashboard
       </Button>
    </div>
  );
}
