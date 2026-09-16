"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/provider";
import { HOMEPAGE_VARIANTS, normalizeHomepageVariant, type HomepageVariant } from "@/lib/homepage-variant";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";

export function HomepageSelector() {
  const { isAdmin } = useAuth();
  const settings = useQuery(api.settings.getPublic, {});
  const save = useMutation(api.settings.set);
  const [selection, setSelection] = useState<HomepageVariant | null>(null);
  const [confirm, setConfirm] = useState(false);
  const current = normalizeHomepageVariant(settings?.homepageVariant);
  const selected = selection ?? current;
  const ready = settings !== undefined;

  async function publish() {
    try {
      await save({ key: "homepageVariant", value: selected });
      toast.success("Homepage updated. New visits will use the selected layout.");
      setSelection(null);
    } catch {
      toast.error("Homepage was not changed. Check your permissions and try again.");
    }
  }

  return <section className="rounded-xl border bg-card p-5 sm:p-6" aria-labelledby="homepage-layout-heading">
    <h2 id="homepage-layout-heading" className="text-lg font-semibold">Homepage experience</h2>
    <p className="mt-2 text-sm text-muted-foreground">Preview either design before publishing. The current homepage stays unchanged until you confirm a switch.</p>
    <p className="mt-2 text-sm" role="status">{ready ? `Published: ${HOMEPAGE_VARIANTS.find(v => v.value === current)?.label}` : "Loading published layout…"}</p>
    <fieldset disabled={!ready || !isAdmin} className="mt-5 grid gap-4 md:grid-cols-2">
      <legend className="sr-only">Choose homepage layout</legend>
      {HOMEPAGE_VARIANTS.map(variant => <div key={variant.value} className={`rounded-lg border p-5 ${selected === variant.value ? "border-primary bg-primary/5" : "border-border"}`}>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="radio" name="homepage-variant" value={variant.value} checked={selected === variant.value} onChange={() => setSelection(variant.value)} className="mt-1 h-4 w-4 accent-primary" />
          <span><span className="block font-semibold">{variant.label}</span><span className="mt-2 block text-sm text-muted-foreground">{variant.description}</span></span>
        </label>
        <Link href={variant.previewHref} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-medium underline underline-offset-4">Preview {variant.value === "classic" ? "Classic" : "Next-Gen"} ↗</Link>
      </div>)}
    </fieldset>
    <div className="mt-5 flex flex-wrap items-center gap-4">
      <Button disabled={!ready || !isAdmin || selected === current} onClick={() => setConfirm(true)}>Publish selected homepage</Button>
      <span className="text-xs text-muted-foreground">{isAdmin ? "You can switch back to Classic at any time." : "Only an administrator can publish a homepage."}</span>
    </div>
    <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Change the live homepage?" description={`Publish ${HOMEPAGE_VARIANTS.find(v => v.value === selected)?.label} at trueworksgroup.com? This does not change products, checkout or other pages.`} confirmLabel="Publish homepage" onConfirm={publish} />
  </section>;
}
