"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { PRODUCT_CATEGORIES } from "./data";
import { DashboardPlaceholder, MediaFrame } from "./media";
import { useHomeMedia } from "./use-home-media";
import { Reveal } from "./motion";

export default function ProductExplorer() {
  const [selected, setSelected] = useState(0);
  const reduced = useReducedMotion();
  const { products: mediaList } = useHomeMedia();
  const fallback = PRODUCT_CATEGORIES[selected];
  const product = { ...fallback, media: mediaList[selected] ?? fallback.media };
  return (
    <section id="solutions" className="ng-section" aria-labelledby="systems-heading">
      <Reveal><p className="ng-eyebrow">Built around your workflow</p><h2 id="systems-heading" className="ng-heading">Systems built<br />around real work.</h2></Reveal>
      <div role="tablist" aria-label="Business system categories" className="my-10 flex gap-2 overflow-x-auto border-b border-black/15 pb-1">
        {PRODUCT_CATEGORIES.map((item, index) => (
          <button key={item.id} id={`tab-${item.id}`} type="button" role="tab" aria-selected={selected === index} aria-controls="system-panel" tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)} onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight") next = (index + 1) % PRODUCT_CATEGORIES.length;
              else if (event.key === "ArrowLeft") next = (index + PRODUCT_CATEGORIES.length - 1) % PRODUCT_CATEGORIES.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = PRODUCT_CATEGORIES.length - 1;
              else return;
              event.preventDefault(); setSelected(next);
              document.getElementById(`tab-${PRODUCT_CATEGORIES[next].id}`)?.focus();
            }} className="relative shrink-0 px-4 py-4 text-sm font-medium">
            {item.label}{selected === index && <motion.span layoutId="system-indicator" transition={{ duration: reduced ? 0 : 0.25 }} className="absolute inset-x-0 bottom-0 h-0.5 bg-[#9b741b]" />}
          </button>
        ))}
      </div>
      <div id="system-panel" role="tabpanel" aria-labelledby={`tab-${product.id}`} tabIndex={0}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={product.id} initial={{ opacity: 0, y: reduced ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.2 }} className="grid items-center gap-10 lg:grid-cols-[1fr_1.7fr]">
            <div><p className="ng-eyebrow">0{selected + 1} / Business systems</p><h3 className="mt-4 font-heading text-3xl leading-tight">{product.title}</h3><p className="mt-5 leading-relaxed text-slate-600">{product.description}</p>
              <Link href={product.exploreHref} className="ng-text-link mt-7">Explore {product.label}<ArrowUpRight size={18} /></Link>
            </div>
            <div><MediaFrame key={product.media.src} {...product.media} fallback={<DashboardPlaceholder />} label={`${product.label} · illustrative preview`} />
              <dl className="mt-5 grid grid-cols-3 gap-3">{product.kpis.map((kpi) => <div key={kpi.label}><dt className="text-xs text-slate-600">{kpi.label}</dt><dd className="mt-2 font-heading text-xl sm:text-3xl">{kpi.value}</dd></div>)}</dl>
              <p className="mt-4 text-xs text-slate-500">Illustrative system concepts and example data. Check each product listing for included features and compatibility.</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
