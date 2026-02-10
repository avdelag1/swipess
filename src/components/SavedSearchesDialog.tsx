import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Bell, BellOff, Trash2, Edit, Plus, Search, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface SearchCriteria {
  min_price: number | null;
  max_price: number | null;
  property_type: string | null;
  category: 'property' | 'motorcycle' | 'bicycle' | 'yacht';
  city: string | null;
}

interface SavedSearch {
  id: string;
  name: string;
  description: string | null;
  search_criteria: SearchCriteria;
  alerts_enabled: boolean;
  alert_frequency: 'instant' | 'daily' | 'weekly';
  match_count: number;
  last_match_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface SavedSearchesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SavedSearchesDialog({ open, onOpenChange }: SavedSearchesDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Form state for creating/editing
  const [searchName, setSearchName] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [category, setCategory] = useState<'property' | 'motorcycle' | 'bicycle' | 'yacht'>('property');
  const [city, setCity] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [alertFrequency, setAlertFrequency] = useState<'instant' | 'daily' | 'weekly'>('instant');
  const [priceError, setPriceError] = useState<string | null>(null);

  const fetchSavedSearches = useCallback(async () => {
    if (!user?.id) return;

    setIsFetching(true);
    setFetchError(null);

    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedSearches((data || []) as any[]);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load saved searches';
      setFetchError(errorMessage);
      toast({
        title: 'Error Loading Searches',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (open && user) {
      fetchSavedSearches();
    }
  }, [open, user, fetchSavedSearches]);

  const handleSaveSearch = async () => {
    // Validate search name
    if (!searchName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for your search',
        variant: 'destructive',
      });
      return;
    }

    // Validate price range
    const minPriceNum = minPrice ? parseFloat(minPrice) : null;
    const maxPriceNum = maxPrice ? parseFloat(maxPrice) : null;

    if (minPriceNum !== null && maxPriceNum !== null && minPriceNum > maxPriceNum) {
      setPriceError('Minimum price cannot be greater than maximum price');
      toast({
        title: 'Invalid Price Range',
        description: 'Minimum price must be less than maximum price',
        variant: 'destructive',
      });
      return;
    }

    if (minPriceNum !== null && minPriceNum < 0) {
      setPriceError('Price cannot be negative');
      return;
    }

    if (maxPriceNum !== null && maxPriceNum < 0) {
      setPriceError('Price cannot be negative');
      return;
    }

    setPriceError(null);
    setIsLoading(true);

    try {
      const searchCriteria: SearchCriteria = {
        min_price: minPriceNum,
        max_price: maxPriceNum,
        property_type: propertyType || null,
        category: category,
        city: city || null,
      };

      const { error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user?.id,
          search_name: searchName,
          filters: searchCriteria,
        } as any);

      if (error) throw error;

      toast({
        title: 'Search Saved!',
        description: `"${searchName}" will notify you of new matches.`,
      });

      // Reset form
      setSearchName('');
      setSearchDescription('');
      setMinPrice('');
      setMaxPrice('');
      setPropertyType('');
      setCity('');
      setActiveTab('list');
      fetchSavedSearches();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAlerts = async (searchId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .update({ last_matched_at: new Date().toISOString() } as any)
        .eq('id', searchId);

      if (error) throw error;

      toast({
        title: !currentStatus ? 'Alerts Enabled' : 'Alerts Disabled',
        description: `You will ${!currentStatus ? 'now' : 'no longer'} receive notifications for this search.`,
      });

      fetchSavedSearches();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (searchId: string, searchName: string) => {
    setDeleteTarget({ id: searchId, name: searchName });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      toast({
        title: 'Search Deleted',
        description: `"${deleteTarget.name}" has been removed.`,
      });

      fetchSavedSearches();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[95vh] sm:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/10 text-white">
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-white/10">
          <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
            Saved Searches & Alerts
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 w-full">
          <div className="shrink-0 px-4 sm:px-6 pt-3 sm:pt-4">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 h-9 sm:h-10">
              <TabsTrigger value="list" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-500">
                <span className="truncate">My Searches ({savedSearches.length})</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-500">
                Create New
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="flex-1 m-0 min-h-0">
            <ScrollArea className="h-full">
              <div className="px-4 sm:px-6 py-3 sm:py-4">
              {isFetching ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-white/5 border-white/10">
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4 bg-white/10" />
                        <Skeleton className="h-4 w-1/2 bg-white/10" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-full bg-white/10" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : fetchError ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                  <p className="text-white/60 mb-4">{fetchError}</p>
                  <Button
                    onClick={fetchSavedSearches}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Try Again
                  </Button>
                </div>
              ) : savedSearches.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 mx-auto mb-4 text-white/30" />
                  <p className="text-white/60 mb-4">No saved searches yet</p>
                  <Button
                    onClick={() => setActiveTab('create')}
                    className="bg-gradient-to-r from-red-600 to-red-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Search
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedSearches.map((search) => (
                    <motion.div
                      key={search.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-white text-lg">{search.name}</CardTitle>
                              {search.description && (
                                <CardDescription className="text-white/60 mt-1">
                                  {search.description}
                                </CardDescription>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleAlerts(search.id, search.alerts_enabled)}
                                className="text-white/70 hover:text-white"
                              >
                                {search.alerts_enabled ? (
                                  <Bell className="w-4 h-4 text-green-400" />
                                ) : (
                                  <BellOff className="w-4 h-4 text-white/40" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteClick(search.id, search.name)}
                                className="text-white/70 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-2 mb-3">
                            {search.search_criteria.min_price && (
                              <Badge variant="outline" className="bg-white/5">
                                ${search.search_criteria.min_price}+
                              </Badge>
                            )}
                            {search.search_criteria.max_price && (
                              <Badge variant="outline" className="bg-white/5">
                                Up to ${search.search_criteria.max_price}
                              </Badge>
                            )}
                            {search.search_criteria.category && (
                              <Badge variant="outline" className="bg-white/5 capitalize">
                                {search.search_criteria.category}
                              </Badge>
                            )}
                            {search.search_criteria.city && (
                              <Badge variant="outline" className="bg-white/5">
                                {search.search_criteria.city}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4 text-white/60">
                              <span>{search.match_count} matches</span>
                              {search.alerts_enabled && (
                                <span className="flex items-center gap-1">
                                  <Bell className="w-3 h-3" />
                                  {search.alert_frequency}
                                </span>
                              )}
                            </div>
                            {search.last_match_at && (
                              <span className="text-white/40 text-xs">
                                Last match: {new Date(search.last_match_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="flex-1 m-0 min-h-0 flex flex-col">
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 sm:px-6 py-3 sm:py-4">
              <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-200">
                    <p className="font-medium mb-1">Get notified of new matches</p>
                    <p className="text-blue-300/80">
                      Save your search criteria and we'll alert you when new listings match your preferences.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Search Name *</Label>
                    <Input
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="e.g., Downtown Apartments Under $2000"
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Description (Optional)</Label>
                    <Textarea
                      value={searchDescription}
                      onChange={(e) => setSearchDescription(e.target.value)}
                      placeholder="Add notes about this search..."
                      className="bg-white/5 border-white/20 text-white resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Min Price</Label>
                        <Input
                          type="number"
                          min="0"
                          value={minPrice}
                          onChange={(e) => {
                            setMinPrice(e.target.value);
                            setPriceError(null);
                          }}
                          placeholder="$500"
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Max Price</Label>
                        <Input
                          type="number"
                          min="0"
                          value={maxPrice}
                          onChange={(e) => {
                            setMaxPrice(e.target.value);
                            setPriceError(null);
                          }}
                          placeholder="$2000"
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                    </div>
                    {priceError && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {priceError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Category</Label>
                    <Select 
                      value={category} 
                      onValueChange={(value) => setCategory(value as 'property' | 'yacht' | 'motorcycle' | 'bicycle')}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/20 text-white">
                        <SelectItem value="property">Property</SelectItem>
                        <SelectItem value="motorcycle">Motorcycle</SelectItem>
                        <SelectItem value="bicycle">Bicycle</SelectItem>
                        <SelectItem value="yacht">Yacht</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">City</Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., Tulum"
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Enable Alerts</Label>
                        <p className="text-sm text-white/60">Get notified of new matches</p>
                      </div>
                      <Switch
                        checked={alertsEnabled}
                        onCheckedChange={setAlertsEnabled}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-red-600 data-[state=checked]:to-red-500"
                      />
                    </div>

                    {alertsEnabled && (
                      <div className="space-y-2">
                        <Label className="text-white">Alert Frequency</Label>
                        <Select value={alertFrequency} onValueChange={(v: any) => setAlertFrequency(v)}>
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/20 text-white">
                            <SelectItem value="instant">Instant (Real-time)</SelectItem>
                            <SelectItem value="daily">Daily Digest</SelectItem>
                            <SelectItem value="weekly">Weekly Summary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </div>
            </ScrollArea>

            <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <Button
                variant="ghost"
                onClick={() => setActiveTab('list')}
                className="text-white/70 hover:text-white h-10 text-sm order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSearch}
                disabled={isLoading || !searchName.trim() || !!priceError}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:opacity-50 h-10 text-sm order-1 sm:order-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Search
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Saved Search?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
              You will no longer receive alerts for this search.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
