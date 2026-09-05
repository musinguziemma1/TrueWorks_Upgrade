'use client';

import dynamic from 'next/dynamic';

// Dynamic import keeps the heavy illustration out of the initial bundle.
const Hero = dynamic(() => import('@/components/hero/Hero'), {
  loading: () => (
    <div className="flex h-[100svh] items-center justify-center bg-[#04101F]">
      <div className="text-white/70 text-sm">Loading…</div>
    </div>
  ),
});

export default function HomeHero() {
  return <Hero />;
}
