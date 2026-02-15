// @ts-nocheck
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Loader2, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAIGeneration } from '@/hooks/ai/useAIGeneration';
import { toast } from 'sonner';

interface AISearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'client' | 'owner';
}

export function AISearchDialog({ isOpen, onClose, userRole = 'client' }: AISearchDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    parsedFilters: Record<string, any>;
    suggestion: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { generate } = useAIGeneration();

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setSearchResult(null);

    try {
      const result = await generate('search', {
        query: query.trim(),
        userRole,
      });

      if (result) {
        setSearchResult({
          parsedFilters: result as any,
          suggestion: (result as any).suggestion || 'Processing your search...',
        });
        
        setTimeout(() => {
          navigateToFilters((result as any));
        }, 1500);
      }
    } catch (error) {
      console.error('AI search error:', error);
      toast.error('Failed to process search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [query, isSearching, userRole, generate, navigate]);

  const navigateToFilters = (result: Record<string, any>) => {
    const params = new URLSearchParams();
    
    if (result.category) params.set('category', result.category);
    if (result.priceMin) params.set('priceMin', result.priceMin.toString());
    if (result.priceMax) params.set('priceMax', result.priceMax.toString());
    if (result.keywords && result.keywords.length > 0) {
      params.set('keywords', result.keywords.join(','));
    }

    const filterPath = userRole === 'owner' ? '/owner/filters' : '/client/filters';
    navigate(`${filterPath}?${params.toString()}`);
    onClose();
    setQuery('');
    setSearchResult(null);
  };

  const handleClose = () => {
    onClose();
    setQuery('');
    setSearchResult(null);
  };

  const quickPrompts = [
    "Find apartments under $5000",
    "Red motorcycle in Cancun",
    "Mountain bike for rent",
    "Electrician near downtown",
  ];

  const applyQuickPrompt = (prompt: string) => {
    setQuery(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-[#1C1C1E]/95 backdrop-blur-xl border border-white/10">
        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-orange-500" />
            AI Search
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Describe what you're looking for..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-20 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              disabled={isSearching}
            />
            {query && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <Button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            className={cn(
              "w-full h-12 rounded-xl transition-all duration-200",
              "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Search with AI
              </>
            )}
          </Button>

          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl"
              >
                <div className="flex items-center gap-2 text-orange-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="text-sm">AI is analyzing your request...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {searchResult && !isSearching && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
              >
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Search complete!</span>
                </div>
                <p className="text-sm text-white/70">{searchResult.suggestion}</p>
                <Badge className="mt-2 bg-white/10 text-white border-0">
                  Opening filters...
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>

          {!query && !isSearching && (
            <div className="space-y-2">
              <p className="text-xs text-white/50 uppercase tracking-wider">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => applyQuickPrompt(prompt)}
                    className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
