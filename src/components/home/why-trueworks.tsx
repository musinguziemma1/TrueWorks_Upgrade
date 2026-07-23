"use client";

import { motion } from "framer-motion";
import { Download, BadgeCheck, ShieldCheck, RefreshCw } from "lucide-react";

const features = [
  {
    icon: Download,
    title: "Instant Download",
    description:
      "Access your templates immediately after purchase - no waiting, no shipping, no subscriptions.",
  },
  {
    icon: BadgeCheck,
    title: "Built by Professionals",
    description:
      "Every template is crafted by finance professionals, data analysts and business consultants.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description:
      "Pay safely with MTN Mobile Money, Airtel Money, Visa or Mastercard through encrypted checkout.",
  },
  {
    icon: RefreshCw,
    title: "30-Day Guarantee",
    description:
      "If a template doesn't fit your needs, we'll make it right or refund you - no questions asked.",
  },
];

export default function WhyTrueWorks() {
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
            Why TrueWorks
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl">
            Professional Tools, Zero Friction
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-xl border border-border/70 bg-white p-7 shadow-card transition-shadow duration-300 hover:shadow-elevated"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <feature.icon className="h-5 w-5 text-accent" />
              </span>
              <h3 className="mt-5 font-heading text-lg font-semibold text-primary">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
