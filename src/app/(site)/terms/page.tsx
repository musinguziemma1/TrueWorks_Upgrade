import type { Metadata } from "next";
import TermsContent from "./content";

// Static page - cache for 1 hour
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Terms of Service - TrueWorks Limited",
  description:
    "Review the terms and conditions governing the use of TrueWorks templates, dashboards and digital products.",
};

export default function TermsPage() {
  return <TermsContent />;
}
