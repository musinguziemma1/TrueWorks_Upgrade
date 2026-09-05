'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { heroSlides } from './data';
import HeroBackground from './HeroBackground';
import HeroContent from './HeroContent';
import HeroSlide from './HeroSlide';
import HeroProgress from './HeroProgress';
import HeroNavigation from './HeroNavigation';
import HeroIndicators from './HeroIndicators';

interface HeroSliderProps {
  onExploreClick?: () => void;
  onDemoClick?: () => void;
  autoPlayDuration?: number;
  enableKeyboard?: boolean;
  enableTouch?: boolean;
}

export default function HeroSlider({
  onExploreClick,
  onDemoClick,
  autoPlayDuration = 8000,
  enableKeyboard = true,
  enableTouch = true
}: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [canNavigate] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const nextSlide = useCallback(() => {
    if (!canNavigate) return;
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, [canNavigate]);

  const prevSlide = useCallback(() => {
    if (!canNavigate) return;
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, [canNavigate]);

  const goToSlide = useCallback((index: number) => {
    if (!canNavigate) return;
    setCurrentSlide(index);
  }, [canNavigate]);

  useEffect(() => {
    if (!isAutoPlaying || isHovered) return;
    const interval = setInterval(nextSlide, autoPlayDuration);
    return () => clearInterval(interval);
  }, [isAutoPlaying, isHovered, nextSlide, autoPlayDuration]);

  useEffect(() => {
    if (!enableKeyboard) return;
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevSlide();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextSlide();
          break;
        case ' ':
          e.preventDefault();
          setIsAutoPlaying((prev) => !prev);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enableKeyboard, nextSlide, prevSlide]);

  useEffect(() => {
    if (!enableTouch || !containerRef.current) return;
    const container = containerRef.current;
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      endX = e.touches[0].clientX;
      endY = e.touches[0].clientY;
    };
    const handleTouchEnd = () => {
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const minSwipeDistance = 50;
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) prevSlide();
        else nextSlide();
      }
    };
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enableTouch, nextSlide, prevSlide]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 2;
    const y = (clientY / innerHeight - 0.5) * 2;
    const visualElements = document.querySelectorAll('[data-parallax]');
    visualElements.forEach((element) => {
      const intensity = parseFloat(element.getAttribute('data-parallax') || '1');
      const htmlElement = element as HTMLElement;
      htmlElement.style.transform = `translate3d(${x * intensity * 10}px, ${y * intensity * 5}px, 0)`;
    });
  };

  const currentSlideData = heroSlides[currentSlide];

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[100svh] overflow-hidden bg-[#04101F]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      <HeroBackground />

      <div className="relative z-10 grid min-h-[100svh] lg:grid-cols-2">
        <div className="relative flex items-center">
          <HeroContent
            slide={currentSlideData}
            onExploreClick={onExploreClick}
            onDemoClick={onDemoClick}
          />
        </div>

        <div className="relative hidden lg:block" data-parallax="0.5">
          <div className="absolute inset-0">
            <AnimatePresence mode="wait">
              {heroSlides.map(
                (slide, index) =>
                  index === currentSlide && (
                    <HeroSlide key={slide.id} slide={slide} isActive />
                  ),
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom controls — unified bar on mobile, three-column on desktop */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-5 sm:px-8 sm:pb-7">
        {/* Mobile: progress + nav row, indicators hidden (use swipe) */}
        <div className="flex items-center gap-3 lg:hidden">
          <div className="flex-1">
            <HeroProgress
              currentSlide={currentSlide}
              totalSlides={heroSlides.length}
              autoPlay={isAutoPlaying && !isHovered}
              onProgressComplete={nextSlide}
            />
          </div>
          <motion.button
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur transition-all hover:bg-white/10"
            onClick={() => setIsAutoPlaying((p) => !p)}
            whileTap={{ scale: 0.95 }}
            aria-label={isAutoPlaying ? 'Pause autoplay' : 'Resume autoplay'}
          >
            <motion.div
              className={`h-1.5 w-1.5 rounded-full ${isAutoPlaying ? 'bg-emerald-400' : 'bg-white/60'}`}
              animate={isAutoPlaying ? { scale: [1, 1.4, 1] } : { scale: 1 }}
              transition={isAutoPlaying ? { duration: 1, repeat: Infinity } : { duration: 0.2 }}
            />
          </motion.button>
          <HeroNavigation
            currentSlide={currentSlide}
            totalSlides={heroSlides.length}
            onPrevious={prevSlide}
            onNext={nextSlide}
            canNavigate={canNavigate}
            size="sm"
          />
        </div>

        {/* Desktop: 3-column grid (indicators | spacer | autoplay + nav) */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:items-end lg:gap-8">
          <div>
            <HeroIndicators
              currentSlide={currentSlide}
              totalSlides={heroSlides.length}
              onSlideChange={goToSlide}
              slideLabels={heroSlides.map((slide) => slide.theme)}
            />
          </div>
          <div className="flex flex-col items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlideData.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55"
              >
                <span className="font-mono text-accent-light">
                  0{currentSlide + 1}
                </span>
                <span className="h-px w-8 bg-white/20" />
                <span>0{heroSlides.length}</span>
                <span className="ml-1 text-white/40 normal-case tracking-normal">
                  — {currentSlideData.title.trim()}
                </span>
              </motion.div>
            </AnimatePresence>
            <div className="w-full max-w-md">
              <HeroProgress
                currentSlide={currentSlide}
                totalSlides={heroSlides.length}
                autoPlay={isAutoPlaying && !isHovered}
                onProgressComplete={nextSlide}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <motion.button
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur transition-all hover:border-white/25 hover:bg-white/10"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              aria-label={isAutoPlaying ? 'Pause autoplay' : 'Resume autoplay'}
            >
              <motion.div
                className={`h-2 w-2 rounded-full ${isAutoPlaying ? 'bg-emerald-400' : 'bg-rose-400'}`}
                animate={isAutoPlaying ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={isAutoPlaying ? { duration: 1.5, repeat: Infinity } : { duration: 0.2 }}
              />
              {isAutoPlaying ? 'Auto' : 'Paused'}
            </motion.button>
            <HeroNavigation
              currentSlide={currentSlide}
              totalSlides={heroSlides.length}
              onPrevious={prevSlide}
              onNext={nextSlide}
              canNavigate={canNavigate}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Screen-reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Slide {currentSlide + 1} of {heroSlides.length}: {currentSlideData.title}{' '}
        {currentSlideData.subtitle}
      </div>
    </div>
  );
}
