"use client"

import { useSettings } from "@/lib/settings-context"

const brandFont = '"Segoe UI", "Segoe UI Variable", "Noto Sans", Arial, sans-serif'

// Defense in depth: strip anything that could break out of the <style>
// element or execute script, even though the server also sanitizes.
function sanitizeCss(css: string): string {
  return css
    .replace(/<\/style/gi, "")
    .replace(/<style/gi, "")
    .replace(/<script/gi, "")
    .replace(/<\/script/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/@import/gi, "")
    .replace(/behavior\s*:/gi, "")
    .replace(/-moz-binding/gi, "")
}

export function ThemeApply() {
  const s = useSettings()

  const headingFont = brandFont
  const bodyFont = brandFont
  const customCss = s.customCss ? sanitizeCss(s.customCss) : ""

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          :root {
            --font-heading: ${headingFont} !important;
            --font-body: ${bodyFont} !important;
            --font-sans: ${bodyFont} !important;
          }
          body {
            font-family: ${bodyFont} !important;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: ${headingFont} !important;
          }
          ${customCss}
        `,
      }}
    />
  )
}
