import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, Check, Star } from 'lucide-react';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { Skeleton } from '@/components/ui/skeleton';

interface SavedSearchesProps {
  userRole: 'client' | 'owner';
  onApplyFilter?: (filterId: string) => void;
}

export function SavedSearches({ userRole, onApplyFilter }: SavedSearchesProps) {
  const { savedFilters, activeFilter, loading, deleteFilter, setAsActive } = useSavedFilters();

  const handleApplyFilter = async (filterId: string) => {
    await setAsActive(filterId);
    if (onApplyFilter) {
      onApplyFilter(filterId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (savedFilters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center rounded-[2.5rem] border border-border/40 bg-muted/20">
        <div className="w-20 h-20 rounded-[1.5rem] bg-muted/60 border border-border/30 flex items-center justify-center mb-6 shadow-xl">
          <Search className="w-10 h-10 text-[var(--color-brand-accent-2)]/60 animate-pulse" />
        </div>
        <p className="text-foreground font-black text-xl tracking-tight mb-3">No Saved Filters</p>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed font-medium mb-8">
          {userRole === 'owner'
            ? 'Save your client discovery filters for quick access'
            : 'Save your property search filters for quick access'}
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-8 py-4 rounded-2xl text-sm font-black text-white transition-all active:scale-95 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
        >
          {userRole === 'owner' ? 'DISCOVER CLIENTS' : 'EXPLORE LISTINGS'}
        </button>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14, filter: 'blur(4px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 380, damping: 28 } },
  };

  return (
    <motion.div className="space-y-3" initial="hidden" animate="visible" variants={containerVariants}>
      {savedFilters.map((filter) => {
        const isActive = activeFilter?.id === filter.id;

        return (
          <motion.div key={filter.id} variants={itemVariants}>
          <Card className={`bg-muted/30 border-border transition-all ${
            isActive ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{filter.name}</h4>
                    {isActive && (
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        <Star className="w-3 h-3 mr-1 fill-primary" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Saved {new Date(filter.created_at!).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!isActive && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleApplyFilter(filter.id!)}
                      className="text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Apply
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteFilter(filter.id!)}
                    className="text-muted-foreground hover:text-red-400 hover:bg-accent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const fd = (filter.filter_data || {}) as Record<string, any>;
                  return (
                    <>
                      {fd.client_types?.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {fd.client_types.join(', ')}
                        </Badge>
                      )}
                      {(fd.min_budget || fd.max_budget) && (
                        <Badge variant="secondary" className="text-xs">
                          ${fd.min_budget || 0} - ${fd.max_budget || '∞'}
                        </Badge>
                      )}
                      {(fd.min_age || fd.max_age) && (
                        <Badge variant="secondary" className="text-xs">
                          Age {fd.min_age || 18}-{fd.max_age || 65}
                        </Badge>
                      )}
                      {fd.lifestyle_tags?.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {fd.lifestyle_tags.length} lifestyle tags
                        </Badge>
                      )}
                      {fd.preferred_occupations?.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {fd.preferred_occupations.length} occupations
                        </Badge>
                      )}
                      {fd.service_categories?.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {fd.service_categories.join(', ')}
                        </Badge>
                      )}
                      {fd.work_types?.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {fd.work_types.length} work types
                        </Badge>
                      )}
                      {fd.skills?.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {fd.skills.length} skills
                        </Badge>
                      )}
                      {fd.days_available?.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {fd.days_available.length} days
                        </Badge>
                      )}
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}


