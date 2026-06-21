import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export function useRouterDirection() {
  const location = useLocation();
  const navType = useNavigationType();
  const [direction, setDirection] = useState<'push' | 'pop' | 'replace' | 'none'>('none');
  const pathLevel = location.pathname.split('/').filter(Boolean).length;
  const prevLevel = useRef(pathLevel);

  useEffect(() => {
    let newDirection: 'push' | 'pop' | 'replace' | 'none' = 'none';

    if (navType === 'POP') {
      newDirection = 'pop';
    } else if (navType === 'PUSH') {
      if (pathLevel > prevLevel.current) {
        newDirection = 'push';
      } else if (pathLevel < prevLevel.current) {
        newDirection = 'pop';
      } else {
        newDirection = 'push';
      }
    } else if (navType === 'REPLACE') {
      newDirection = 'replace';
    }

    setDirection(newDirection);
    prevLevel.current = pathLevel;

    // Apply attribute to HTML tag for CSS View Transitions
    document.documentElement.setAttribute('data-nav-dir', newDirection);

    // Clean up
    const timeout = setTimeout(() => {
      document.documentElement.setAttribute('data-nav-dir', 'none');
    }, 500);

    return () => clearTimeout(timeout);
  }, [location.pathname, navType, pathLevel]);

  return direction;
}
