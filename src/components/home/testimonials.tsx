"use client";

import { useEffect, useState, useCallback } from "react";
import { Quote, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Stars } from "@/components/product/stars";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const testimonials = [
  {
    quote:
      "TrueWorks transformed our financial reporting. The hospital dashboard gives us real-time visibility into KPIs we never had before.",
    name: "Dr. Emmanuel Kato",
    title: "Chief Administrator",
    organization: "Kampala Medical Centre",
    rating: 5,
  },
  {
    quote:
      "As a growing NGO, the grant tracker was exactly what we needed. Donor reporting went from days to minutes. Exceptional quality.",
    name: "Grace Akello",
    title: "Finance Director",
    organization: "Global NGO Alliance",
    rating: 5,
  },
  {
    quote:
      "The school fee management system streamlined our entire billing process. We reduced arrears by 40% in the first term alone.",
    name: "Peter Mwangi",
    title: "School Bursar",
    organization: "Nairobi Preparatory School",
    rating: 5,
  },
  {
    quote:
      "We use the cash flow model across our entire SME portfolio. It's robust, flexible, and the investor-ready charts are a game-changer.",
    name: "Sarah Nabatanzi",
    title: "Business Consultant",
    organization: "Uganda SME Hub",
    rating: 4,
  },
];

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const go = useCallback((dir: number) => {
    setDirection(dir);
    setIndex((prev) => (prev + dir + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [go, paused]);

  const t = testimonials[index];

  return (
    <section className="bg-surface py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
            Testimonials
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
            Trusted by Business Leaders
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted">
            Hear from the professionals using TrueWorks every day.
          </p>
        </FadeIn>

        <FadeIn
          delay={0.1}
          className="relative mx-auto max-w-3xl"
        >
          <div
            className="relative overflow-hidden rounded-2xl border border-border/70 bg-white shadow-card"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Glow accent */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" aria-hidden />

            <div className="relative min-h-[320px] p-8 sm:p-12">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={index}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="flex h-full flex-col"
                >
                  <div className="flex items-center justify-between">
                    <Stars rating={t.rating} starClassName="h-4.5 w-4.5" />
                    <div className="relative">
                      <Quote className="h-9 w-9 text-accent/20" aria-hidden />
                    </div>
                  </div>

                  <blockquote className="mt-5 flex-1 font-heading text-lg leading-relaxed text-foreground/90 sm:text-xl">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>

                  <figcaption className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6">
                    <div className="flex items-center gap-3.5">
                      <Avatar>
                        <AvatarFallback className="bg-primary font-heading text-sm font-semibold text-accent">
                          {t.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                          {t.name}
                          <BadgeCheck className="h-4 w-4 text-accent" aria-label="Verified buyer" />
                        </p>
                        <p className="text-xs text-muted">
                          {t.title} · {t.organization}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-dark">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                      </span>
                      Verified
                    </span>
                  </figcaption>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-7 flex items-center justify-between">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === index ? "w-8 bg-accent" : "w-2 bg-border hover:bg-muted"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            {/* Arrows */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => go(-1)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-elevated"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => go(1)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-elevated"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
