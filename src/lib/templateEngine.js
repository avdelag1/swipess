/**
 * SwipesS Template Engine
 * Generates professional listing descriptions without external APIs
 * Produces natural-sounding, varied content for properties, vehicles, and worker services
 */

// Utility function to randomly select from array
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Utility function to select variation based on hash (deterministic per listing)
const deterministicChoice = (arr, seed) => {
  const hash = Math.abs(seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0));
  return arr[hash % arr.length];
};

/**
 * Generate property listing (apartments, houses, rooms, coworking)
 */
export function generatePropertyListing(data) {
  const {
    propertyType,
    bedrooms,
    bathrooms,
    location,
    price,
    listingMode, // 'rent' or 'buy'
    availableDate,
    squareFootage,
    features = [], // ['parking', 'petFriendly', 'furnished', etc.]
    additionalNotes = ''
  } = data;

  // Generate title
  const title = generatePropertyTitle(data);

  // Build opening line based on property type and location
  const openings = {
    apartment: [
      `Welcome to your new home in ${location}.`,
      `Discover comfortable living in the heart of ${location}.`,
      `This inviting apartment in ${location} is ready for you.`,
      `Your ${location} lifestyle starts here.`
    ],
    house: [
      `Presenting a beautiful home in ${location}.`,
      `Welcome to this charming residence in ${location}.`,
      `Discover your dream home in ${location}.`,
      `This stunning property in ${location} awaits.`
    ],
    room: [
      `A welcoming room in ${location} is now available.`,
      `Comfortable living awaits in this ${location} room.`,
      `Find your perfect space in ${location}.`,
      `This cozy room in ${location} could be yours.`
    ],
    coworking: [
      `Professional workspace in ${location} now available.`,
      `Elevate your productivity in this ${location} space.`,
      `Your ideal work environment in ${location}.`,
      `Premium coworking space in the heart of ${location}.`
    ]
  };

  const opening = deterministicChoice(
    openings[propertyType] || openings.apartment,
    location + propertyType
  );

  // Build space description
  let spaceDescription = '';
  if (propertyType !== 'coworking') {
    if (bedrooms && bathrooms) {
      const bedroomText = bedrooms === 1 ? 'bedroom' : 'bedrooms';
      const bathroomText = bathrooms === 1 ? 'bathroom' : 'bathrooms';

      const spacePhrases = [
        `This ${bedrooms > 2 ? 'spacious' : 'well-designed'} ${bedrooms}-${bedroomText}, ${bathrooms}-${bathroomText} ${propertyType} offers`,
        `Featuring ${bedrooms} ${bedroomText} and ${bathrooms} ${bathroomText}, this ${propertyType} provides`,
        `The ${bedrooms}-${bedroomText}, ${bathrooms}-${bathroomText} layout delivers`
      ];

      spaceDescription = deterministicChoice(spacePhrases, `${bedrooms}${bathrooms}`);

      if (squareFootage) {
        spaceDescription += ` ${squareFootage} square feet of comfortable living space.`;
      } else {
        spaceDescription += ' ample room for your lifestyle.';
      }
    } else if (propertyType === 'room') {
      spaceDescription = 'The room provides a private, comfortable space perfect for your needs.';
    }
  } else {
    // Coworking space description
    if (squareFootage) {
      spaceDescription = `This ${squareFootage} square foot workspace is designed for productivity and collaboration.`;
    } else {
      spaceDescription = 'The space is thoughtfully designed for modern professionals.';
    }
  }

  // Build features description
  let featuresText = '';
  if (features.length > 0) {
    const featureDescriptions = {
      parking: 'Parking included for your convenience',
      petFriendly: 'Pet owners welcome',
      furnished: 'Fully furnished and move-in ready',
      utilities: 'Utilities included in rent',
      laundry: 'In-unit laundry available',
      gym: 'Access to fitness facilities',
      pool: 'Enjoy the community pool',
      balcony: 'Private balcony with great views',
      dishwasher: 'Modern kitchen with dishwasher',
      airConditioning: 'Central air conditioning',
      heating: 'Efficient heating system',
      hardwood: 'Beautiful hardwood floors throughout',
      updated: 'Recently updated with modern finishes',
      storage: 'Ample storage space',
      security: 'Secure building with controlled access'
    };

    const highlightedFeatures = features
      .slice(0, 3)
      .map(f => featureDescriptions[f] || f)
      .filter(Boolean);

    if (highlightedFeatures.length > 0) {
      if (highlightedFeatures.length === 1) {
        featuresText = `${highlightedFeatures[0]}.`;
      } else if (highlightedFeatures.length === 2) {
        featuresText = `${highlightedFeatures[0]}, and ${highlightedFeatures[1].toLowerCase()}.`;
      } else {
        const last = highlightedFeatures.pop();
        featuresText = `${highlightedFeatures.join(', ')}, and ${last.toLowerCase()}.`;
      }
    }
  }

  // Build location benefits
  const locationBenefits = generateLocationBenefits(location, propertyType);

  // Build availability and pricing text
  const priceText = listingMode === 'rent'
    ? `$${price.toLocaleString()}/month`
    : `$${price.toLocaleString()}`;

  let availabilityText = '';
  if (availableDate) {
    const date = new Date(availableDate);
    const isImmediate = date <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (isImmediate) {
      availabilityText = 'Available immediately for move-in.';
    } else {
      const month = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      availabilityText = `Available starting ${month}.`;
    }
  }

  // Combine into full description
  const description = [
    opening,
    spaceDescription,
    featuresText,
    locationBenefits,
    additionalNotes,
    `Priced at ${priceText}.`,
    availabilityText,
    propertyType !== 'coworking'
      ? 'Schedule a viewing today to experience this property firsthand.'
      : 'Contact us to arrange a tour of the space.'
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { title, description };
}

function generatePropertyTitle(data) {
  const { propertyType, bedrooms, location, features, listingMode } = data;

  // Key features for title
  const titleFeatures = [];
  if (features.includes('petFriendly')) titleFeatures.push('Pet-Friendly');
  if (features.includes('parking')) titleFeatures.push('Parking');
  if (features.includes('furnished')) titleFeatures.push('Furnished');
  if (features.includes('updated')) titleFeatures.push('Renovated');

  const featureText = titleFeatures.slice(0, 2).join(' • ');

  if (propertyType === 'coworking') {
    return featureText
      ? `${featureText} Coworking Space in ${location}`
      : `Professional Coworking Space - ${location}`;
  }

  if (propertyType === 'room') {
    return featureText
      ? `Private Room in ${location} • ${featureText}`
      : `Comfortable Room Available in ${location}`;
  }

  const bedroomText = bedrooms ? `${bedrooms}BR ` : '';
  const propertyTypeTitle = propertyType.charAt(0).toUpperCase() + propertyType.slice(1);

  if (featureText) {
    return `${bedroomText}${propertyTypeTitle} in ${location} • ${featureText}`;
  }

  return `${bedroomText}${propertyTypeTitle} in ${location}`;
}

function generateLocationBenefits(location, propertyType) {
  // This is a simple implementation. In production, you might have a database
  // of location characteristics or integrate with a location API
  const locationLower = location.toLowerCase();

  const benefitTemplates = {
    downtown: 'Located in the heart of downtown with easy access to dining, entertainment, and public transportation.',
    urban: 'Urban living at its finest with walkable streets and vibrant neighborhood energy.',
    suburban: 'Enjoy the peaceful suburban setting while staying connected to city amenities.',
    central: 'Centrally located for convenient access to everything you need.',
    default: `The ${location} location offers a great balance of accessibility and neighborhood character.`
  };

  if (locationLower.includes('downtown')) return benefitTemplates.downtown;
  if (locationLower.includes('suburb')) return benefitTemplates.suburban;
  if (locationLower.includes('central')) return benefitTemplates.central;

  return benefitTemplates.default;
}

/**
 * Generate vehicle listing (cars, motorcycles, bicycles)
 */
export function generateVehicleListing(data) {
  const {
    vehicleType,
    year,
    make,
    model,
    condition,
    mileage,
    price,
    listingMode,
    location,
    features = [],
    additionalNotes = ''
  } = data;

  const title = generateVehicleTitle(data);

  // Opening lines based on vehicle type
  const openings = {
    car: [
      `This ${year} ${make} ${model} is ready for its next owner.`,
      `Presenting a well-maintained ${year} ${make} ${model}.`,
      `Your next vehicle awaits: ${year} ${make} ${model}.`,
      `Discover this reliable ${year} ${make} ${model}.`
    ],
    motorcycle: [
      `Experience the thrill of this ${year} ${make} ${model}.`,
      `Ride in style with this ${year} ${make} ${model}.`,
      `This ${year} ${make} ${model} delivers performance and excitement.`,
      `Premium riding experience: ${year} ${make} ${model}.`
    ],
    bicycle: [
      `This ${year} ${make} ${model} is perfect for your riding needs.`,
      `Get rolling with this quality ${year} ${make} ${model}.`,
      `Well-maintained ${year} ${make} ${model} ready to ride.`,
      `Your cycling adventure starts with this ${year} ${make} ${model}.`
    ]
  };

  const opening = deterministicChoice(
    openings[vehicleType] || openings.car,
    `${make}${model}${year}`
  );

  // Condition and mileage description
  let conditionText = '';
  if (vehicleType !== 'bicycle') {
    if (mileage) {
      const mileageText = `${mileage.toLocaleString()} miles`;
      if (condition === 'excellent') {
        conditionText = `With only ${mileageText} on the odometer and in excellent condition, this vehicle has been meticulously maintained.`;
      } else if (condition === 'good') {
        conditionText = `Currently showing ${mileageText} and in good condition, this vehicle has been well cared for.`;
      } else {
        conditionText = `With ${mileageText}, this vehicle represents solid value.`;
      }
    } else if (condition) {
      conditionText = `The vehicle is in ${condition} condition and has been properly maintained.`;
    }
  } else {
    // Bicycle condition
    if (condition === 'excellent' || condition === 'like-new') {
      conditionText = 'In excellent condition with minimal wear, this bike is ready for many miles ahead.';
    } else if (condition === 'good') {
      conditionText = 'Well-maintained and in good riding condition.';
    }
  }

  // Vehicle-specific features
  let featuresText = '';
  if (features.length > 0) {
    const featureMap = {
      // Car features
      leather: 'Premium leather interior',
      sunroof: 'Sunroof for open-air driving',
      navigation: 'Built-in navigation system',
      backup_camera: 'Backup camera for easy parking',
      bluetooth: 'Bluetooth connectivity',
      heated_seats: 'Heated seats for comfort',
      alloy_wheels: 'Stylish alloy wheels',

      // Motorcycle features
      abs: 'ABS braking system',
      cruise: 'Cruise control',
      windshield: 'Protective windshield',
      saddlebags: 'Storage saddlebags included',

      // Bicycle features
      carbon_frame: 'Lightweight carbon frame',
      disc_brakes: 'Reliable disc brakes',
      suspension: 'Quality suspension system',
      gears: 'Smooth-shifting gear system'
    };

    const highlighted = features
      .slice(0, 3)
      .map(f => featureMap[f] || f)
      .filter(Boolean);

    if (highlighted.length > 0) {
      featuresText = `Key features include ${highlighted.join(', ')}.`;
    }
  }

  // Performance/usage description
  let usageText = '';
  if (vehicleType === 'motorcycle') {
    usageText = 'Perfect for both daily commuting and weekend adventures, this motorcycle offers an engaging riding experience.';
  } else if (vehicleType === 'bicycle') {
    usageText = 'Ideal for commuting, fitness rides, or leisurely weekend outings.';
  } else {
    usageText = 'This vehicle offers reliable transportation with a comfortable driving experience.';
  }

  // Pricing
  const priceText = listingMode === 'rent'
    ? `Available for $${price.toLocaleString()}/day`
    : `Priced at $${price.toLocaleString()}`;

  // Combine description
  const description = [
    opening,
    conditionText,
    featuresText,
    usageText,
    additionalNotes,
    `${priceText} and located in ${location}.`,
    listingMode === 'rent'
      ? 'Contact us to arrange your rental period.'
      : 'Schedule a test ride or viewing today.'
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { title, description };
}

function generateVehicleTitle(data) {
  const { year, make, model, condition, listingMode } = data;

  const conditionBadge = condition === 'excellent' || condition === 'like-new'
    ? ' • Excellent Condition'
    : '';

  const modeText = listingMode === 'rent' ? ' (For Rent)' : '';

  return `${year} ${make} ${model}${conditionBadge}${modeText}`;
}

/**
 * Generate worker service listing
 */
export function generateWorkerListing(data) {
  const {
    serviceCategory,
    yearsExperience,
    serviceArea,
    pricing,
    availability,
    specializations = [],
    certifications = [],
    languages = [],
    additionalNotes = ''
  } = data;

  const title = generateWorkerTitle(data);

  // Opening based on service and experience
  const experienceText = yearsExperience > 10
    ? 'seasoned professional'
    : yearsExperience > 5
    ? 'experienced specialist'
    : yearsExperience > 2
    ? 'skilled professional'
    : 'dedicated professional';

  const serviceName = formatServiceName(serviceCategory);

  const opening = `${experienceText.charAt(0).toUpperCase() + experienceText.slice(1)} ${serviceName} serving ${serviceArea} with ${yearsExperience} ${yearsExperience === 1 ? 'year' : 'years'} of experience.`;

  // Build expertise section
  let expertiseText = '';
  if (specializations.length > 0) {
    const specList = specializations.slice(0, 3).join(', ');
    expertiseText = `Specializing in ${specList}, I bring expertise and attention to detail to every job.`;
  } else {
    expertiseText = `I bring professional expertise and attention to detail to every project.`;
  }

  // Certifications and credentials
  let credentialsText = '';
  if (certifications.length > 0) {
    credentialsText = `Fully certified and insured, with credentials including ${certifications.slice(0, 2).join(' and ')}.`;
  }

  // Service approach
  const approachTemplates = {
    cleaner: 'My approach focuses on thoroughness and respect for your space, ensuring every corner meets high standards.',
    mechanic: 'I diagnose issues accurately and explain repairs clearly, so you understand exactly what your vehicle needs.',
    electrician: 'Safety and code compliance are my top priorities, along with clean, professional workmanship.',
    plumber: 'From routine maintenance to emergency repairs, I respond promptly and work efficiently to minimize disruption.',
    chef: 'I create memorable dining experiences with fresh ingredients and attention to your preferences.',
    driver: 'Reliable, punctual, and professional service with a focus on safety and comfort.',
    default: 'My commitment is to deliver quality results and excellent service on every job.'
  };

  const approachText = approachTemplates[serviceCategory] || approachTemplates.default;

  // Pricing
  let pricingText = '';
  if (pricing) {
    if (typeof pricing === 'object') {
      pricingText = `Services start at $${pricing.starting}/hour with flexible packages available.`;
    } else {
      pricingText = `Services available at $${pricing}/hour.`;
    }
  }

  // Availability
  let availabilityText = '';
  if (availability) {
    if (typeof availability === 'object') {
      const days = availability.days || 'weekdays';
      const hours = availability.hours || 'standard hours';
      availabilityText = `Available ${days} during ${hours}.`;
    } else {
      availabilityText = `Available ${availability}.`;
    }
  }

  // Languages
  let languagesText = '';
  if (languages.length > 1) {
    languagesText = `Fluent in ${languages.join(' and ')}.`;
  }

  // Combine description
  const description = [
    opening,
    expertiseText,
    credentialsText,
    approachText,
    additionalNotes,
    pricingText,
    availabilityText,
    languagesText,
    'Contact me today to discuss your needs and schedule service.'
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { title, description };
}

function generateWorkerTitle(data) {
  const { serviceCategory, yearsExperience, serviceArea, certifications = [] } = data;

  const serviceName = formatServiceName(serviceCategory);
  const experienceBadge = yearsExperience >= 10 ? 'Experienced ' : '';
  const certBadge = certifications.length > 0 ? ' • Certified' : '';

  return `${experienceBadge}${serviceName} in ${serviceArea}${certBadge}`;
}

function formatServiceName(category) {
  const serviceNames = {
    cleaner: 'House Cleaner',
    mechanic: 'Auto Mechanic',
    electrician: 'Electrician',
    plumber: 'Plumber',
    chef: 'Personal Chef',
    driver: 'Professional Driver',
    handyman: 'Handyman',
    landscaper: 'Landscaper',
    painter: 'Painter',
    tutor: 'Tutor',
    caregiver: 'Caregiver',
    petcare: 'Pet Care Specialist'
  };

  return serviceNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

// Export utility functions for testing
export { randomChoice, deterministicChoice };
