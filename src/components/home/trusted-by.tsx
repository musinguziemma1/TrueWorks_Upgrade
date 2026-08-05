"use client";

import { Stethoscope, Heart, Church, GraduationCap, Briefcase, Landmark } from "lucide-react";
import { motion } from "framer-motion";

const sectors = [
  { name: "Hospitals & Clinics", icon: Stethoscope },
  { name: "NGOs & Non-profits", icon: Heart },
  { name: "Churches & Ministries", icon: Church },
  { name: "Schools & Colleges", icon: GraduationCap },
  { name: "SMEs & Startups", icon: Briefcase },
  { name: "Finance Teams", icon: Landmark },
];

const duplicated = [...sectors, ...sectors];

function MarqueeItem({ name, icon: Icon }: { name: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="group mx-3 flex shrink-0 items-center gap-3 rounded-full border border-border/80 bg-gradient-to-b from-white to-surface px-6 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_24px_rgba(212,166,74,0.18)]">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20">
        <Icon className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110" />
      </div>
      <span className="whitespace-nowrap text-sm font-semibold tracking-wide text-muted transition-colors duration-300 group-hover:text-foreground">
        {name}
      </span>
    </div>
  );
}

export default function TrustedBy() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-white py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Trusted by professionals across the Globe
          </span>
        </motion.div>
      </div>

      <div className="relative mt-10">
        <div className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent sm:w-40" />
        <div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent sm:w-40" />

        <div className="group/marquee relative overflow-hidden py-3">
          <div className="trusted-marquee flex w-max group-hover/marquee:[animation-play-state:paused]">
            {duplicated.map((sector, i) => (
              <MarqueeItem key={`${sector.name}-${i}`} name={sector.name} icon={sector.icon} />
            ))}
          </div>
          <style jsx global>{`
            .trusted-marquee {
              animation: trusted-marquee-scroll 32s linear infinite;
            }
            @keyframes trusted-marquee-scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
          `}</style>
        </div>
      </div>
    </section>
  );
}
