import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Save, Filter, Check } from 'lucide-react';
import { useOwnerClientPreferences } from '@/hooks/useOwnerClientPreferences';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { useToast } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OwnerClientFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LISTING_TYPE_OPTIONS = [
  { value: 'property', label: 'Properties', emoji: '' },
  { value: 'motorcycle', label: 'Motorcycles', emoji: '' },
  { value: 'bicycle', label: 'Bicycles', emoji: '' },
  { value: 'services', label: 'Services', emoji: '' },
];

const CLIENT_TYPE_OPTIONS = [
  { value: 'tenant', label: 'Tenants', emoji: '' },
  { value: 'buyer', label: 'Buyers', emoji: '' },
];

import {
  LIFESTYLE_TAGS as LIFESTYLE_OPTIONS,
  WORK_SCHEDULE_OPTIONS as OCCUPATION_OPTIONS,
  GENDER_OPTIONS,
  BUDGET_RANGES as OWNER_BUDGET_RANGES,
} from '@/constants/profileConstants';

// Category card component matching client style
function CategoryCard({
  label,
  emoji,
  isActive,
  onClick,
}: {
  label: string;
  emoji: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all duration-200",
        isActive
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border/40 bg-card/40 hover:border-primary/30"
      )}
    >
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5"
        >
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </motion.div>
      )}
      <span className="text-xl">{emoji}</span>
      <span className="text-xs font-semibold text-foreground">{label}</span>
    </motion.button>
  );
}

// Pill toggle matching client style
function PillToggle({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "py-2 px-3.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 border",
        isActive
          ? "bg-primary/15 border-primary/40 text-primary"
          : "bg-transparent border-border/50 text-muted-foreground hover:border-primary/30"
      )}
    >
      {label}
      {isActive && <X className="h-3 w-3 ml-0.5" />}
    </motion.button>
  );
}

// Segmented control matching client style
function _SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex rounded-xl bg-muted/50 p-1 gap-1">
      {options.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// Budget ranges are now imported from profileConstants.ts

/**
 * UI-only form state for fields that don't persist to DB.
 * These are kept separate from OwnerClientPreferences to avoid type conflicts.
 */
interface LocalFilterState {
  compatible_lifestyle_tags: string[];
  preferred_occupations: string[];
  allows_pets: boolean;
  allows_smoking: boolean;
  allows_parties: boolean;
  requires_employment_proof: boolean;
  requires_references: boolean;
}

export function OwnerClientFilterDialog({ open, onOpenChange }: OwnerClientFilterDialogProps) {

  const { preferences, updatePreferences, isUpdating } = useOwnerClientPreferences();
  const { saveFilter } = useSavedFilters();
  const { toast } = useToast();

  const [filterName, setFilterName] = useState('');
  const [showSaveAs, setShowSaveAs] = useState(false);

  // DB-persisted fields
  const [minBudget, setMinBudget] = useState<number | undefined>(undefined);
  const [maxBudget, setMaxBudget] = useState<number | undefined>(undefined);
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(65);
  const [selectedGenders, setSelectedGenders] = useState<string[]>(['Any Gender']);
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<string>('');

  // UI-only fields (not saved to DB, but used for local filtering/saved filters)
  const [localFilters, setLocalFilters] = useState<LocalFilterState>({
    compatible_lifestyle_tags: [],
    preferred_occupations: [],
    allows_pets: true,
    allows_smoking: false,
    allows_parties: false,
    requires_employment_proof: false,
    requires_references: false,
  });

  const [selectedListingTypes, setSelectedListingTypes] = useState<string[]>(['property']);
  const [selectedClientTypes, setSelectedClientTypes] = useState<string[]>(['tenant']);
  const [selectedInterestTypes, setSelectedInterestTypes] = useState<string[]>(['both']);

  useEffect(() => {
    if (preferences) {
      setMinBudget(preferences.min_budget ?? undefined);
      setMaxBudget(preferences.max_budget ?? undefined);
      setMinAge(preferences.min_age || 18);
      setMaxAge(preferences.max_age || 65);
      if (preferences.selected_genders) setSelectedGenders(preferences.selected_genders);
    }
  }, [preferences]);

  const toggleLifestyleTag = (tag: string) => {
    const current = localFilters.compatible_lifestyle_tags;
    setLocalFilters({
      ...localFilters,
      compatible_lifestyle_tags: current.includes(tag)
        ? current.filter((t: string) => t !== tag)
        : [...current, tag],
    });
  };

  const toggleOccupation = (occupation: string) => {
    const current = localFilters.preferred_occupations;
    setLocalFilters({
      ...localFilters,
      preferred_occupations: current.includes(occupation)
        ? current.filter((o: string) => o !== occupation)
        : [...current, occupation],
    });
  };

  const handleGenderToggle = (gender: string) => {
    if (gender === 'Any Gender') {
      setSelectedGenders(['Any Gender']);
    } else {
      const filtered = selectedGenders.filter(g => g !== 'Any Gender');
      if (filtered.includes(gender)) {
        const newSelection = filtered.filter(g => g !== gender);
        setSelectedGenders(newSelection.length === 0 ? ['Any Gender'] : newSelection);
      } else {
        setSelectedGenders([...filtered, gender]);
      }
    }
  };

  const handleSave = async () => {
    await updatePreferences({
      selected_genders: selectedGenders,
      min_budget: minBudget ?? null,
      max_budget: maxBudget ?? null,
      min_age: minAge !== 18 ? minAge : null,
      max_age: maxAge !== 65 ? maxAge : null,
      preferred_nationalities: null, // preserve existing or clear
    });
    toast({ title: "Filters Applied", description: "Client cards will refresh with your preferences." });
    onOpenChange(false);
  };

  const handleSaveAs = async () => {
    if (!filterName.trim()) return;

    await saveFilter({
      name: filterName,
      user_role: 'owner',
      filter_data: {
        ...localFilters,
        category: 'client',
        mode: 'discovery',
        selected_genders: selectedGenders,
        min_budget: minBudget,
        max_budget: maxBudget,
        min_age: minAge,
        max_age: maxAge,
        listing_types: selectedListingTypes,
        client_types: selectedClientTypes,
      },
    });

    await updatePreferences({
      selected_genders: selectedGenders,
      min_budget: minBudget ?? null,
      max_budget: maxBudget ?? null,
      min_age: minAge !== 18 ? minAge : null,
      max_age: maxAge !== 65 ? maxAge : null,
    });
    toast({ title: "Filter Saved!", description: `"${filterName}" saved successfully.` });
    setFilterName('');
    setShowSaveAs(false);
    onOpenChange(false);
  };

  const activeFilterCount =
    (selectedGenders.length > 0 && !selectedGenders.includes('Any Gender') ? 1 : 0) +
    (selectedBudgetRange ? 1 : 0) +
    (minAge !== 18 || maxAge !== 65 ? 1 : 0) +
    (localFilters.compatible_lifestyle_tags.length) +
    (localFilters.preferred_occupations.length) +
    (localFilters.allows_pets === false ? 1 : 0);

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{
              type: 'spring',
              damping: 35,
              stiffness: 400,
              mass: 0.8,
            }}
          >
            <DialogContent className="bg-background/95 backdrop-blur-xl max-w-2xl w-[calc(100vw-2rem)] sm:w-[95vw] h-[calc(100vh-4rem)] sm:h-[85vh] max-h-[90vh] flex flex-col p-0 rounded-t-[32px] sm:rounded-[32px] border border-border/30">
              <DialogHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-2 border-b">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-2.5">
                    <Filter className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl sm:text-2xl font-bold">Client Filters</DialogTitle>
                    {activeFilterCount > 0 && (
                      <p className="text-xs text-primary font-medium">
                        {activeFilterCount} filters active
                      </p>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
                <div className="space-y-6">

                  {/* Interest Type Filter */}
                  <div className="space-y-2.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Looking For</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'rent', label: 'Rent Only' },
                        { value: 'buy', label: 'Buy Only' },
                        { value: 'both', label: 'Rent or Buy' },
                      ].map((option) => (
                        <Badge
                          key={option.value}
                          variant={selectedInterestTypes.includes(option.value) ? "default" : "outline"}
                          className="cursor-pointer hover:opacity-80 text-xs sm:text-sm py-2 px-4"
                          onClick={() => {
                            if (selectedInterestTypes.includes(option.value)) {
                              setSelectedInterestTypes(selectedInterestTypes.filter(t => t !== option.value));
                            } else {
                              setSelectedInterestTypes([option.value]);
                            }
                          }}
                        >
                          {option.label}
                          {selectedInterestTypes.includes(option.value) && (
                            <X className="w-3 h-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Listing Types Section */}
                  <div className="space-y-2.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Listings</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {LISTING_TYPE_OPTIONS.map((option) => {
                        const isSelected = selectedListingTypes.includes(option.value);
                        return (
                          <CategoryCard
                            key={option.value}
                            label={option.label}
                            emoji={option.emoji}
                            isActive={isSelected}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedListingTypes(selectedListingTypes.filter(t => t !== option.value));
                              } else {
                                setSelectedListingTypes([...selectedListingTypes, option.value]);
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Client Types Section */}
                  <div className="space-y-2.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {CLIENT_TYPE_OPTIONS.map((option) => {
                        const isSelected = selectedClientTypes.includes(option.value);
                        return (
                          <CategoryCard
                            key={option.value}
                            label={option.label}
                            emoji={option.emoji}
                            isActive={isSelected}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedClientTypes(selectedClientTypes.filter(t => t !== option.value));
                              } else {
                                setSelectedClientTypes([...selectedClientTypes, option.value]);
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Budget Range */}
                  <div className="space-y-2.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget Range</Label>
                    <div className="flex flex-wrap gap-2">
                      {OWNER_BUDGET_RANGES.map((range) => {
                        const isSelected = selectedBudgetRange === range.value;
                        return (
                          <Badge
                            key={range.value}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer text-xs py-2 px-4 transition-all duration-200 ${isSelected ? 'shadow-md' : 'hover:shadow-sm'
                              }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedBudgetRange('');
                                setMinBudget(undefined);
                                setMaxBudget(undefined);
                              } else {
                                setSelectedBudgetRange(range.value);
                                setMinBudget(range.min);
                                setMaxBudget(range.max);
                              }
                            }}
                          >
                            {range.label}
                            {isSelected && (
                              <X className="w-3 h-3 ml-1.5 opacity-90" />
                            )}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Age Range */}
                  <div className="space-y-2.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Age Range</Label>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Min Age</Label>
                        <div className="flex rounded-xl bg-muted/50 p-1 gap-1 mt-1">
                          {[18, 21, 25, 30, 35, 40].map((age) => {
                            const isActive = minAge === age;
                            return (
                              <button
                                key={age}
                                onClick={() => setMinAge(age)}
                                className={cn(
                                  "flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                                  isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                {age}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Max Age</Label>
                        <div className="flex rounded-xl bg-muted/50 p-1 gap-1 mt-1">
                          {[30, 35, 40, 50, 60, 65].map((age) => {
                            const isActive = maxAge === age;
                            return (
                              <button
                                key={age}
                                onClick={() => setMaxAge(age)}
                                className={cn(
                                  "flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                                  isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                {age}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gender Preference */}
                  <div className="space-y-2.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gender</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {GENDER_OPTIONS.map((gender) => {
                        const isSelected = selectedGenders.includes(gender.value);
                        return (
                          <CategoryCard
                            key={gender.value}
                            label={gender.label}
                            emoji={gender.emoji}
                            isActive={isSelected}
                            onClick={() => handleGenderToggle(gender.value)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Lifestyle Tags */}
                  <div className="space-y-2.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lifestyle</Label>
                    <div className="flex flex-wrap gap-2">
                      {LIFESTYLE_OPTIONS.map((tag) => {
                        const isSelected = localFilters.compatible_lifestyle_tags.includes(tag);
                        return (
                          <PillToggle
                            key={tag}
                            label={tag}
                            isActive={isSelected}
                            onClick={() => toggleLifestyleTag(tag)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Preferred Occupations */}
                  <div className="space-y-2.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Occupation</Label>
                    <div className="flex flex-wrap gap-2">
                      {OCCUPATION_OPTIONS.map((occupation) => {
                        const isSelected = localFilters.preferred_occupations.includes(occupation.value);
                        return (
                          <PillToggle
                            key={occupation.value}
                            label={occupation.label}
                            isActive={isSelected}
                            onClick={() => toggleOccupation(occupation.value)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Property Rules */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preferences</Label>
                    <div className="space-y-3 p-4 rounded-xl border border-border/40 bg-card/30">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="allows-pets" className="text-sm">Allows Pets</Label>
                        <Switch
                          id="allows-pets"
                          checked={localFilters.allows_pets}
                          onCheckedChange={(checked) => setLocalFilters({ ...localFilters, allows_pets: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="allows-parties" className="text-sm">Allows Parties</Label>
                        <Switch
                          id="allows-parties"
                          checked={localFilters.allows_parties}
                          onCheckedChange={(checked) => setLocalFilters({ ...localFilters, allows_parties: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="requires-employment" className="text-sm">Requires Employment Proof</Label>
                        <Switch
                          id="requires-employment"
                          checked={localFilters.requires_employment_proof}
                          onCheckedChange={(checked) => setLocalFilters({ ...localFilters, requires_employment_proof: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t gap-2 flex-col sm:flex-row">
                {showSaveAs ? (
                  <>
                    <Input
                      placeholder="Filter name..."
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button onClick={handleSaveAs} disabled={!filterName.trim()}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="ghost" onClick={() => setShowSaveAs(false)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button variant="outline" onClick={() => setShowSaveAs(true)}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Filter
                    </Button>
                    <Button onClick={handleSave} disabled={isUpdating}>
                      {isUpdating ? 'Saving...' : 'Apply Filters'}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

