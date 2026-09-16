import type { Metadata } from "next";
import Link from "next/link";
import NextGenPage from "@/components/home-nextgen/nextgen-page";
import ClassicHomePage from "@/components/home/classic-page";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Homepage design preview",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://trueworksgroup.com" },
};

export default async function HomepagePreview({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  if (variant !== "home-v2" && variant !== "classic") notFound();
  return <>
    <aside className="bg-amber-50 px-4 py-3 text-center text-sm text-slate-900">Design preview — the published homepage is unchanged. <Link href="/admin/content" className="font-semibold underline">Manage homepage</Link></aside>
    {variant === "home-v2" ? <NextGenPage /> : <ClassicHomePage />}
  </>;
}
