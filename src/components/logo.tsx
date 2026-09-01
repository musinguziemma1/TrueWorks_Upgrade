"use client";

import { useQuery, useMutation } from "convex/react";
import { useSettings } from "@/lib/settings-context";
import { api } from "@convex/_generated/api";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "icon" | "horizontal" | "horizontal-white" | "stacked";
  className?: string;
  width?: number;
  height?: number;
}

const logoConfig = {
  icon: { src: "/images/logo-icon.svg", defaultWidth: 40, defaultHeight: 40, alt: "TrueWorks icon" },
  horizontal: { src: "/images/logo-horizontal.svg", defaultWidth: 160, defaultHeight: 40, alt: "TrueWorks Business Operating Systems" },
  "horizontal-white": { src: "/images/logo-horizontal-white.svg", defaultWidth: 160, defaultHeight: 40, alt: "TrueWorks Business Operating Systems" },
  stacked: { src: "/images/logo-stacked.svg", defaultWidth: 140, defaultHeight: 140, alt: "TrueWorks Business Operating Systems" },
};

export function Logo({
  variant = "horizontal",
  className,
  width,
  height,
}: LogoProps) {
  const { siteLogo } = useSettings();
  const config = logoConfig[variant];
  const w = width ?? config.defaultWidth;
  const h = height ?? config.defaultHeight;

  const hasUploadedLogo = siteLogo && siteLogo.trim().length > 0;
  const isStorageId = hasUploadedLogo && siteLogo.startsWith("kg") && !siteLogo.startsWith("http");
  const resolvedUrl = useQuery(
    api.storage.resolveFileUrl,
    isStorageId ? { storageId: siteLogo } : "skip"
  );
  const backfill = useMutation(api.storage.backfillFileUrl);

  useEffect(() => {
    if (isStorageId && resolvedUrl) {
      backfill({ storageId: siteLogo, url: resolvedUrl }).catch(() => {});
    }
  }, [isStorageId, resolvedUrl, siteLogo, backfill]);

  let src = config.src;
  if (hasUploadedLogo) {
    if (isStorageId && resolvedUrl) {
      src = resolvedUrl;
    } else if (!isStorageId) {
      src = siteLogo;
    }
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG logos are served as static assets or storage URLs
    <img
      src={src}
      alt={config.alt}
      width={w}
      height={h}
      className={cn("object-contain", className)}
    />
  );
}

