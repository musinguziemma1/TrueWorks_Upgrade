"use client"

import { useSettings } from "@/lib/settings-context"

const fontMap: Record<string, string> = {
  georgia: "Georgia, 'Times New Roman', serif",
  inter: "Inter, ui-sans-serif, system-ui, sans-serif",
  playfair: "'Playfair Display', Georgia, serif",
  calibri: "Calibri, Source Sans 3, ui-sans-serif, system-ui, sans-serif",
  opensans: "'Open Sans', ui-sans-serif, system-ui, sans-serif",
}

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

  const headingFont = fontMap[s.headingFont] || fontMap.georgia
  const bodyFont = fontMap[s.bodyFont] || fontMap.calibri
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
