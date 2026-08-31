"use client";

import { useSettings } from "@/lib/settings-context";
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
  const src = hasUploadedLogo ? siteLogo : config.src;

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
