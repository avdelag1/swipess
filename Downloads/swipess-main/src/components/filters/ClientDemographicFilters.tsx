import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface ClientDemographicFiltersProps {
  genderPreference: string;
  setGenderPreference: (value: string) => void;
  ageRange: number[];
  setAgeRange: (value: number[]) => void;
  relationshipStatus: string[];
  setRelationshipStatus: (value: string[]) => void;
  hasPetsFilter: string;
  setHasPetsFilter: (value: string) => void;
  nationalities: string[];
  setNationalities: (value: string[]) => void;
  languages: string[];
  setLanguages: (value: string[]) => void;
}

const genderOptions = [
  { value: 'any', label: 'Any Gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-Binary' },
  { value: 'other', label: 'Other' }
];

const nationalityOptions = [
  'United States', 'Canada', 'Mexico', 'United Kingdom', 'Germany', 'France', 
  'Spain', 'Italy', 'Netherlands', 'Australia', 'Brazil', 'Argentina', 
  'Colombia', 'India', 'China', 'Japan', 'South Korea', 'Other'
];

const languageOptions = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
  'Mandarin', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Dutch'
];

const relationshipStatusOptions = ['Single', 'Couple', 'Family with Children', 'Group/Roommates'];

const petFilterOptions = [
  { value: 'any', label: 'Any' },
  { value: 'with_pets', label: 'Has Pets' },
  { value: 'no_pets', label: 'No Pets' }
];

export function ClientDemographicFilters({
  genderPreference,
  setGenderPreference,
  ageRange,
  setAgeRange,
  relationshipStatus,
  setRelationshipStatus,
  hasPetsFilter,
  setHasPetsFilter,
  nationalities,
  setNationalities,
  languages,
  setLanguages
}: ClientDemographicFiltersProps) {
  return (
    <>
      <Collapsible defaultOpen className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">Client Demographics</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="space-y-2">
            <Label className="text-sm">Gender Preference</Label>
            <Select value={genderPreference} onValueChange={setGenderPreference}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Age Range: {ageRange[0]} - {ageRange[1]}</Label>
            <Slider
              value={ageRange}
              onValueChange={setAgeRange}
              min={18}
              max={80}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Relationship Status</Label>
            <div className="grid grid-cols-2 gap-2">
              {relationshipStatusOptions.map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    checked={relationshipStatus.includes(status)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setRelationshipStatus([...relationshipStatus, status]);
                      } else {
                        setRelationshipStatus(relationshipStatus.filter(s => s !== status));
                      }
                    }}
                  />
                  <Label className="text-sm">{status}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Pet Ownership</Label>
            <Select value={hasPetsFilter} onValueChange={setHasPetsFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {petFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">Nationality & Language</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="space-y-2">
            <Label className="text-sm">Nationalities</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {nationalityOptions.map((nationality) => (
                <div key={nationality} className="flex items-center space-x-2">
                  <Checkbox
                    checked={nationalities.includes(nationality)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNationalities([...nationalities, nationality]);
                      } else {
                        setNationalities(nationalities.filter(n => n !== nationality));
                      }
                    }}
                  />
                  <Label className="text-sm">{nationality}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Languages Spoken</Label>
            <div className="grid grid-cols-2 gap-2">
              {languageOptions.map((language) => (
                <div key={language} className="flex items-center space-x-2">
                  <Checkbox
                    checked={languages.includes(language)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setLanguages([...languages, language]);
                      } else {
                        setLanguages(languages.filter(l => l !== language));
                      }
                    }}
                  />
                  <Label className="text-sm">{language}</Label>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
