import type { Metadata } from "next";
import RefundPolicyContent from "./content";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "TrueWorks 7-day satisfaction guarantee. Read our refund policy and learn how to request a refund.",
  openGraph: {
    title: "Refund Policy - TrueWorks Limited",
    description: "TrueWorks 7-day satisfaction guarantee and refund policy.",
    url: "https://trueworksgroup.com/refund-policy",
  },
  alternates: { canonical: "https://trueworksgroup.com/refund-policy" },
};

export default function RefundPolicyPage() {
  return <RefundPolicyContent />;
}
