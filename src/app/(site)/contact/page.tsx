import type { Metadata } from "next";
import ContactContent from "./content";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the TrueWorks team - questions about templates, custom solutions, bulk purchases or partnerships. We respond within 24 hours.",
  keywords: [
    "contact TrueWorks",
    "template support",
    "custom business solutions",
    "bulk purchases",
    "partnerships",
  ],
  openGraph: {
    title: "Contact Us - TrueWorks Limited",
    description: "Get in touch with the TrueWorks team for templates, custom solutions or partnerships.",
    url: "https://trueworksgroup.com/contact",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Contact TrueWorks" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us - TrueWorks Limited",
    description: "Get in touch with the TrueWorks team.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://trueworksgroup.com/contact",
  },
};

// Static page - cache for 1 hour
export const revalidate = 3600;

export default function ContactPage() {
  return <ContactContent />;
}
