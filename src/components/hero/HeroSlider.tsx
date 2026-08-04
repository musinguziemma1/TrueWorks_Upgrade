'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
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
  const [canNavigate, setCanNavigate] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-advance slides
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

  // Auto play functionality
  useEffect(() => {
    if (!isAutoPlaying || isHovered) return;

    const interval = setInterval(nextSlide, autoPlayDuration);
    return () => clearInterval(interval);
  }, [isAutoPlaying, isHovered, nextSlide, autoPlayDuration]);

  // Keyboard navigation
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
          setIsAutoPlaying(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enableKeyboard, nextSlide, prevSlide]);

  // Touch/swipe support
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

      // Only trigger if horizontal swipe is more significant than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          prevSlide();
        } else {
          nextSlide();
        }
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

  // Mouse parallax effect
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 2;
    const y = (clientY / innerHeight - 0.5) * 2;

    // Apply subtle parallax to visual elements
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
      className="relative w-full h-screen overflow-hidden bg-[#081728]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Background */}
      <HeroBackground />

      {/* Main content grid */}
      <div className="relative z-10 h-full grid lg:grid-cols-2">
        {/* Left: Content */}
        <div className="relative flex items-center">
          <HeroContent
            slide={currentSlideData}
            onExploreClick={onExploreClick}
            onDemoClick={onDemoClick}
          />
        </div>

        {/* Right: Visual */}
        <div className="relative hidden lg:block" data-parallax="0.5">
          <div className="absolute inset-0">
            {heroSlides.map((slide, index) => (
              <HeroSlide
                key={slide.id}
                slide={slide}
                isActive={index === currentSlide}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls overlay */}
      <div className="absolute bottom-8 left-8 right-8 z-20">
        <div className="flex items-center justify-between">
          {/* Left: Slide indicators */}
          <div className="hidden lg:block">
            <HeroIndicators
              currentSlide={currentSlide}
              totalSlides={heroSlides.length}
              onSlideChange={goToSlide}
              slideLabels={heroSlides.map(slide => slide.theme)}
            />
          </div>

          {/* Center: Progress bar (mobile) */}
          <div className="lg:hidden flex-1 mx-8">
            <HeroProgress
              currentSlide={currentSlide}
              totalSlides={heroSlides.length}
              autoPlay={isAutoPlaying && !isHovered}
              onProgressComplete={nextSlide}
            />
          </div>

          {/* Right: Navigation */}
          <div className="flex items-center gap-6">
            {/* Auto play indicator */}
            <motion.button
              className={`
                hidden lg:flex items-center gap-2 px-4 py-2 rounded-full 
                backdrop-blur-xl bg-white/5 border border-white/10
                text-white/70 text-sm font-medium
                transition-all duration-300 hover:bg-white/10
              `}
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className={`w-2 h-2 rounded-full ${
                  isAutoPlaying ? 'bg-green-400' : 'bg-red-400'
                }`}
                animate={{ scale: isAutoPlaying ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 1, repeat: isAutoPlaying ? Infinity : 0 }}
              />
              {isAutoPlaying ? 'Auto' : 'Paused'}
            </motion.button>

            {/* Navigation arrows */}
            <HeroNavigation
              currentSlide={currentSlide}
              totalSlides={heroSlides.length}
              onPrevious={prevSlide}
              onNext={nextSlide}
              canNavigate={canNavigate}
            />
          </div>
        </div>

        {/* Progress bar for desktop */}
        <div className="hidden lg:block mt-6">
          <HeroProgress
            currentSlide={currentSlide}
            totalSlides={heroSlides.length}
            autoPlay={isAutoPlaying && !isHovered}
            onProgressComplete={nextSlide}
          />
        </div>
      </div>

      {/* Accessibility announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Slide {currentSlide + 1} of {heroSlides.length}: {currentSlideData.title} {currentSlideData.subtitle}
      </div>
    </div>
  );
}