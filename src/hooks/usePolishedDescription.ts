import { useEffect, useState } from 'react';

/** Clears AI-polished text when underlying chip selections change. */
export function usePolishedDescription(resetKey: string) {
  const [polishedDescription, setPolishedDescription] = useState<string | null>(null);

  useEffect(() => {
    setPolishedDescription(null);
  }, [resetKey]);

  return { polishedDescription, setPolishedDescription };
}