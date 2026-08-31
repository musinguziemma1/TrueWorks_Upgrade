"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/settings-context";

export function DynamicFavicon() {
  const { siteFavicon } = useSettings();

  useEffect(() => {
    if (!siteFavicon) return;

    const existing = document.getElementById("dynamic-favicon");
    if (existing) {
      existing.remove();
    }

    const link = document.createElement("link");
    link.id = "dynamic-favicon";
    link.rel = "icon";
    link.href = siteFavicon;
    document.head.appendChild(link);
  }, [siteFavicon]);

  return null;
}
