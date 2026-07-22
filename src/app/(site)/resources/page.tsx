import type { Metadata } from "next";
import ResourcesContent from "./content";

export const metadata: Metadata = {
  title: "Resources — Business Insights & Guides",
  description:
    "Practical guides, insights and resources on financial modeling, KPI dashboards, business planning and operations for African organizations.",
};

export default function ResourcesPage() {
  return <ResourcesContent />;
}
