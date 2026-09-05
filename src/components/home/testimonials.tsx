"use client";

import { Quote, BadgeCheck, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
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

interface TestimonialItem {
  quote: string;
  name: string;
  title: string;
  organization: string;
  rating: number;
}

const fallbackTestimonials: TestimonialItem[] = [
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
  {
    quote:
      "Our church moved from paper registers to a complete membership and finance system in a weekend. The onboarding guide was superb.",
    name: "Pastor David Ssemanda",
    title: "Senior Pastor",
    organization: "Grace Community Church",
    rating: 5,
  },
  {
    quote:
      "Best $79 we've spent this year. The KPI pack paid for itself in the first month just from better inventory decisions.",
    name: "Linet Achieng",
    title: "Operations Manager",
    organization: "Highland Pharmacy",
    rating: 5,
  },
];

export default function Testimonials() {
  return <TestimonialsInner />;
}

function TestimonialsInner() {
  const reviews = useQuery(api.reviews.list, {});
  const dbTestimonials: TestimonialItem[] = (reviews ?? [])
    .filter((r) => r.status === "approved" && r.featured && r.title)
    .slice(0, 6)
    .map((r) => ({
      quote: r.content,
      name: r.customerName,
      title: r.title ?? "Customer",
      organization: "",
      rating: r.rating,
    }));

  const testimonials = dbTestimonials.length > 0 ? dbTestimonials : fallbackTestimonials;

  return (
    <section className="bg-surface py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="mb-12 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
            Testimonials
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
            Trusted by business leaders
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Hear from the professionals using TrueWorks every day to run cleaner,
            faster, more accountable organizations.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.06}>
              <figure className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-elevated">
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden
                />
                <Quote
                  className="relative h-7 w-7 text-accent/40"
                  aria-hidden
                />
                <div className="relative mt-3 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`h-3.5 w-3.5 ${
                        j < t.rating
                          ? "fill-accent text-accent"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
                <blockquote className="relative mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="relative mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary font-heading text-xs font-semibold text-accent">
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 truncate text-sm font-semibold text-primary">
                      <span className="truncate">{t.name}</span>
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-accent" aria-label="Verified buyer" />
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {t.title}
                      {t.organization ? ` · ${t.organization}` : ""}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
