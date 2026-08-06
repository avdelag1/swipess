export interface SwipeLoadingSkeletonProps {
  category?: string;
}

/**
 * Invisible loading state — returns nothing so the user
 * never sees a "website loading" indicator between categories.
 * The persistent dashboard stays visible underneath.
 */
export const SwipeLoadingSkeleton = (_props: SwipeLoadingSkeletonProps) => {
  return null;
};