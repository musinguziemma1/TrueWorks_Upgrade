import type { Metadata } from "next";
import RefundPolicyContent from "./content";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "TrueWorks 30-day satisfaction guarantee. Read our refund policy and learn how to request a refund.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return <RefundPolicyContent />;
}
