import type { Metadata } from "next";

const title = "TrueWorks — Professional Business Systems, Dashboards & Templates";
const description = "Professional business systems, financial models and dashboards designed to help organizations operate with greater clarity, efficiency and confidence.";
export const nextgenMetadata: Metadata = {
  title: { absolute: title }, description,
  alternates: { canonical: "https://trueworksgroup.com" },
  openGraph: { title, description, type: "website", url: "https://trueworksgroup.com", images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};
