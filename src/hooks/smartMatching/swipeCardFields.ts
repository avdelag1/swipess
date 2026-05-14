/**
 * SWIPE_CARD_FIELDS — Standalone export.
 * 
 * Extracted from useSmartListingMatching to break a circular runtime
 * dependency chain:
 *   useListings → useSmartListingMatching → (types/matchCalc) → useListings
 * 
 * Vite's chunk-splitting can evaluate the importing module before the
 * exporting module finishes, causing a TDZ crash
 * ("Cannot access 'v' before initialization").
 * 
 * This file has ZERO internal imports, so it is always safe to import.
 */

export const SWIPE_CARD_FIELDS = `
  id, title, description, price, images, video_url, city, neighborhood, beds, baths,
  square_footage, category, listing_type, property_type, vehicle_brand,
  vehicle_model, year, mileage, amenities, pet_friendly, furnished,
  user_id, owner_id, created_at, updated_at, currency,
  service_category, pricing_unit, experience_years, experience_level,
  skills, days_available, time_slots_available, work_type, schedule_type,
  location_type, service_radius_km, minimum_booking_hours,
  certifications, tools_equipment,
  offers_emergency_service, background_check_verified, insurance_verified,
  motorcycle_type, bicycle_type, engine_cc, fuel_type, transmission,
  electric_assist, battery_range, frame_size, frame_material,
  latitude, longitude, status, is_active
`;
