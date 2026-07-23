"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

export function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setDone(true);
    setEmail("");
  };

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm text-accent-light">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Thank you - you&apos;re on the list.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <label htmlFor="footer-newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="footer-newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="h-10 w-full min-w-0 rounded-lg border border-white/15 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-accent/60 focus:bg-white/10"
      />
      <button
        type="submit"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-gold text-primary-dark transition-all hover:brightness-105"
        aria-label="Subscribe to newsletter"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
