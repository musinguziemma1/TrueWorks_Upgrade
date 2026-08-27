import type { Metadata } from "next";
import PrivacyContent from "./content";

// Static page - cache for 1 hour
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Privacy Policy - TrueWorks Limited",
  description:
    "How TrueWorks Limited collects, uses, and protects your personal data when you use our website and purchase our products.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
