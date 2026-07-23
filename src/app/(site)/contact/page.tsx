import type { Metadata } from "next";
import ContactContent from "./content";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the TrueWorks team - questions about templates, custom solutions, bulk purchases or partnerships. We respond within 24 hours.",
};

export default function ContactPage() {
  return <ContactContent />;
}
