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
import { MapPin, DollarSign, Bed, Bath, Car, Bike, Briefcase, Anchor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerifiedBadge, RatingDisplay } from './TrustSignals';

interface CardInfoProps {
  className?: string;
}

// ============================================
// PROPERTY CARD INFO
// ============================================

interface PropertyCardInfoProps extends CardInfoProps {
  price: number;
  priceType?: 'month' | 'night' | 'year';
  propertyType?: string;
  beds?: number;
  baths?: number;
  location?: string;
  isVerified?: boolean;
  rating?: number;
  photoIndex?: number;
}

export const PropertyCardInfo = memo(({
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
  const priceLabel = priceType === 'month' ? '/mo' : priceType === 'night' ? '/night' : '/yr';

  // Normalize photoIndex to cycle through 0-3
  const normalizedIndex = photoIndex % 4;

  return (
    <div className={cn("space-y-1", className)}>
      {/* Photo 0: Price + Property Type */}
      {normalizedIndex === 0 && (
        <>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              ${price.toLocaleString()}
            </span>
            <span className="text-sm text-white/80">{priceLabel}</span>
            {isVerified && <VerifiedBadge size="sm" className="ml-2" />}
          </div>
          {propertyType && (
            <div className="flex items-center gap-3 text-white/90">
              <span className="text-base font-semibold">{propertyType}</span>
            </div>
          )}
        </>
      )}

      {/* Photo 1: Beds/Baths + Location */}
      {normalizedIndex === 1 && (
        <>
          <div className="flex items-center gap-3 text-white/90">
            {beds !== undefined && (
              <span className="flex items-center gap-1 text-lg">
                <Bed className="w-5 h-5" />
                <span className="font-bold">{beds} {beds === 1 ? 'Bed' : 'Beds'}</span>
              </span>
            )}
            {baths !== undefined && (
              <span className="flex items-center gap-1 text-lg">
                <Bath className="w-5 h-5" />
                <span className="font-bold">{baths} {baths === 1 ? 'Bath' : 'Baths'}</span>
              </span>
            )}
          </div>
          {location && (
            <div className="flex items-center gap-1 text-base text-white/90">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{location}</span>
            </div>
          )}
        </>
      )}

      {/* Photo 2: Property Type + Location (alternative view) */}
      {normalizedIndex === 2 && (
        <>
          {propertyType && (
            <div className="text-2xl font-bold text-white drop-shadow-lg">
              {propertyType}
            </div>
          )}
          {location && (
            <div className="flex items-center gap-1 text-base text-white/90">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{location}</span>
            </div>
          )}
          {rating !== undefined && rating > 0 && (
            <RatingDisplay rating={rating} size="md" className="text-white" />
          )}
        </>
      )}

      {/* Photo 3+: Full Summary */}
      {normalizedIndex === 3 && (
        <>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              ${price.toLocaleString()}
            </span>
            <span className="text-sm text-white/80">{priceLabel}</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            {propertyType && (
              <span className="text-base font-semibold">{propertyType}</span>
            )}
            {beds !== undefined && (
              <span className="flex items-center gap-1 text-sm">
                <Bed className="w-4 h-4" />
                {beds}
              </span>
            )}
            {baths !== undefined && (
              <span className="flex items-center gap-1 text-sm">
                <Bath className="w-4 h-4" />
                {baths}
              </span>
            )}
          </div>
          {(location || (rating !== undefined && rating > 0)) && (
            <div className="flex items-center justify-between">
              {location && (
                <span className="flex items-center gap-1 text-sm text-white/80">
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

PropertyCardInfo.displayName = 'PropertyCardInfo';

// ============================================
// VEHICLE CARD INFO
// ============================================

interface VehicleCardInfoProps extends CardInfoProps {
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

  // Normalize photoIndex to cycle through 0-3
  const normalizedIndex = photoIndex % 4;

  return (
    <div className={cn("space-y-1", className)}>
      {/* Photo 0: Price + Vehicle Name */}
      {normalizedIndex === 0 && (
        <>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              ${price.toLocaleString()}
            </span>
            <span className="text-sm text-white/80">{priceLabel}</span>
            {isVerified && <VerifiedBadge size="sm" className="ml-2" />}
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <Car className="w-5 h-5" />
            <span className="text-lg font-bold truncate">{vehicleName || 'Vehicle'}</span>
          </div>
        </>
      )}

      {/* Photo 1: Vehicle Details + Location */}
      {normalizedIndex === 1 && (
        <>
          <div className="text-2xl font-bold text-white drop-shadow-lg truncate">
            {vehicleName || 'Vehicle'}
          </div>
          {location && (
            <div className="flex items-center gap-1 text-base text-white/90">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{location}</span>
            </div>
          )}
        </>
      )}

      {/* Photo 2: Rating + Price Info */}
      {normalizedIndex === 2 && (
        <>
          {rating !== undefined && rating > 0 ? (
            <RatingDisplay rating={rating} size="lg" className="text-white" />
          ) : (
            <div className="flex items-center gap-2 text-white/90">
              <Car className="w-5 h-5" />
              <span className="text-lg font-bold truncate">{vehicleName || 'Vehicle'}</span>
            </div>
          )}
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white/90">
              ${price.toLocaleString()}
            </span>
            <span className="text-sm text-white/80">{priceLabel}</span>
          </div>
          {location && (
            <div className="flex items-center gap-1 text-sm text-white/80">
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </div>
          )}
        </>
      )}

      {/* Photo 3+: Full Summary */}
      {normalizedIndex === 3 && (
        <>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              ${price.toLocaleString()}
            </span>
            <span className="text-sm text-white/80">{priceLabel}</span>
            {isVerified && <VerifiedBadge size="sm" className="ml-2" />}
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <Car className="w-4 h-4" />
            <span className="text-base font-semibold truncate">{vehicleName || 'Vehicle'}</span>
          </div>
          {(location || (rating !== undefined && rating > 0)) && (
            <div className="flex items-center justify-between">
              {location && (
                <span className="flex items-center gap-1 text-sm text-white/80">
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
  hourlyRate?: number;
  serviceName: string;
  name?: string;
  location?: string;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  photoIndex?: number;
}

export const ServiceCardInfo = memo(({
  hourlyRate,
  serviceName,
  name,
  location,
  isVerified,
  rating,
  reviewCount,
  className,
  photoIndex = 0,
}: ServiceCardInfoProps) => {
  // Normalize photoIndex to cycle through 0-3
  const normalizedIndex = photoIndex % 4;

  return (
    <div className={cn("space-y-1", className)}>
      {/* Photo 0: Rate + Service Name */}
      {normalizedIndex === 0 && (
        <>
          {hourlyRate !== undefined && (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white drop-shadow-lg">
                ${hourlyRate}
              </span>
              <span className="text-sm text-white/80">/hr</span>
              {isVerified && <VerifiedBadge size="sm" className="ml-2" />}
            </div>
          )}
          <div className="flex items-center gap-2 text-white/90">
            <Briefcase className="w-5 h-5" />
            <span className="text-lg font-bold">{serviceName}</span>
          </div>
        </>
      )}

      {/* Photo 1: Provider Name + Location */}
      {normalizedIndex === 1 && (
        <>
          <div className="text-2xl font-bold text-white drop-shadow-lg">
            {serviceName}
          </div>
          {name && (
            <div className="text-base text-white/90 font-medium">{name}</div>
          )}
          {location && (
            <div className="flex items-center gap-1 text-base text-white/80">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{location}</span>
            </div>
          )}
        </>
      )}

      {/* Photo 2: Rating + Reviews */}
      {normalizedIndex === 2 && (
        <>
          {rating !== undefined && rating > 0 ? (
            <>
              <RatingDisplay rating={rating} reviewCount={reviewCount} size="lg" className="text-white" />
              <div className="text-base text-white/90 font-medium">{serviceName}</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-white drop-shadow-lg">{serviceName}</div>
              {name && <div className="text-base text-white/90 font-medium">{name}</div>}
            </>
          )}
          {location && (
            <div className="flex items-center gap-1 text-sm text-white/80">
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </div>
          )}
        </>
      )}

      {/* Photo 3+: Full Summary */}
      {normalizedIndex === 3 && (
        <>
          {hourlyRate !== undefined && (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white drop-shadow-lg">
                ${hourlyRate}
              </span>
              <span className="text-sm text-white/80">/hr</span>
              {isVerified && <VerifiedBadge size="sm" className="ml-2" />}
            </div>
          )}
          <div className="flex items-center gap-2 text-white/90">
            <Briefcase className="w-4 h-4" />
            <span className="text-base font-semibold">{serviceName}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {name && (
                <span className="text-sm text-white/90 font-medium">{name}</span>
              )}
              {location && (
                <span className="flex items-center gap-1 text-sm text-white/70">
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

  // Normalize photoIndex to cycle through 0-3
  const normalizedIndex = photoIndex % 4;

  return (
    <div className={cn("space-y-1", className)}>
      {/* Photo 0: Name + Age */}
      {normalizedIndex === 0 && (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              {name || 'Client'}
            </span>
            {age && <span className="text-lg text-white/80">{age}</span>}
            {isVerified && <VerifiedBadge size="sm" className="ml-1" />}
          </div>
          {occupation && (
            <div className="flex items-center gap-1 text-base text-white/90">
              <Briefcase className="w-4 h-4" />
              <span className="font-medium">{occupation}</span>
            </div>
          )}
        </>
      )}

      {/* Photo 1: Budget */}
      {normalizedIndex === 1 && (
        <>
          {budgetText && (
            <>
              <div className="text-lg text-white/80 font-medium">Monthly Budget</div>
              <div className="flex items-center gap-1 text-white/90">
                <DollarSign className="w-5 h-5" />
                <span className="text-2xl font-bold">{budgetText}</span>
              </div>
            </>
          )}
          {!budgetText && occupation && (
            <div className="flex items-center gap-2 text-white/90">
              <Briefcase className="w-5 h-5" />
              <span className="text-lg font-bold">{occupation}</span>
            </div>
          )}
        </>
      )}

      {/* Photo 2: Location + Work Schedule */}
      {normalizedIndex === 2 && (
        <>
          {location && (
            <div className="flex items-center gap-1 text-white/90">
              <MapPin className="w-5 h-5" />
              <span className="text-xl font-bold">{location}</span>
            </div>
          )}
          {workSchedule && (
            <div className="flex items-center gap-1 text-base text-white/80">
              <Briefcase className="w-4 h-4" />
              <span className="font-medium">{workSchedule}</span>
            </div>
          )}
          {!location && !workSchedule && budgetText && (
            <div className="flex items-center gap-1 text-white/90">
              <DollarSign className="w-5 h-5" />
              <span className="text-xl font-bold">{budgetText}</span>
            </div>
          )}
        </>
      )}

      {/* Photo 3+: Full Summary */}
      {normalizedIndex === 3 && (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              {name || 'Client'}
            </span>
            {age && <span className="text-lg text-white/80">{age}</span>}
            {isVerified && <VerifiedBadge size="sm" className="ml-1" />}
          </div>
          {budgetText && (
            <div className="flex items-center gap-1 text-white/90">
              <DollarSign className="w-4 h-4" />
              <span className="text-base font-semibold">{budgetText}/mo</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-white/80">
            {occupation && (
              <span className="flex items-center gap-1 text-sm">
                <Briefcase className="w-3.5 h-3.5" />
                {occupation}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1 text-sm">
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
