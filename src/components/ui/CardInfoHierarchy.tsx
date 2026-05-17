/**
 * CARD INFORMATION HIERARCHY
 * 
 * Users must be able to decide in under 2 seconds.
 * 
 * Priority order:
 * 1. Primary value (price / rate)
 * 2. Primary identity (vehicle / property / worker)
 * 3. Location or service area
 * 4. Trust signal (rating / verified)
 * 
 * Rules:
 * - One strong headline
 * - One supporting line
 * - Everything else hidden behind tap
 * - No paragraph text on cards
 */

import { memo } from 'react';
import { MapPin, DollarSign, Bed, Bath, Car, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerifiedBadge, RatingDisplay } from './TrustSignals';

// Fluid font size constants
const FONT = {
  headline: 'clamp(1.125rem, 4.5vw, 1.5rem)',    // 18px → 24px
  secondary: 'clamp(1rem, 3.5vw, 1.125rem)',       // 16px → 18px
  body: 'clamp(0.8125rem, 3vw, 1rem)',              // 13px → 16px
  meta: 'clamp(0.6875rem, 2.5vw, 0.875rem)',        // 11px → 14px
} as const;

interface CardInfoProps {
  className?: string;
}

// ============================================
// PROPERTY CARD INFO
// ============================================

interface PropertyCardInfoProps extends CardInfoProps {
  title?: string;
  price: number;
  priceType?: 'month' | 'night' | 'year' | 'sale';
  propertyType?: string;
  beds?: number;
  baths?: number;
  location?: string;
  isVerified?: boolean;
  rating?: number;
  photoIndex?: number;
}

export const PropertyCardInfo = memo(({
  title,
  price,
  priceType = 'month',
  propertyType,
  beds,
  baths,
  location,
  isVerified,
  rating,
  className,
  photoIndex = 0,
}: PropertyCardInfoProps) => {
  const priceLabel = priceType === 'month' ? '/mo' : priceType === 'night' ? '/night' : priceType === 'sale' ? '' : '/yr';

  // Photo-paged info — each page shows a distinct slice of metadata.
  // After the last page the overlay is empty so subsequent photos
  // remain fully unobstructed (no looping repeats).
  // 0: price + title + property type
  // 1: beds / baths + location
  // 2: rating
  // 3+: nothing — let the photo speak.
  if (photoIndex >= 3) {
    return null;
  }

  return (
    <div className={cn("space-y-1", className)}>
      {photoIndex === 0 && (
        <>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-white drop-shadow-lg" style={{ fontSize: FONT.headline }}>
              ${price.toLocaleString()}
            </span>
            <span className="text-white/80" style={{ fontSize: FONT.meta }}>{priceLabel}</span>
            {isVerified && <VerifiedBadge size="sm" className="ml-2" />}
          </div>
          {title && (
            <div className="font-semibold text-white/95 truncate drop-shadow" style={{ fontSize: FONT.body }}>
              {title}
            </div>
          )}
          {propertyType && (
            <div className="flex items-center gap-3 text-white/90">
              <span className="font-semibold" style={{ fontSize: FONT.body }}>{propertyType}</span>
            </div>
          )}
        </>
      )}

      {photoIndex === 1 && (
        <>
          <div className="flex items-center gap-3 text-white/90">
            {beds !== undefined && (
              <span className="flex items-center gap-1" style={{ fontSize: FONT.secondary }}>
                <Bed className="w-5 h-5" />
                <span className="font-bold">{beds} {beds === 1 ? 'Bed' : 'Beds'}</span>
              </span>
            )}
            {baths !== undefined && (
              <span className="flex items-center gap-1" style={{ fontSize: FONT.secondary }}>
                <Bath className="w-5 h-5" />
                <span className="font-bold">{baths} {baths === 1 ? 'Bath' : 'Baths'}</span>
              </span>
            )}
          </div>
          {location && (
            <div className="flex items-center gap-1 text-white/90" style={{ fontSize: FONT.body }}>
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{location}</span>
            </div>
          )}
        </>
      )}

      {photoIndex === 2 && rating !== undefined && rating > 0 && (
        <RatingDisplay rating={rating} size="md" className="text-white" />
      )}
    </div>
  );
});

PropertyCardInfo.displayName = 'PropertyCardInfo';

// ============================================
// VEHICLE CARD INFO
// ============================================

interface VehicleCardInfoProps extends CardInfoProps {
  title?: string;
  price: number;
  priceType?: 'day' | 'week' | 'month' | 'sale';
  make?: string;
  model?: string;
  year?: number;
  location?: string;
  isVerified?: boolean;
  rating?: number;
  photoIndex?: number;
}

export const VehicleCardInfo = memo(({
  title,
  price,
  priceType = 'day',
  make,
  model,
  year,
  location,
  isVerified,
  rating,
  className,
  photoIndex = 0,
}: VehicleCardInfoProps) => {
  const priceLabel = priceType === 'sale' ? '' : `/${priceType}`;
  const vehicleName = [year, make, model].filter(Boolean).join(' ');

  // Distinct slice per photo; nothing on photo 4+ so they stay clean.
  if (photoIndex >= 3) {
    return null;
  }
  const normalizedIndex = photoIndex;

  return (
    <div className={cn("space-y-1", className)}>
      {normalizedIndex === 0 && (
        <>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-white drop-shadow-lg" style={{ fontSize: FONT.headline }}>
              ${price.toLocaleString()}
            </span>
            <span className="text-white/80" style={{ fontSize: FONT.meta }}>{priceLabel}</span>
            {isVerified && <VerifiedBadge size="sm" className="ml-2" />}
          </div>
          {title && (
            <div className="font-semibold text-white/95 truncate drop-shadow" style={{ fontSize: FONT.body }}>
              {title}
            </div>
          )}
          <div className="flex items-center gap-2 text-white/90">
            <Car className="w-5 h-5" />
            <span className="font-bold truncate" style={{ fontSize: FONT.secondary }}>{vehicleName || 'Vehicle'}</span>
          </div>
        </>
      )}

      {normalizedIndex === 1 && (
        <>
          <div className="font-bold text-white drop-shadow-lg truncate" style={{ fontSize: FONT.headline }}>
            {vehicleName || 'Vehicle'}
          </div>
          {location && (
            <div className="flex items-center gap-1 text-white/90" style={{ fontSize: FONT.body }}>
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{location}</span>
            </div>
          )}
        </>
      )}

      {normalizedIndex === 2 && (
        <>
          {rating !== undefined && rating > 0 ? (
            <RatingDisplay rating={rating} size="lg" className="text-white" />
          ) : (
            <div className="flex items-center gap-2 text-white/90">
              <Car className="w-5 h-5" />
              <span className="font-bold truncate" style={{ fontSize: FONT.secondary }}>{vehicleName || 'Vehicle'}</span>
            </div>
          )}
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-white/90" style={{ fontSize: FONT.secondary }}>
              ${price.toLocaleString()}
            </span>
            <span className="text-white/80" style={{ fontSize: FONT.meta }}>{priceLabel}</span>
          </div>
          {location && (
            <div className="flex items-center gap-1 text-white/80" style={{ fontSize: FONT.meta }}>
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </div>
          )}
        </>
      )}

      {normalizedIndex === 3 && (
        <>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-white drop-shadow-lg" style={{ fontSize: FONT.headline }}>
              ${price.toLocaleString()}
            </span>
            <span className="text-white/80" style={{ fontSize: FONT.meta }}>{priceLabel}</span>
            {isVerified && <VerifiedBadge size="sm" className="ml-2" />}
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <Car className="w-4 h-4" />
            <span className="font-semibold truncate" style={{ fontSize: FONT.body }}>{vehicleName || 'Vehicle'}</span>
          </div>
          {(location || (rating !== undefined && rating > 0)) && (
            <div className="flex items-center justify-between">
              {location && (
                <span className="flex items-center gap-1 text-white/80" style={{ fontSize: FONT.meta }}>
                  <MapPin className="w-3.5 h-3.5" />
                  {location}
                </span>
              )}
              {rating !== undefined && rating > 0 && (
                <RatingDisplay rating={rating} size="sm" className="text-white" />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
});

VehicleCardInfo.displayName = 'VehicleCardInfo';

// ============================================
// SERVICE/WORKER CARD INFO
// ============================================

interface ServiceCardInfoProps extends CardInfoProps {
  title?: string;
  hourlyRate?: number;
  pricingUnit?: string;
  serviceName: string;
  name?: string;
  location?: string;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  photoIndex?: number;
}

export const ServiceCardInfo = memo(({
  title,
  hourlyRate,
  pricingUnit = 'hr',
  serviceName,
  name,
  location,
  isVerified,
  rating,
  reviewCount,
  className,
  photoIndex = 0,
}: ServiceCardInfoProps) => {
  const unitLabel = pricingUnit === 'session' ? '/session' : pricingUnit === 'day' ? '/day' : pricingUnit === 'project' ? '/project' : pricingUnit === 'month' ? '/mo' : `/${pricingUnit}`;

  // Distinct slice per photo; nothing on photo 4+ so they stay clean.
  if (photoIndex >= 3) {
    return null;
  }
  const normalizedIndex = photoIndex;

  return (
    <div className={cn("space-y-1", className)}>
      {normalizedIndex === 0 && (
        <>
          {hourlyRate !== undefined && (
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-white drop-shadow-lg" style={{ fontSize: FONT.headline }}>
                ${hourlyRate}
              </span>
              <span className="text-white/80" style={{ fontSize: FONT.meta }}>{unitLabel}</span>
              {isVerified && <VerifiedBadge size="sm" className="ml-2" />}
            </div>
          )}
          {title && (
            <div className="font-semibold text-white/95 truncate drop-shadow" style={{ fontSize: FONT.body }}>
              {title}
            </div>
          )}
          <div className="flex items-center gap-2 text-white/90">
            <Briefcase className="w-5 h-5" />
            <span className="font-bold" style={{ fontSize: FONT.secondary }}>{serviceName}</span>
          </div>
        </>
      )}

      {normalizedIndex === 1 && (
        <>
          <div className="font-bold text-white drop-shadow-lg" style={{ fontSize: FONT.headline }}>
            {serviceName}
          </div>
          {name && (
            <div className="text-white/90 font-medium" style={{ fontSize: FONT.body }}>{name}</div>
          )}
          {location && (
            <div className="flex items-center gap-1 text-white/80" style={{ fontSize: FONT.body }}>
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{location}</span>
            </div>
          )}
        </>
      )}

      {normalizedIndex === 2 && (
        <>
          {rating !== undefined && rating > 0 ? (
            <>
              <RatingDisplay rating={rating} reviewCount={reviewCount} size="lg" className="text-white" />
              <div className="text-white/90 font-medium" style={{ fontSize: FONT.body }}>{serviceName}</div>
            </>
          ) : (
            <>
              <div className="font-bold text-white drop-shadow-lg" style={{ fontSize: FONT.headline }}>{serviceName}</div>
              {name && <div className="text-white/90 font-medium" style={{ fontSize: FONT.body }}>{name}</div>}
            </>
          )}
          {location && (
            <div className="flex items-center gap-1 text-white/80" style={{ fontSize: FONT.meta }}>
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </div>
          )}
        </>
      )}

      {normalizedIndex === 3 && (
        <>
          {hourlyRate !== undefined && (
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-white drop-shadow-lg" style={{ fontSize: FONT.headline }}>
                ${hourlyRate}
              </span>
              <span className="text-white/80" style={{ fontSize: FONT.meta }}>{unitLabel}</span>
              {isVerified && <VerifiedBadge size="sm" className="ml-2" />}
            </div>
          )}
          <div className="flex items-center gap-2 text-white/90">
            <Briefcase className="w-4 h-4" />
            <span className="font-semibold" style={{ fontSize: FONT.body }}>{serviceName}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {name && (
                <span className="text-white/90 font-medium" style={{ fontSize: FONT.meta }}>{name}</span>
              )}
              {location && (
                <span className="flex items-center gap-1 text-white/70" style={{ fontSize: FONT.meta }}>
                  <MapPin className="w-3 h-3" />
                  {location}
                </span>
              )}
            </div>
            {rating !== undefined && rating > 0 && (
              <RatingDisplay rating={rating} reviewCount={reviewCount} size="sm" className="text-white" />
            )}
          </div>
        </>
      )}
    </div>
  );
});

ServiceCardInfo.displayName = 'ServiceCardInfo';

// ============================================
// CLIENT PROFILE CARD INFO (for owners)
// ============================================

interface ClientCardInfoProps extends CardInfoProps {
  name?: string;
  age?: number;
  budgetMin?: number;
  budgetMax?: number;
  location?: string;
  occupation?: string;
  isVerified?: boolean;
  photoIndex?: number;
  workSchedule?: string;
}

export const ClientCardInfo = memo(({
  name,
  age,
  budgetMin,
  budgetMax,
  location,
  occupation,
  isVerified,
  className,
  photoIndex = 0,
  workSchedule,
}: ClientCardInfoProps) => {
  const budgetText = budgetMin && budgetMax
    ? `$${budgetMin.toLocaleString()} - $${budgetMax.toLocaleString()}`
    : budgetMax
    ? `Up to $${budgetMax.toLocaleString()}`
    : budgetMin
    ? `From $${budgetMin.toLocaleString()}`
    : null;

  // Distinct slice per photo; nothing on photo 4+ so they stay clean.
  if (photoIndex >= 3) {
    return null;
  }
  const normalizedIndex = photoIndex;

  return (
    <div className={cn("space-y-1", className)}>
      {normalizedIndex === 0 && (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-white drop-shadow-lg" style={{ fontSize: FONT.headline }}>
              {name || 'Client'}
            </span>
            {age && <span className="text-white/80" style={{ fontSize: FONT.secondary }}>{age}</span>}
            {isVerified && <VerifiedBadge size="sm" className="ml-1" />}
          </div>
          {occupation && (
            <div className="flex items-center gap-1 text-white/90" style={{ fontSize: FONT.body }}>
              <Briefcase className="w-4 h-4" />
              <span className="font-medium">{occupation}</span>
            </div>
          )}
        </>
      )}

      {normalizedIndex === 1 && (
        <>
          {budgetText && (
            <>
              <div className="text-white/80 font-medium" style={{ fontSize: FONT.secondary }}>Monthly Budget</div>
              <div className="flex items-center gap-1 text-white/90">
                <DollarSign className="w-5 h-5" />
                <span className="font-bold" style={{ fontSize: FONT.headline }}>{budgetText}</span>
              </div>
            </>
          )}
          {!budgetText && occupation && (
            <div className="flex items-center gap-2 text-white/90">
              <Briefcase className="w-5 h-5" />
              <span className="font-bold" style={{ fontSize: FONT.secondary }}>{occupation}</span>
            </div>
          )}
        </>
      )}

      {normalizedIndex === 2 && (
        <>
          {location && (
            <div className="flex items-center gap-1 text-white/90">
              <MapPin className="w-5 h-5" />
              <span className="font-bold" style={{ fontSize: FONT.secondary }}>{location}</span>
            </div>
          )}
          {workSchedule && (
            <div className="flex items-center gap-1 text-white/80" style={{ fontSize: FONT.body }}>
              <Briefcase className="w-4 h-4" />
              <span className="font-medium">{workSchedule}</span>
            </div>
          )}
          {!location && !workSchedule && budgetText && (
            <div className="flex items-center gap-1 text-white/90">
              <DollarSign className="w-5 h-5" />
              <span className="font-bold" style={{ fontSize: FONT.secondary }}>{budgetText}</span>
            </div>
          )}
        </>
      )}

      {normalizedIndex === 3 && (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-white drop-shadow-lg" style={{ fontSize: FONT.headline }}>
              {name || 'Client'}
            </span>
            {age && <span className="text-white/80" style={{ fontSize: FONT.secondary }}>{age}</span>}
            {isVerified && <VerifiedBadge size="sm" className="ml-1" />}
          </div>
          {budgetText && (
            <div className="flex items-center gap-1 text-white/90">
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold" style={{ fontSize: FONT.body }}>{budgetText}/mo</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-white/80">
            {occupation && (
              <span className="flex items-center gap-1" style={{ fontSize: FONT.meta }}>
                <Briefcase className="w-3.5 h-3.5" />
                {occupation}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1" style={{ fontSize: FONT.meta }}>
                <MapPin className="w-3.5 h-3.5" />
                {location}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
});

ClientCardInfo.displayName = 'ClientCardInfo';


