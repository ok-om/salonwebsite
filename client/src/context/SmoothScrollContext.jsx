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
    const isMobile = typeof window !== 'undefined' && (
      window.innerWidth < 860 ||
      ('ontouchstart' in window) ||
      navigator.maxTouchPoints > 0
    );

    // On mobile devices, disable Lenis completely so native 120Hz touch kinetic scroll
    // runs purely through the browser and does not conflict with touch gestures or cause reverse snaps.
    if (isMobile) {
      return;
    }

    const lenis = new Lenis({
      duration: 0.95,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.85,
      syncTouch: false,
      touchMultiplier: 1.0,
      infinite: false,
      prevent: (node) => {
        if (!node) return false;
        return (
          node.hasAttribute?.('data-lenis-prevent') ||
          node.closest?.('[data-lenis-prevent="true"]') ||
          node.closest?.('.modal-overlay') ||
          node.closest?.('.modal-content')
        );
      },
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

  const lockCountRef = useRef(0);
  const scrollYRef = useRef(0);

  const stopScroll = () => {
    lockCountRef.current += 1;
    if (lockCountRef.current === 1) {
      scrollYRef.current = window.scrollY || window.pageYOffset || 0;
      lenisRef.current?.stop();
      document.body.classList.add('lenis-stopped');
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
  };

  const startScroll = () => {
    if (lockCountRef.current > 0) {
      lockCountRef.current -= 1;
    }
    if (lockCountRef.current === 0) {
      const top = document.body.style.top;
      document.body.classList.remove('lenis-stopped');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (top) {
        const y = Math.abs(parseInt(top, 10)) || scrollYRef.current || 0;
        window.scrollTo(0, y);
        if (lenisRef.current) {
          lenisRef.current.scrollTo(y, { immediate: true });
        }
      }
      lenisRef.current?.start();
    }
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
