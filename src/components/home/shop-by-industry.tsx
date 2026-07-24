"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Stethoscope,
  Briefcase,
  TrendingUp,
  Heart,
  Users,
  GraduationCap,
  Church,
  Sprout,
  ArrowUpRight,
} from "lucide-react";

const industries = [
  { name: "Healthcare", icon: Stethoscope },
  { name: "Business", icon: Briefcase },
  { name: "Finance", icon: TrendingUp },
  { name: "NGO", icon: Heart },
  { name: "HR", icon: Users },
  { name: "Schools", icon: GraduationCap },
  { name: "Churches", icon: Church },
  { name: "Agriculture", icon: Sprout },
];

export default function ShopByIndustry() {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
            Industries
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
            Built for Your Sector
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted">
            Every template is designed around the real workflows of your industry -
            not generic spreadsheets.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
          {industries.map((industry, i) => (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                href={`/store?category=${encodeURIComponent(industry.name)}`}
                className="group flex h-full flex-col items-start gap-4 rounded-xl border border-border/70 bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:bg-white hover:shadow-elevated"
              >
                <div className="flex w-full items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white transition-colors duration-300 group-hover:bg-accent group-hover:text-primary-dark">
                    <industry.icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-border transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-accent-dark" />
                </div>
                <div>
                  <p className="font-heading text-base font-semibold text-primary">
                    {industry.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Browse templates
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
