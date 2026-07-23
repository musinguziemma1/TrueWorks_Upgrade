import type { Metadata } from "next";
import TermsContent from "./content";

export const metadata: Metadata = {
  title: "Terms of Service - TrueWorks Limited",
  description:
    "Review the terms and conditions governing the use of TrueWorks templates, dashboards and digital products.",
};

export default function TermsPage() {
  return <TermsContent />;
}
