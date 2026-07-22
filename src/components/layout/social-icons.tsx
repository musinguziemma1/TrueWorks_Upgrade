import { cn } from "@/lib/utils";

/* Brand icons are no longer shipped with lucide-react, so we inline them. */

export const socialLinks = [
  { name: "Facebook", href: "https://facebook.com", key: "facebook" },
  { name: "X (Twitter)", href: "https://x.com", key: "x" },
  { name: "LinkedIn", href: "https://linkedin.com", key: "linkedin" },
  { name: "YouTube", href: "https://youtube.com", key: "youtube" },
  { name: "Instagram", href: "https://instagram.com", key: "instagram" },
] as const;

const paths: Record<string, string> = {
  facebook:
    "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  linkedin:
    "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
  youtube:
    "M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17M10 15l5-3-5-3z",
  instagram:
    "M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5zm-5 6.2A3.8 3.8 0 1 1 12 15.6 3.8 3.8 0 0 1 12 8.2zm5.4-2.7a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
};

export function SocialIcon({ iconKey, className }: { iconKey: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
    >
      <path d={paths[iconKey] ?? ""} />
    </svg>
  );
}
