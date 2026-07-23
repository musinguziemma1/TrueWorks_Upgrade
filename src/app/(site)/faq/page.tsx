import type { Metadata } from "next";
import FaqContent from "./content";

export const metadata: Metadata = {
  title: "FAQ - TrueWorks Limited",
  description:
    "Frequently asked questions about TrueWorks templates, payment, delivery, refunds, and custom requests.",
};

export default function FaqPage() {
  return <FaqContent />;
}
