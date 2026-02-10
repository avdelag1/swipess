import { useState } from 'react';
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
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-6 text-center">
          <Search className="w-12 h-12 mx-auto text-white/50 mb-4" />
          <p className="text-white/70">No saved filters yet</p>
          <p className="text-white/50 text-sm">
            {userRole === 'owner' 
              ? 'Save your client discovery filters for quick access' 
              : 'Save your property search filters for quick access'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {savedFilters.map((filter) => {
        const isActive = activeFilter?.id === filter.id;
        
        return (
          <Card key={filter.id} className={`bg-white/10 backdrop-blur-sm border-white/20 transition-all ${
            isActive ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-white">{filter.name}</h4>
                    {isActive && (
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        <Star className="w-3 h-3 mr-1 fill-primary" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-white/60 text-sm">
                    Saved {new Date(filter.created_at!).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!isActive && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleApplyFilter(filter.id!)}
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Apply
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteFilter(filter.id!)}
                    className="text-white/70 hover:text-red-400 hover:bg-white/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {filter.client_types && filter.client_types.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {filter.client_types.join(', ')}
                  </Badge>
                )}
                {(filter.min_budget || filter.max_budget) && (
                  <Badge variant="secondary" className="text-xs">
                    ${filter.min_budget || 0} - ${filter.max_budget || '∞'}
                  </Badge>
                )}
                {(filter.min_age || filter.max_age) && (
                  <Badge variant="secondary" className="text-xs">
                    Age {filter.min_age || 18}-{filter.max_age || 65}
                  </Badge>
                )}
                {filter.lifestyle_tags && filter.lifestyle_tags.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {filter.lifestyle_tags.length} lifestyle tags
                  </Badge>
                )}
                {filter.preferred_occupations && filter.preferred_occupations.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {filter.preferred_occupations.length} occupations
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}