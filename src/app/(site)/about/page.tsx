import type { Metadata } from "next";
import AboutContent from "./content";

export const metadata: Metadata = {
  title: "About Us — Building Better Organizations",
  description:
    "TrueWorks Limited is a Ugandan business technology company helping organizations streamline operations and grow with expertly crafted templates, dashboards and digital tools.",
};

export default function AboutPage() {
  return <AboutContent />;
}
