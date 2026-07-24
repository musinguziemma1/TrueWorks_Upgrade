"use client"

import { useSettings } from "@/lib/settings-context"

const fontMap: Record<string, string> = {
  georgia: "Georgia, 'Times New Roman', serif",
  inter: "Inter, ui-sans-serif, system-ui, sans-serif",
  playfair: "'Playfair Display', Georgia, serif",
  calibri: "Calibri, Source Sans 3, ui-sans-serif, system-ui, sans-serif",
  opensans: "'Open Sans', ui-sans-serif, system-ui, sans-serif",
}

export function ThemeApply() {
  const s = useSettings()

  const headingFont = fontMap[s.headingFont] || fontMap.georgia
  const bodyFont = fontMap[s.bodyFont] || fontMap.calibri

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          /* ── Override Tailwind @theme inline variables ── */
          :root {
            --color-primary: ${s.primaryColor} !important;
            --color-primary-dark: ${s.primaryColor} !important;
            --color-primary-light: ${s.primaryColor} !important;
            --color-secondary: ${s.secondaryColor} !important;
            --color-secondary-light: ${s.secondaryColor} !important;
            --color-accent: ${s.accentColor} !important;
            --color-accent-light: ${s.accentColor} !important;
            --color-accent-dark: ${s.accentColor} !important;
            --color-background: ${s.backgroundColor} !important;
            --color-surface: ${s.surfaceColor} !important;
            --color-foreground: ${s.foregroundColor} !important;
            --color-black: ${s.primaryColor} !important;
            --font-heading: ${headingFont} !important;
            --font-body: ${bodyFont} !important;
            --font-sans: ${bodyFont} !important;
          }

          /* ── Base element overrides ── */
          body {
            font-family: ${bodyFont} !important;
            color: ${s.foregroundColor} !important;
            background: ${s.backgroundColor} !important;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: ${headingFont} !important;
            color: ${s.primaryColor} !important;
          }

          /* ── Gradient utilities ── */
          .gradient-brand {
            background: linear-gradient(158deg, ${s.primaryColor} 0%, ${s.primaryColor}ee 45%, ${s.primaryColor}dd 100%) !important;
          }
          .gradient-gold {
            background: linear-gradient(135deg, ${s.accentColor}dd 0%, ${s.accentColor} 100%) !important;
          }
          .text-gradient {
            background: linear-gradient(135deg, ${s.primaryColor} 0%, ${s.secondaryColor} 100%) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
          }
          .text-gradient-gold {
            background: linear-gradient(120deg, ${s.accentColor}ee 0%, ${s.accentColor} 55%, ${s.accentColor}dd 100%) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
          }

          ${s.customCss || ""}
        `,
      }}
    />
  )
}
