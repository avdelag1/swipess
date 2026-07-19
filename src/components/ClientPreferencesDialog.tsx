
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ChipMultiSelect } from '@/components/listing/ChipMultiSelect'
import { SmartSelector } from '@/components/listing/SmartSelector'
import { BIKE_TYPE, MOTO_TYPE, PROPERTY_TYPES } from '@/constants/listingTaxonomies'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useClientFilterPreferences } from '@/hooks/useClientFilterPreferences'
import { useFilterStore } from '@/state/filterStore'
import { appToast } from '@/utils/appNotification';
import { triggerHaptic } from '@/utils/haptics';
import { AnimatePresence } from 'framer-motion'


interface ClientPreferencesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientPreferencesDialog({ open, onOpenChange }: ClientPreferencesDialogProps) {
  const { data: preferences, updatePreferences, isLoading } = useClientFilterPreferences()
  const [activeTab, setActiveTab] = useState('properties')



  const [formData, setFormData] = useState({
    // Category interests
    interested_in_properties: true,
    interested_in_motorcycles: false,
    interested_in_bicycles: false,

    // Property preferences
    min_price: 0,
    max_price: 100000,
    min_bedrooms: 1,
    max_bedrooms: 10,
    min_bathrooms: 1,
    max_bathrooms: 5,
    property_types: [] as string[],
    location_zones: [] as string[],
    preferred_listing_types: ['rent'] as string[],
    furnished_required: false,
    pet_friendly_required: false,
    requires_gym: false,
    requires_balcony: false,
    requires_elevator: false,
    requires_jacuzzi: false,
    requires_coworking_space: false,
    requires_solar_panels: false,
    rental_duration: 'monthly' as string,

    // Motorcycle preferences
    moto_types: [] as string[],
    moto_engine_size_min: 50,
    moto_engine_size_max: 2000,
    moto_year_min: 1990,
    moto_year_max: new Date().getFullYear(),
    moto_price_min: 0,
    moto_price_max: 100000,
    moto_mileage_max: 150000,
    moto_transmission: [] as string[],
    moto_condition: [] as string[],
    moto_fuel_types: [] as string[],
    moto_cylinders: [] as string[],
    moto_cooling_system: [] as string[],
    moto_has_abs: null as boolean | null,
    moto_features: [] as string[],
    moto_is_electric: null as boolean | null,
    moto_battery_capacity_min: 0,

    // Bicycle preferences
    bicycle_types: [] as string[],
    bicycle_price_min: 0,
    bicycle_price_max: 10000,
    bicycle_wheel_sizes: [] as string[],
    bicycle_suspension_type: [] as string[],
    bicycle_material: [] as string[],
    bicycle_gears_min: 1,
    bicycle_gears_max: 30,
    bicycle_year_min: 2010,
    bicycle_condition: [] as string[],
    bicycle_is_electric: null as boolean | null,
    bicycle_battery_range_min: 0,
  })

  useEffect(() => {
    if (preferences) {
      setFormData({
        // Category interests
        interested_in_properties: preferences.interested_in_properties ?? true,
        interested_in_motorcycles: preferences.interested_in_motorcycles ?? false,
        interested_in_bicycles: preferences.interested_in_bicycles ?? false,

        // Property preferences
        min_price: preferences.min_price || 0,
        max_price: preferences.max_price || 100000,
        min_bedrooms: preferences.min_bedrooms || 1,
        max_bedrooms: preferences.max_bedrooms || 10,
        min_bathrooms: preferences.min_bathrooms || 1,
        max_bathrooms: preferences.max_bathrooms || 5,
        property_types: preferences.property_types || [],
        location_zones: preferences.location_zones || [],
        preferred_listing_types: preferences.preferred_listing_types || ['rent'],
        furnished_required: preferences.furnished_required || false,
        pet_friendly_required: preferences.pet_friendly_required || false,
        requires_gym: preferences.requires_gym || false,
        requires_balcony: preferences.requires_balcony || false,
        requires_elevator: preferences.requires_elevator || false,
        requires_jacuzzi: preferences.requires_jacuzzi || false,
        requires_coworking_space: preferences.requires_coworking_space || false,
        requires_solar_panels: preferences.requires_solar_panels || false,
        rental_duration: preferences.rental_duration || 'monthly',

        // Motorcycle preferences
        moto_types: preferences.moto_types || [],
        moto_engine_size_min: preferences.moto_engine_size_min || 50,
        moto_engine_size_max: preferences.moto_engine_size_max || 2000,
        moto_year_min: preferences.moto_year_min || 1990,
        moto_year_max: preferences.moto_year_max || new Date().getFullYear(),
        moto_price_min: preferences.moto_price_min || 0,
        moto_price_max: preferences.moto_price_max || 100000,
        moto_mileage_max: preferences.moto_mileage_max || 150000,
        moto_transmission: preferences.moto_transmission || [],
        moto_condition: preferences.moto_condition || [],
        moto_fuel_types: preferences.moto_fuel_types || [],
        moto_cylinders: preferences.moto_cylinders || [],
        moto_cooling_system: preferences.moto_cooling_system || [],
        moto_has_abs: preferences.moto_has_abs ?? null,
        moto_features: preferences.moto_features || [],
        moto_is_electric: preferences.moto_is_electric ?? null,
        moto_battery_capacity_min: preferences.moto_battery_capacity_min || 0,

        // Bicycle preferences
        bicycle_types: preferences.bicycle_types || [],
        bicycle_price_min: preferences.bicycle_price_min || 0,
        bicycle_price_max: preferences.bicycle_price_max || 10000,
        bicycle_wheel_sizes: preferences.bicycle_wheel_sizes || [],
        bicycle_suspension_type: preferences.bicycle_suspension_type || [],
        bicycle_material: preferences.bicycle_material || [],
        bicycle_gears_min: preferences.bicycle_gears_min || 1,
        bicycle_gears_max: preferences.bicycle_gears_max || 30,
        bicycle_year_min: preferences.bicycle_year_min || 2010,
        bicycle_condition: preferences.bicycle_condition || [],
        bicycle_is_electric: preferences.bicycle_is_electric ?? null,
        bicycle_battery_range_min: preferences.bicycle_battery_range_min || 0,
      })
    }
  }, [preferences])

  const handleSave = async () => {
    try {
      triggerHaptic('medium')
      await updatePreferences(formData)

      const amenities: string[] = []
      if (formData.requires_gym) amenities.push('gym')
      if (formData.requires_balcony) amenities.push('balcony')
      if (formData.requires_elevator) amenities.push('elevator')
      if (formData.requires_jacuzzi) amenities.push('jacuzzi')
      if (formData.requires_coworking_space) amenities.push('coworking')
      if (formData.requires_solar_panels) amenities.push('solar')

      const listingType = formData.preferred_listing_types.includes('buy')
        ? 'sale'
        : formData.preferred_listing_types.includes('rent')
          ? 'rent'
          : 'both'

      useFilterStore.getState().setFilters({
        priceRange: [formData.min_price, formData.max_price],
        bedrooms: [formData.min_bedrooms, formData.max_bedrooms],
        bathrooms: [formData.min_bathrooms, formData.max_bathrooms],
        propertyTypes: formData.property_types,
        motoTypes: formData.moto_types,
        bicycleTypes: formData.bicycle_types,
        furnished: formData.furnished_required,
        petFriendly: formData.pet_friendly_required,
        amenities,
        listingType,
      })

      triggerHaptic('success')
      appToast.success('Preferences saved — deck updated')
      onOpenChange(false)
    } catch (_error) {
      appToast.error('Error')
    }
  }

  const propertyTypeOptions = PROPERTY_TYPES.map((t) => t.label)

  const locationOptions = [
    'Miami Centro', 'Zona Hotelera', 'Aldea Zama', 'La Veleta', 'Región 15'
  ]

  const listingTypeOptions = [
    { value: 'rent', label: 'For Rent' },
    { value: 'buy', label: 'For Sale' },
  ] as const

  const rentalDurationOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ] as const

  const amenityOptions = [
    'Furnished', 'Pet Friendly', 'Gym', 'Balcony', 'Elevator', 'Jacuzzi', 'Coworking Space', 'Solar Panels',
  ] as const

  const selectedAmenities = [
    formData.furnished_required && 'Furnished',
    formData.pet_friendly_required && 'Pet Friendly',
    formData.requires_gym && 'Gym',
    formData.requires_balcony && 'Balcony',
    formData.requires_elevator && 'Elevator',
    formData.requires_jacuzzi && 'Jacuzzi',
    formData.requires_coworking_space && 'Coworking Space',
    formData.requires_solar_panels && 'Solar Panels',
  ].filter(Boolean) as string[]

  const setAmenities = (selected: string[]) => {
    setFormData({
      ...formData,
      furnished_required: selected.includes('Furnished'),
      pet_friendly_required: selected.includes('Pet Friendly'),
      requires_gym: selected.includes('Gym'),
      requires_balcony: selected.includes('Balcony'),
      requires_elevator: selected.includes('Elevator'),
      requires_jacuzzi: selected.includes('Jacuzzi'),
      requires_coworking_space: selected.includes('Coworking Space'),
      requires_solar_panels: selected.includes('Solar Panels'),
    })
  }

  const motoTypeOptions = [...MOTO_TYPE]

  const motoTransmissionOptions = ['Manual', 'Automatic', 'Semi-Automatic', 'CVT']

  const conditionOptions = ['New', 'Like New', 'Excellent', 'Good', 'Fair']

  const motoFuelTypeOptions = ['Gasoline', 'Electric', 'Hybrid', 'Diesel']

  const motoCylinderOptions = ['Single', 'Twin', 'Triple', 'Four', 'Six']

  const motoCoolingOptions = ['Air', 'Liquid', 'Oil']

  const motoFeatureOptions = [
    'GPS Navigation', 'Heated Grips', 'Cruise Control', 'Quick Shifter',
    'Traction Control', 'Riding Modes', 'LED Lighting', 'USB Charging'
  ]

  const bicycleTypeOptions = [...BIKE_TYPE]

  const bicycleWheelSizeOptions = ['20"', '24"', '26"', '27.5"', '29"', '700c', '650b']

  const bicycleSuspensionOptions = ['Rigid', 'Hardtail', 'Full Suspension']

  const bicycleMaterialOptions = ['Aluminum', 'Carbon Fiber', 'Steel', 'Titanium']

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[80vh] max-h-[85vh] w-[calc(100vw-1rem)] flex flex-col p-0 rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-border shadow-2xl mt-20 bg-background">
        <DialogHeader className="px-6 py-4 border-b border-border/5">
          <DialogTitle>My Preferences</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="motorcycles">
              Motorcycles
            </TabsTrigger>
            <TabsTrigger value="bicycles">
              Bicycles
            </TabsTrigger>
          </TabsList>

  {activeTab === 'properties' && (
  <div className="flex-1 mt-0 min-h-0 data-[state=active]:flex flex-col">
            <ScrollArea className="h-full px-6">
              <div className="space-y-6 py-4">
                {/* Price Range */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Price Range</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min_price">Min Price ($)</Label>
                      <Input
                        id="min_price"
                        type="number"
                        value={formData.min_price}
                        onChange={(e) => setFormData({ ...formData, min_price: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_price">Max Price ($)</Label>
                      <Input
                        id="max_price"
                        type="number"
                        value={formData.max_price}
                        onChange={(e) => setFormData({ ...formData, max_price: parseInt(e.target.value) || 100000 })}
                      />
                    </div>
                  </div>
                </div>

                {/* Bedrooms & Bathrooms */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Rooms</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min_bedrooms">Min Bedrooms</Label>
                      <Input
                        id="min_bedrooms"
                        type="number"
                        value={formData.min_bedrooms}
                        onChange={(e) => setFormData({ ...formData, min_bedrooms: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_bedrooms">Max Bedrooms</Label>
                      <Input
                        id="max_bedrooms"
                        type="number"
                        value={formData.max_bedrooms}
                        onChange={(e) => setFormData({ ...formData, max_bedrooms: parseInt(e.target.value) || 10 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="min_bathrooms">Min Bathrooms</Label>
                      <Input
                        id="min_bathrooms"
                        type="number"
                        value={formData.min_bathrooms}
                        onChange={(e) => setFormData({ ...formData, min_bathrooms: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_bathrooms">Max Bathrooms</Label>
                      <Input
                        id="max_bathrooms"
                        type="number"
                        value={formData.max_bathrooms}
                        onChange={(e) => setFormData({ ...formData, max_bathrooms: parseInt(e.target.value) || 5 })}
                      />
                    </div>
                  </div>
                </div>

                <ChipMultiSelect
                  label="Listing Type"
                  accent="rose"
                  options={listingTypeOptions.map((t) => t.label)}
                  value={formData.preferred_listing_types.map((v) => listingTypeOptions.find((t) => t.value === v)?.label ?? v)}
                  onChange={(labels) => {
                    const values = labels.map((l) => listingTypeOptions.find((t) => t.label === l)?.value ?? l)
                    setFormData({ ...formData, preferred_listing_types: values })
                  }}
                />

                <ChipMultiSelect
                  label="Property Types"
                  accent="rose"
                  options={propertyTypeOptions}
                  value={formData.property_types}
                  onChange={(v) => setFormData({ ...formData, property_types: v })}
                />

                <ChipMultiSelect
                  label="Preferred Locations"
                  accent="rose"
                  options={locationOptions}
                  value={formData.location_zones}
                  onChange={(v) => setFormData({ ...formData, location_zones: v })}
                />

                <ChipMultiSelect
                  label="Required Amenities"
                  accent="rose"
                  options={[...amenityOptions]}
                  value={selectedAmenities}
                  onChange={setAmenities}
                />

                <SmartSelector
                  label="Rental Duration"
                  accent="rose"
                  single
                  options={[...rentalDurationOptions]}
                  value={formData.rental_duration ? [formData.rental_duration] : []}
                  onChange={(v) => setFormData({ ...formData, rental_duration: v[0] ?? 'monthly' })}
                />
              </div>
            </ScrollArea>
          </div>
          )}

          {activeTab === 'motorcycles' && (
          <div className="flex-1 mt-0 min-h-0 flex flex-col">
            <ScrollArea className="h-full px-6">
              <div className="space-y-6 py-4">
                <ChipMultiSelect
                  label="Motorcycle Types"
                  accent="orange"
                  options={motoTypeOptions}
                  value={formData.moto_types}
                  onChange={(v) => setFormData({ ...formData, moto_types: v })}
                />

                {/* Price Range */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Price Range</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="moto_price_min">Min Price ($)</Label>
                      <Input
                        id="moto_price_min"
                        type="number"
                        value={formData.moto_price_min}
                        onChange={(e) => setFormData({ ...formData, moto_price_min: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="moto_price_max">Max Price ($)</Label>
                      <Input
                        id="moto_price_max"
                        type="number"
                        value={formData.moto_price_max}
                        onChange={(e) => setFormData({ ...formData, moto_price_max: parseInt(e.target.value) || 100000 })}
                      />
                    </div>
                  </div>
                </div>

                {/* Engine Size */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Engine Size (cc)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="moto_engine_size_min">Min (cc)</Label>
                      <Input
                        id="moto_engine_size_min"
                        type="number"
                        value={formData.moto_engine_size_min}
                        onChange={(e) => setFormData({ ...formData, moto_engine_size_min: parseInt(e.target.value) || 50 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="moto_engine_size_max">Max (cc)</Label>
                      <Input
                        id="moto_engine_size_max"
                        type="number"
                        value={formData.moto_engine_size_max}
                        onChange={(e) => setFormData({ ...formData, moto_engine_size_max: parseInt(e.target.value) || 2000 })}
                      />
                    </div>
                  </div>
                </div>

                {/* Year Range */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Year</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="moto_year_min">From</Label>
                      <Input
                        id="moto_year_min"
                        type="number"
                        value={formData.moto_year_min}
                        onChange={(e) => setFormData({ ...formData, moto_year_min: parseInt(e.target.value) || 1990 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="moto_year_max">To</Label>
                      <Input
                        id="moto_year_max"
                        type="number"
                        value={formData.moto_year_max}
                        onChange={(e) => setFormData({ ...formData, moto_year_max: parseInt(e.target.value) || new Date().getFullYear() })}
                      />
                    </div>
                  </div>
                </div>

                {/* Max Mileage */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Max Mileage</h3>
                  <Input
                    type="number"
                    value={formData.moto_mileage_max}
                    onChange={(e) => setFormData({ ...formData, moto_mileage_max: parseInt(e.target.value) || 150000 })}
                  />
                </div>

                <ChipMultiSelect
                  label="Transmission"
                  accent="orange"
                  options={motoTransmissionOptions}
                  value={formData.moto_transmission}
                  onChange={(v) => setFormData({ ...formData, moto_transmission: v })}
                />

                <ChipMultiSelect
                  label="Condition"
                  accent="orange"
                  options={conditionOptions}
                  value={formData.moto_condition}
                  onChange={(v) => setFormData({ ...formData, moto_condition: v })}
                />

                <ChipMultiSelect
                  label="Fuel Type"
                  accent="orange"
                  options={motoFuelTypeOptions}
                  value={formData.moto_fuel_types}
                  onChange={(v) => setFormData({ ...formData, moto_fuel_types: v })}
                />

                <ChipMultiSelect
                  label="Cylinders"
                  accent="orange"
                  options={motoCylinderOptions}
                  value={formData.moto_cylinders}
                  onChange={(v) => setFormData({ ...formData, moto_cylinders: v })}
                />

                <ChipMultiSelect
                  label="Cooling System"
                  accent="orange"
                  options={motoCoolingOptions}
                  value={formData.moto_cooling_system}
                  onChange={(v) => setFormData({ ...formData, moto_cooling_system: v })}
                />

                <ChipMultiSelect
                  label="Desired Features"
                  accent="orange"
                  options={motoFeatureOptions}
                  value={formData.moto_features}
                  onChange={(v) => setFormData({ ...formData, moto_features: v })}
                />

                {/* ABS & Electric */}
                <div className="space-y-4 pb-4">
                  <h3 className="text-lg font-semibold">Additional Preferences</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="moto_has_abs"
                      checked={formData.moto_has_abs === true}
                      onCheckedChange={(checked) => setFormData({ ...formData, moto_has_abs: checked ? true : null })}
                    />
                    <Label htmlFor="moto_has_abs">Must have ABS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="moto_is_electric"
                      checked={formData.moto_is_electric === true}
                      onCheckedChange={(checked) => setFormData({ ...formData, moto_is_electric: checked ? true : null })}
                    />
                    <Label htmlFor="moto_is_electric">Electric only</Label>
                  </div>
                  {formData.moto_is_electric && (
                    <div>
                      <Label htmlFor="moto_battery_capacity_min">Min Battery Capacity (kWh)</Label>
                      <Input
                        id="moto_battery_capacity_min"
                        type="number"
                        value={formData.moto_battery_capacity_min}
                        onChange={(e) => setFormData({ ...formData, moto_battery_capacity_min: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
          )}

          {activeTab === 'bicycles' && (
          <div className="flex-1 mt-0 min-h-0 flex flex-col">
            <ScrollArea className="h-full px-6">
              <div className="space-y-6 py-4">
                <ChipMultiSelect
                  label="Bicycle Types"
                  accent="purple"
                  options={bicycleTypeOptions}
                  value={formData.bicycle_types}
                  onChange={(v) => setFormData({ ...formData, bicycle_types: v })}
                />

                {/* Price Range */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Price Range</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bicycle_price_min">Min Price ($)</Label>
                      <Input
                        id="bicycle_price_min"
                        type="number"
                        value={formData.bicycle_price_min}
                        onChange={(e) => setFormData({ ...formData, bicycle_price_min: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bicycle_price_max">Max Price ($)</Label>
                      <Input
                        id="bicycle_price_max"
                        type="number"
                        value={formData.bicycle_price_max}
                        onChange={(e) => setFormData({ ...formData, bicycle_price_max: parseInt(e.target.value) || 10000 })}
                      />
                    </div>
                  </div>
                </div>

                <ChipMultiSelect
                  label="Wheel Size"
                  accent="purple"
                  options={bicycleWheelSizeOptions}
                  value={formData.bicycle_wheel_sizes}
                  onChange={(v) => setFormData({ ...formData, bicycle_wheel_sizes: v })}
                />

                <ChipMultiSelect
                  label="Suspension Type"
                  accent="purple"
                  options={bicycleSuspensionOptions}
                  value={formData.bicycle_suspension_type}
                  onChange={(v) => setFormData({ ...formData, bicycle_suspension_type: v })}
                />

                <ChipMultiSelect
                  label="Frame Material"
                  accent="purple"
                  options={bicycleMaterialOptions}
                  value={formData.bicycle_material}
                  onChange={(v) => setFormData({ ...formData, bicycle_material: v })}
                />

                {/* Gears */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Number of Gears</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bicycle_gears_min">Min Gears</Label>
                      <Input
                        id="bicycle_gears_min"
                        type="number"
                        value={formData.bicycle_gears_min}
                        onChange={(e) => setFormData({ ...formData, bicycle_gears_min: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bicycle_gears_max">Max Gears</Label>
                      <Input
                        id="bicycle_gears_max"
                        type="number"
                        value={formData.bicycle_gears_max}
                        onChange={(e) => setFormData({ ...formData, bicycle_gears_max: parseInt(e.target.value) || 30 })}
                      />
                    </div>
                  </div>
                </div>

                {/* Year */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Minimum Year</h3>
                  <Input
                    type="number"
                    value={formData.bicycle_year_min}
                    onChange={(e) => setFormData({ ...formData, bicycle_year_min: parseInt(e.target.value) || 2010 })}
                  />
                </div>

                <ChipMultiSelect
                  label="Condition"
                  accent="purple"
                  options={conditionOptions}
                  value={formData.bicycle_condition}
                  onChange={(v) => setFormData({ ...formData, bicycle_condition: v })}
                />

                {/* Electric */}
                <div className="space-y-4 pb-4">
                  <h3 className="text-lg font-semibold">Electric Preferences</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="bicycle_is_electric"
                      checked={formData.bicycle_is_electric === true}
                      onCheckedChange={(checked) => setFormData({ ...formData, bicycle_is_electric: checked ? true : null })}
                    />
                    <Label htmlFor="bicycle_is_electric">Electric only</Label>
                  </div>
                  {formData.bicycle_is_electric && (
                    <div>
                      <Label htmlFor="bicycle_battery_range_min">Min Battery Range (miles)</Label>
                      <Input
                        id="bicycle_battery_range_min"
                        type="number"
                        value={formData.bicycle_battery_range_min}
                        onChange={(e) => setFormData({ ...formData, bicycle_battery_range_min: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
          )}

        </Tabs>

        <DialogFooter className="px-6 py-4 border-t">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="rounded-xl font-bold bg-foreground text-background hover:opacity-90"
          >
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    )}
  </AnimatePresence>
)
}



