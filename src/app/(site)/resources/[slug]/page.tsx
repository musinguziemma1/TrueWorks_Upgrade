import type { Metadata } from "next";
import { api } from "@convex/_generated/api";
import { convexServer } from "@/lib/convex-server";
import ResourceLoader from "./loader";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trueworksgroup.com";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!convexServer) return { title: "Resource" };
  try {
    const resource = await convexServer.query(api.resources.getBySlug, { slug });
    if (!resource) return { title: "Resource Not Found" };
    return {
      title: resource.title,
      description: resource.description,
      alternates: { canonical: `${SITE_URL}/resources/${resource.slug}` },
      openGraph: {
        title: resource.title,
        description: resource.description,
        type: "article",
        url: `${SITE_URL}/resources/${resource.slug}`,
        images: resource.featuredImage ? [{ url: resource.featuredImage }] : undefined,
      },
    };
  } catch {
    return { title: "Resource" };
  }
}

export default function ResourceDetailPage() {
  return <ResourceLoader />;
}
