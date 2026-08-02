"use client";

import { motion } from "framer-motion";
import { Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

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

const sections = [
  { id: "collection", title: "1. Information We Collect", content: "We collect information you provide directly, such as your name, email address, phone number, and billing details when you make a purchase or contact us. We also automatically collect certain technical information including your IP address, browser type, and pages visited when you browse our website." },
  { id: "usage", title: "2. How We Use Your Information", content: "We use your information to process orders, deliver digital products, provide customer support, send product updates and marketing communications (with your consent), improve our website and services, and comply with legal obligations." },
  { id: "payment", title: "3. Payment Processing", content: "Payment transactions are processed by third-party payment processors. We do not store your full payment card details on our servers. Payment data is encrypted and handled in accordance with PCI-DSS standards." },
  { id: "sharing", title: "4. Data Sharing", content: "We do not sell your personal information. We may share your data with trusted third-party service providers who assist us in operating our website and processing transactions, subject to confidentiality agreements." },
  { id: "retention", title: "5. Data Retention", content: "We retain your personal data for as long as necessary to fulfill the purposes described in this policy, or as required by law. When no longer needed, your data will be securely deleted or anonymized." },
  { id: "rights", title: "6. Your Rights", content: "You have the right to access, correct, or delete your personal data. You may also object to or restrict certain processing activities. To exercise these rights, contact us at hello@trueworksgroup.com." },
  { id: "cookies", title: "7. Cookies", content: "Our website uses cookies to improve your browsing experience, analyze site traffic, and support our marketing efforts. You can control cookie preferences through your browser settings." },
  { id: "security", title: "8. Data Security", content: "We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, loss, or destruction. However, no method of electronic storage or transmission is 100% secure." },
  { id: "third-party", title: "9. Third-Party Links", content: "Our website may contain links to third-party sites. We are not responsible for the privacy practices of those sites. We encourage you to review their privacy policies before providing personal data." },
  { id: "changes", title: "10. Changes to This Policy", content: "We may update this privacy policy from time to time. Changes will be posted on this page with an updated effective date. We encourage you to review this policy periodically." },
  { id: "contact", title: "11. Contact Us", content: "For privacy-related inquiries, contact us at hello@trueworksgroup.com, via WhatsApp at +256 700 123 456, or through our Contact page." },
];

export default function PrivacyContent() {
  return (
    <>
      <section className="gradient-brand relative overflow-hidden">
        <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center lg:py-28">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-light">Legal</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="mt-4 font-heading text-4xl font-semibold text-white sm:text-5xl">Privacy Policy</h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-white/70 sm:text-lg">
              How we handle your data, your rights, and our commitments to your privacy.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-surface py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_260px]">
            {/* Main content */}
            <div className="max-w-3xl">
              <FadeIn>
                <p className="text-sm text-muted"><strong>Effective Date:</strong> July 1, 2026</p>
              </FadeIn>
              <div className="mt-10 space-y-10">
                {sections.map((section, i) => (
                  <FadeIn key={section.id} delay={i * 0.04}>
                    <div id={section.id}>
                      <h2 className="font-heading text-xl font-semibold text-primary">{section.title}</h2>
                      <p className="mt-3 text-sm leading-relaxed text-muted">{section.content}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                <div className="rounded-xl border border-border/70 bg-white p-5 shadow-card">
                  <h3 className="font-heading text-sm font-semibold text-primary">On this page</h3>
                  <ul className="mt-3 space-y-1">
                    {sections.map((s) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className="block rounded px-2 py-1 text-xs text-muted transition-colors hover:bg-surface hover:text-primary"
                        >
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-border/70 bg-white p-5 shadow-card">
                  <h3 className="font-heading text-sm font-semibold text-primary">Need help?</h3>
                  <p className="mt-2 text-xs text-muted">Our team is ready to assist.</p>
                  <div className="mt-4 space-y-2.5">
                    <a
                      href="mailto:hello@trueworksgroup.com"
                      className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-primary"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0 text-accent-dark" />
                      hello@trueworksgroup.com
                    </a>
                    <a
                      href="https://wa.me/256700123456"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-primary"
                    >
                      <MessageCircle className="h-3.5 w-3.5 shrink-0 text-accent-dark" />
                      Chat on WhatsApp
                    </a>
                  </div>
                  <Link
                    href="/contact"
                    className="mt-4 block rounded-lg bg-primary px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-primary/80"
                  >
                    Contact page
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
