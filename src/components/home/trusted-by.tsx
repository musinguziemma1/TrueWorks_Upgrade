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
    <div className="group flex items-center gap-2.5 shrink-0 px-6 py-3">
      <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 backdrop-blur-md border border-primary/20 shadow-[0_0_12px_rgba(212,166,74,0.15)] transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_rgba(212,166,74,0.35)] group-hover:border-primary/40">
        <Icon className="h-4.5 w-4.5 text-primary transition-all duration-300 group-hover:text-primary/90 group-hover:scale-110" />
      </div>
      <span className="text-sm font-semibold tracking-wide text-muted/80 whitespace-nowrap transition-colors duration-300 group-hover:text-foreground">
        {name}
      </span>
    </div>
  );
}

export default function TrustedBy() {
  return (
    <section className="relative border-b border-border bg-white py-14 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.p
          className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          Trusted by professionals across the Globe
        </motion.p>
      </div>

      <div className="relative mt-8">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[520px] h-[100px] rounded-full bg-gradient-to-r from-primary/[0.06] via-primary/[0.12] to-primary/[0.06] blur-2xl" />
          <div className="absolute w-[340px] h-[70px] rounded-full bg-gradient-to-r from-primary/[0.04] via-primary/[0.08] to-primary/[0.04] blur-xl" />
        </div>

        <div className="relative overflow-hidden py-2" style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)", maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)" }}>
          <motion.div
            className="flex w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 28,
                ease: "linear",
              },
            }}
          >
            {duplicated.map((sector, i) => (
              <MarqueeItem key={`${sector.name}-${i}`} name={sector.name} icon={sector.icon} />
            ))}
          </motion.div>
        </div>
      </div>

    </section>
  );
}
