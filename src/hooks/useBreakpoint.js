import { useState, useEffect } from 'react';

const BREAKPOINTS = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
};

const getBreakpoint = (w) => {
  if (w < 480) return 'xs';
  if (w < 768) return 'sm';
  if (w < 1024) return 'md';
  if (w < 1280) return 'lg';
  if (w < 1536) return 'xl';
  return 'xxl';
};

const useBreakpoint = () => {
  const [width, setWidth] = useState(window.innerWidth);
  const [bp, setBp] = useState(getBreakpoint(window.innerWidth));

  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      setWidth(w);
      setBp(getBreakpoint(w));
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    width,
    bp,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isXs: width < 480,
    isSm: width >= 480 && width < 768,
    isMd: width >= 768 && width < 1024,
    isLg: width >= 1024 && width < 1280,
    isXl: width >= 1280,
  };
};

export default useBreakpoint;