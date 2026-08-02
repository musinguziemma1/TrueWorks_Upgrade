"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Stars } from "@/components/product/stars";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

export default function Testimonials() {
  return (
    <section className="bg-surface py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
            Testimonials
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
            Trusted by Business Leaders
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted">
            Hear from the professionals using TrueWorks every day.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex h-full flex-col rounded-xl border border-border/70 bg-white p-7 shadow-card"
            >
              <div className="flex items-center justify-between">
                <Stars rating={t.rating} starClassName="h-4 w-4" />
                <Quote className="h-5 w-5 text-accent/40" aria-hidden />
              </div>
              <blockquote className="mt-4 flex-1 font-heading text-[17px] leading-relaxed text-foreground/90">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3.5 border-t border-border/60 pt-5">
                <Avatar>
                  <AvatarFallback className="bg-primary font-heading text-sm font-semibold text-accent">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-primary">{t.name}</p>
                  <p className="text-xs text-muted">
                    {t.title} · {t.organization}
                  </p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
