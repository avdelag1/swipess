/**
 * OWNER FILTERS PAGE - SIMPLE & WORKING
 * 
 * A clean filter page for owners to filter client profiles
 * that properly updates the filterStore and triggers query refresh
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Users, User, Briefcase, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { ClientGender, ClientType } from '@/types/filters';

const genderOptions: { id: ClientGender; label: string; description: string }[] = [
  { id: 'any', label: 'All Genders', description: 'Show everyone' },
  { id: 'female', label: 'Women', description: 'Female clients' },
  { id: 'male', label: 'Men', description: 'Male clients' },
];

const clientTypeOptions: { id: ClientType; label: string; description: string }[] = [
  { id: 'all', label: 'All Types', description: 'All clients' },
  { id: 'hire', label: 'Hiring Services', description: 'Looking to hire' },
  { id: 'rent', label: 'Renting', description: 'Looking to rent' },
  { id: 'buy', label: 'Buying', description: 'Looking to buy' },
];

export default function OwnerFilters() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Get current filters from store
  const storeGender = useFilterStore((state) => state.clientGender);
  const storeClientType = useFilterStore((state) => state.clientType);
  const setClientGender = useFilterStore((state) => state.setClientGender);
  const setClientType = useFilterStore((state) => state.setClientType);
  const resetOwnerFilters = useFilterStore((state) => state.resetOwnerFilters);
  
  // Local state initialized from store
  const [selectedGender, setSelectedGender] = useState<ClientGender>(storeGender);
  const [selectedClientType, setSelectedClientType] = useState<ClientType>(storeClientType);
  
  // Count active filters
  const activeFilterCount = 
    (selectedGender !== 'any' ? 1 : 0) + 
    (selectedClientType !== 'all' ? 1 : 0);
  
  const handleApply = useCallback(() => {
    // Update filter store
    setClientGender(selectedGender);
    setClientType(selectedClientType);
    
    // Invalidate queries to force refresh with new filters
    queryClient.invalidateQueries({ queryKey: ['smart-clients'] });
    queryClient.invalidateQueries({ queryKey: ['owner-interested-clients'] });
    
    // Navigate back
    navigate(-1);
  }, [selectedGender, selectedClientType, setClientGender, setClientType, queryClient, navigate]);
  
  const handleReset = useCallback(() => {
    setSelectedGender('any');
    setSelectedClientType('all');
    resetOwnerFilters();
  }, [resetOwnerFilters]);
  
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Who I'm Looking For</h1>
                <p className="text-xs text-muted-foreground">
                  {activeFilterCount > 0 
                    ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`
                    : 'Filter client profiles'
                  }
                </p>
              </div>
            </div>
            
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          
          {/* Gender */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="w-4 h-4" />
                Gender
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              {genderOptions.map((option) => {
                const isSelected = selectedGender === option.id;
                return (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedGender(option.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center mb-2",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {isSelected ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Users className="w-5 h-5" />
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {option.label}
                    </span>
                  </motion.button>
                );
              })}
            </CardContent>
          </Card>

          {/* Client Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Briefcase className="w-4 h-4" />
                Looking For
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {clientTypeOptions.map((option) => {
                const isSelected = selectedClientType === option.id;
                return (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedClientType(option.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {isSelected ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Briefcase className="w-5 h-5" />
                        )}
                      </div>
                      <div className="text-left">
                        <span className={cn(
                          "block font-medium",
                          isSelected ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {option.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </CardContent>
          </Card>

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">
                    {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {activeFilterCount === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Set filters to find your ideal clients
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer - Apply Button */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-4">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleApply}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {activeFilterCount === 0 
              ? 'Show All Clients' 
              : `Apply ${activeFilterCount} Filter${activeFilterCount > 1 ? 's' : ''}`
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
