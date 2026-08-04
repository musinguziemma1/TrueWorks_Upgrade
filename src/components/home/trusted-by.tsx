"use client";

import { Stethoscope, Heart, Church, GraduationCap, Briefcase, Landmark } from "lucide-react";
import { motion } from "framer-motion";

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

const sectors = [
  { name: "Hospitals & Clinics", icon: Stethoscope },
  { name: "NGOs & Non-profits", icon: Heart },
  { name: "Churches & Ministries", icon: Church },
  { name: "Schools & Colleges", icon: GraduationCap },
  { name: "SMEs & Startups", icon: Briefcase },
  { name: "Finance Teams", icon: Landmark },
];

export default function TrustedBy() {
  return (
    <section className="border-b border-border bg-white py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Trusted by professionals across the Globe
          </p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {sectors.map((sector) => (
              <div
                key={sector.name}
                className="flex items-center gap-2.5 text-muted/80 transition-colors hover:text-primary"
              >
                <sector.icon className="h-5 w-5 text-primary/50" />
                <span className="text-sm font-semibold tracking-wide">{sector.name}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
