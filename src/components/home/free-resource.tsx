"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, CheckCircle2, AlertCircle, BarChart3, TrendingUp, Users, Banknote, Loader2 } from "lucide-react";
import { api } from "@convex/_generated/api";
import { convexClient } from "@/lib/convex";
import { Button } from "@/components/ui/button";

const kpiItems = [
  { icon: BarChart3, label: "Bed Occupancy", value: "78%" },
  { icon: TrendingUp, label: "Revenue / Bed", value: "$2,400" },
  { icon: Users, label: "Patients / Day", value: "142" },
  { icon: Banknote, label: "Average Bill", value: "$85" },
];

export default function FreeResource() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "valid" | "error">("idle");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!convexClient) {
      setStatus("error");
      setErrorMsg("Service unavailable. Please try again later.");
      return;
    }
    setSending(true);
    try {
      await convexClient.mutation(api.subscribers.create, { email, source: "free-resource" });
      setStatus("valid");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="free-template" className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="gradient-brand relative overflow-hidden rounded-3xl">
          <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden />

          <div className="relative grid items-center gap-12 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-light">
                Free Resource
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold leading-tight text-white md:text-4xl">
                Get a Free Hospital KPI Dashboard
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
                Perfect for healthcare administrators. Monitor bed occupancy,
                patient wait times, revenue per bed and more - free forever.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 max-w-md" noValidate>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <label htmlFor="free-template-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="free-template-email"
                      type="email"
                      placeholder="Enter your work email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setStatus("idle");
                      }}
                      className={`h-12 w-full rounded-lg border bg-white/[0.08] px-4 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:bg-white/[0.12] ${
                        status === "error"
                          ? "border-error/70"
                          : "border-white/20 focus:border-accent/60"
                      }`}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={sending}
                    className="h-12 shrink-0 gradient-gold px-6 text-sm font-semibold text-primary-dark shadow-lg shadow-accent/20 hover:brightness-105 disabled:opacity-60"
                  >
                    {sending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {sending ? "Sending…" : "Send It to Me"}
                  </Button>
                </div>
                {status === "error" && (
                  <p className="mt-2.5 flex items-center gap-1.5 text-xs text-red-300">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errorMsg || "Please enter a valid email address."}
                  </p>
                )}
                {status === "valid" && (
                  <p className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Check your inbox - the download link is on its way.
                  </p>
                )}
                <p className="mt-3 text-xs text-white/40">
                  No spam. Unsubscribe anytime.
                </p>
              </form>
            </motion.div>

            {/* Preview card */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="w-full"
            >
              <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-elevated">
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold text-primary">
                    Hospital KPI Dashboard
                  </span>
                  <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-dark">
                    Free
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {kpiItems.map((item) => (
                    <div key={item.label} className="rounded-lg border border-border/50 bg-surface p-4">
                      <item.icon className="mb-2 h-4 w-4 text-secondary" />
                      <p className="text-[11px] text-muted">{item.label}</p>
                      <p className="mt-0.5 font-heading text-base font-bold text-primary">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <div className="h-2 overflow-hidden rounded-full bg-surface">
                    <div className="h-full w-3/4 rounded-full gradient-gold" />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-muted">
                    <span>Target: 85%</span>
                    <span>Current: 78%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
