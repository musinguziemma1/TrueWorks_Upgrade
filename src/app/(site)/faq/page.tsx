import type { Metadata } from "next";
import FaqContent from "./content";

export const metadata: Metadata = {
  title: "FAQ - TrueWorks Limited",
  description:
    "Frequently asked questions about TrueWorks templates, payment, delivery, refunds, and custom requests.",
  keywords: [
    "TrueWorks FAQ",
    "template questions",
    "payment methods",
    "refund policy",
    "download help",
  ],
  openGraph: {
    title: "FAQ - TrueWorks Limited",
    description: "Frequently asked questions about TrueWorks templates, payment, delivery and refunds.",
    url: "https://trueworksgroup.com/faq",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "TrueWorks FAQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ - TrueWorks Limited",
    description: "Frequently asked questions about TrueWorks templates and services.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://trueworksgroup.com/faq",
  },
};

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I download my templates?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "After purchase, you receive an instant download link via email. You can also access your downloads from your account dashboard at any time.",
        },
      },
      {
        "@type": "Question",
        name: "What payment methods do you accept?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We accept Mobile Money (MTN, Airtel), Stripe (credit/debit cards), and Pesapal for local payment methods across Africa.",
        },
      },
      {
        "@type": "Question",
        name: "What is your refund policy?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We offer a 7-day refund policy. If you're not satisfied with your purchase, contact us within 7 days for a full refund.",
        },
      },
      {
        "@type": "Question",
        name: "Can I request custom templates?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! We offer custom template development for organizations with specific needs. Contact us to discuss your requirements.",
        },
      },
      {
        "@type": "Question",
        name: "Are the templates mobile-friendly?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, all our Excel templates are designed to work on both desktop and mobile devices, with responsive layouts and touch-friendly controls.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FaqContent />
    </>
  );
}
