// Profile similarity scoring for smart recycling

interface UserPreferences {
  likedTraits: Map<string, number>; // trait -> frequency
  dislikedTraits: Map<string, number>;
  budgetRange?: [number, number];
  preferredTypes?: string[];
}

interface Profile {
  budget_max?: number;
  interests?: string[];
  lifestyle_tags?: string[];
  preferred_listing_types?: string[];
  preferred_activities?: string[];
  [key: string]: any;
}

// Analyze user's historical preferences from liked/disliked profiles
export function analyzeUserPreferences(
  likedProfiles: Profile[],
  dislikedProfiles: Profile[]
): UserPreferences {
  const likedTraits = new Map<string, number>();
  const dislikedTraits = new Map<string, number>();
  let minBudget = Infinity;
  let maxBudget = 0;
  const preferredTypes = new Map<string, number>();

  // Analyze liked profiles
  likedProfiles.forEach(profile => {
    // Budget analysis
    if (profile.budget_max) {
      minBudget = Math.min(minBudget, profile.budget_max);
      maxBudget = Math.max(maxBudget, profile.budget_max);
    }

    // Interests
    profile.interests?.forEach(interest => {
      likedTraits.set(interest, (likedTraits.get(interest) || 0) + 1);
    });

    // Lifestyle tags
    profile.lifestyle_tags?.forEach(tag => {
      likedTraits.set(tag, (likedTraits.get(tag) || 0) + 1);
    });

    // Preferred activities
    profile.preferred_activities?.forEach(activity => {
      likedTraits.set(activity, (likedTraits.get(activity) || 0) + 1);
    });

    // Listing types
    profile.preferred_listing_types?.forEach(type => {
      preferredTypes.set(type, (preferredTypes.get(type) || 0) + 1);
    });
  });

  // Analyze disliked profiles
  dislikedProfiles.forEach(profile => {
    profile.interests?.forEach(interest => {
      dislikedTraits.set(interest, (dislikedTraits.get(interest) || 0) + 1);
    });

    profile.lifestyle_tags?.forEach(tag => {
      dislikedTraits.set(tag, (dislikedTraits.get(tag) || 0) + 1);
    });
  });

  const budgetRange: [number, number] | undefined = 
    minBudget !== Infinity ? [minBudget, maxBudget] : undefined;

  const topTypes = Array.from(preferredTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type);

  return {
    likedTraits,
    dislikedTraits,
    budgetRange,
    preferredTypes: topTypes.length > 0 ? topTypes : undefined
  };
}

// Calculate similarity score between profile and user preferences
export function calculateSimilarityScore(
  profile: Profile,
  userPreferences: UserPreferences
): number {
  let score = 0;
  let maxScore = 0;

  // Budget similarity (30% weight)
  if (userPreferences.budgetRange && profile.budget_max) {
    const [minBudget, maxBudget] = userPreferences.budgetRange;
    const budgetRange = maxBudget - minBudget;
    const budgetDiff = Math.abs(profile.budget_max - (minBudget + maxBudget) / 2);
    const budgetScore = Math.max(0, 1 - (budgetDiff / budgetRange));
    score += budgetScore * 30;
  }
  maxScore += 30;

  // Trait matching (40% weight)
  const profileTraits = [
    ...(profile.interests || []),
    ...(profile.lifestyle_tags || []),
    ...(profile.preferred_activities || [])
  ];

  let traitMatchCount = 0;
  let traitPenalty = 0;

  profileTraits.forEach(trait => {
    const likedFrequency = userPreferences.likedTraits.get(trait) || 0;
    const dislikedFrequency = userPreferences.dislikedTraits.get(trait) || 0;

    if (likedFrequency > 0) {
      traitMatchCount += likedFrequency;
    }
    if (dislikedFrequency > 0) {
      traitPenalty += dislikedFrequency;
    }
  });

  const totalLikedTraits = Array.from(userPreferences.likedTraits.values())
    .reduce((sum, freq) => sum + freq, 0);
  
  if (totalLikedTraits > 0) {
    const traitScore = Math.max(0, (traitMatchCount - traitPenalty) / totalLikedTraits);
    score += traitScore * 40;
  }
  maxScore += 40;

  // Type matching (30% weight)
  if (userPreferences.preferredTypes && profile.preferred_listing_types) {
    const typeMatches = profile.preferred_listing_types.filter(type =>
      userPreferences.preferredTypes?.includes(type)
    ).length;

    if (typeMatches > 0) {
      score += (typeMatches / userPreferences.preferredTypes.length) * 30;
    }
  }
  maxScore += 30;

  // Normalize to 0-100 scale
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

// Sort recycled profiles by relevance
export function sortRecycledProfiles<T extends Profile>(
  profiles: T[],
  userPreferences: UserPreferences
): T[] {
  return profiles
    .map(profile => ({
      profile,
      score: calculateSimilarityScore(profile, userPreferences)
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ profile }) => profile);
}
