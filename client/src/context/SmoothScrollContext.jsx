import React, { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SmoothScrollContext = createContext({
  lenis: null,
  scrollTo: () => {},
  stopScroll: () => {},
  startScroll: () => {},
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

export const SmoothScrollProvider = ({ children }) => {
  const lenisRef = useRef(null);

  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 860 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0);

    // 1. Initialize Lenis:
    // On mobile touch: Disable virtual touch scroll interception so native 120Hz kinetic scroll runs smoothly
    // On desktop/laptop: Use refined smooth wheel physics
    const lenis = new Lenis({
      duration: isMobile ? 0.6 : 0.95,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: !isMobile,
      wheelMultiplier: 0.85,
      syncTouch: false,
      touchMultiplier: isMobile ? 0 : 1.0,
      infinite: false,
    });

    lenisRef.current = lenis;

    // 2. Synchronize Lenis scroll positions directly into GSAP ScrollTrigger
    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    // 3. Delegate RAF loop to GSAP ticker with stable lag smoothing
    const updateGsapTicker = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateGsapTicker);
    // lagSmoothing(500, 33) prevents frame jerk during momentary GC or render pauses
    gsap.ticker.lagSmoothing(500, 33);

    // Initial update
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(updateGsapTicker);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = (target, options = {}) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        offset: options.offset || 0,
        duration: options.duration || 1.0,
        easing: options.easing,
      });
    } else {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const stopScroll = () => {
    lenisRef.current?.stop();
    document.body.classList.add('lenis-stopped');
  };

  const startScroll = () => {
    lenisRef.current?.start();
    document.body.classList.remove('lenis-stopped');
  };

  return (
    <SmoothScrollContext.Provider
      value={{
        lenis: lenisRef.current,
        scrollTo,
        stopScroll,
        startScroll,
      }}
    >
      {children}
    </SmoothScrollContext.Provider>
  );
};
