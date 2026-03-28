    getListingFilters: () => {
      const state = get();
      const hasServices = state.categories.includes('services');
      
      return {
        category: state.activeCategory ?? undefined,
        categories: state.categories.map(mapCategoryToDb),
        listingType: state.listingType,
        propertyType: state.propertyTypes.length > 0 ? state.propertyTypes : undefined,
        priceRange: state.priceRange ?? undefined,
        bedrooms: state.bedrooms.length > 0 ? state.bedrooms : undefined,
        bathrooms: state.bathrooms.length > 0 ? state.bathrooms : undefined,
        amenities: state.amenities.length > 0 ? state.amenities : undefined,
        showHireServices: hasServices || undefined,
        clientGender: state.clientGender !== 'any' ? state.clientGender : undefined,
        clientType: state.clientType !== 'all' ? state.clientType : undefined,
        ageRange: state.clientAgeRange ?? undefined,
        budgetRange: state.clientBudgetRange ?? undefined,
        nationalities: state.clientNationalities.length > 0 ? state.clientNationalities : undefined,
        // Distance filters
        radiusKm: state.radiusKm,
        userLatitude: state.userLatitude ?? undefined,
        userLongitude: state.userLongitude ?? undefined,
      };
    },
