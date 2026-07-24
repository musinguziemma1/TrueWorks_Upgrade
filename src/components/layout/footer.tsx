import Link from "next/link";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Logo } from "@/components/logo";
import { SocialIcon, socialLinks } from "@/components/layout/social-icons";
import { FooterNewsletter } from "@/components/layout/footer-newsletter";
const productCategories = [
  "Healthcare",
  "Business",
  "Finance",
  "NGO",
  "HR",
  "Schools",
  "Churches",
  "Agriculture",
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Your Cart", href: "/cart" },
];

const contactRows = [
  { icon: Mail, text: "hello@trueworksug.com", href: "mailto:hello@trueworksug.com" },
  { icon: Phone, text: "+256 700 123 456", href: "tel:+256700123456" },
  { icon: MapPin, text: "Plot 42, Acacia Avenue, Kampala, Uganda" },
  { icon: Clock, text: "Mon – Fri: 8:00 – 17:00 EAT" },
];

const paymentMethods = ["VISA", "Mastercard", "MTN MoMo", "Airtel Money"];

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-10">
          {/* Brand */}
          <div>
            <Link href="/" aria-label="TrueWorks home" className="inline-block">
              <Logo variant="horizontal-white" width={160} height={40} />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
              Premium Excel templates, financial models and dashboards that help
              African organizations operate with clarity and confidence.
            </p>
            <div className="mt-6 flex items-center gap-2.5">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/60 transition-all hover:bg-accent hover:text-primary-dark"
                  aria-label={social.name}
                >
                  <SocialIcon iconKey={social.key} />
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <nav aria-label="Products">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Products
            </h3>
            <ul className="mt-5 space-y-3">
              <li>
                <Link href="/store" className="text-sm text-white/60 transition-colors hover:text-accent-light">
                  All Templates
                </Link>
              </li>
              {productCategories.slice(0, 5).map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/store?category=${encodeURIComponent(cat)}`}
                    className="text-sm text-white/60 transition-colors hover:text-accent-light"
                  >
                    {cat} Templates
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Company
            </h3>
            <ul className="mt-5 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-accent-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact + newsletter */}
          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Get in Touch
            </h3>
            <ul className="mt-5 space-y-3">
              {contactRows.map((row) => (
                <li key={row.text} className="flex items-start gap-3 text-sm text-white/60">
                  <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent/80" />
                  {row.href ? (
                    <a href={row.href} className="transition-colors hover:text-accent-light">
                      {row.text}
                    </a>
                  ) : (
                    <span>{row.text}</span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm font-medium text-white/80">
              Practical insights, once a month.
            </p>
            <div className="mt-3">
              <FooterNewsletter />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="mr-1 text-xs text-white/40">We accept</span>
            {paymentMethods.map((method) => (
              <span
                key={method}
                className="rounded-md bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white/55"
              >
                {method}
              </span>
            ))}
          </div>
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} TrueWorks Limited. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
