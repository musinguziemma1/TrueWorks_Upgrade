"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useParams } from "next/navigation";
import ResourceDetail from "./content";
import { Loader2 } from "lucide-react";

export default function ResourceLoader() {
  const { slug } = useParams<{ slug: string }>();
  const resource = useQuery(api.resources.getBySlug, { slug });

  if (resource === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (resource === null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-heading text-3xl font-semibold text-primary">Resource Not Found</h1>
        <p className="mt-2 text-muted">The resource you are looking for does not exist.</p>
        <Link href="/resources" className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          Back to Resources
        </Link>
      </div>
    );
  }

  return <ResourceDetail resource={resource} />;
}
