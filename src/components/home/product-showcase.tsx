"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const showcases = [
  { name: "Hospital Executive Dashboard", description: "Bed occupancy, patient wait times, revenue per bed, department P&L.", gradient: "from-emerald-500 to-teal-600" },
  { name: "Financial Modeling Suite", description: "Three-statement model with scenario analysis and investor charts.", gradient: "from-blue-500 to-indigo-600" },
  { name: "NGO Grant Management", description: "Donor tracking, grant utilization, expenditure reports.", gradient: "from-rose-400 to-pink-500" },
  { name: "School Fee System", description: "Student billing, arrears tracking, receipt generation.", gradient: "from-amber-400 to-orange-500" },
  { name: "SME Cash Flow Planner", description: "Daily forecasting, expense categorization, working capital.", gradient: "from-cyan-400 to-blue-500" },
];

export default function ProductShowcase() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction === "left" ? -420 : 420, behavior: "smooth" });
  };

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex items-end justify-between gap-6"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
              Preview
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
              See What You&apos;re Getting
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
              A look inside the dashboards and systems our customers use every day.
            </p>
          </div>
          <div className="hidden gap-2.5 sm:flex">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="h-11 w-11 rounded-full border-border"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="h-11 w-11 rounded-full border-border"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        <div
          ref={scrollRef}
          className="scrollbar-hide -mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-4 lg:-mx-8 lg:px-8"
        >
          {showcases.map((item, i) => (
            <motion.article
              key={item.name}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="w-[320px] shrink-0 snap-start overflow-hidden rounded-xl border border-border/70 bg-white shadow-card transition-shadow duration-300 hover:shadow-elevated sm:w-[380px]"
            >
              <div className={`relative h-52 bg-gradient-to-br p-5 ${item.gradient}`}>
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="ml-3 h-5 flex-1 rounded-md bg-white/15" />
                </div>
                {/* Mock dashboard body */}
                <div className="mt-5 space-y-3">
                  <div className="flex gap-3">
                    <div className="h-14 flex-1 rounded-md bg-white/15" />
                    <div className="h-14 flex-1 rounded-md bg-white/15" />
                    <div className="h-14 flex-1 rounded-md bg-white/15" />
                  </div>
                  <div className="flex h-16 items-end gap-1.5 rounded-md bg-white/10 p-2">
                    {[45, 70, 55, 85, 60, 95, 75].map((h, j) => (
                      <span key={j} className="flex-1 rounded-sm bg-white/35" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-heading text-lg font-semibold text-primary">{item.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.description}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
