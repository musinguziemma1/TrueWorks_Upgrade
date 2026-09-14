"use client";

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Dynamically import the hero slider for better performance
const HeroSlider = dynamic(() => import('@/components/hero/HeroSlider'), {
  loading: () => (
    <div className="h-screen bg-gradient-to-br from-[#04101F] via-[#071A33] to-[#04101F] flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  ),
});

export default function Hero() {
  const router = useRouter();

  const handleExploreClick = () => {
    router.push('/store');
  };

  const handleDemoClick = () => {
    // Scroll to the free-template lead magnet section on the homepage
    const freeSection = document.getElementById('free-template');
    if (freeSection) {
      freeSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/#free-template');
    }
  };

  return (
    <HeroSlider
      onExploreClick={handleExploreClick}
      onDemoClick={handleDemoClick}
      autoPlayDuration={8000}
      enableKeyboard={true}
      enableTouch={true}
    />
  );
}