"use client"

import { useSettings } from "@/lib/settings-context"

export function ThemeApply() {
  const settings = useSettings()

  const style = {
    "--color-primary": settings.primaryColor,
    "--color-secondary": settings.secondaryColor,
    "--color-accent": settings.accentColor,
    "--color-background": settings.backgroundColor,
    "--color-surface": settings.surfaceColor,
    "--color-foreground": settings.foregroundColor,
    "--font-heading": settings.headingFont,
    "--font-body": settings.bodyFont,
  } as React.CSSProperties

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --color-primary: ${settings.primaryColor};
              --color-secondary: ${settings.secondaryColor};
              --color-accent: ${settings.accentColor};
              --color-background: ${settings.backgroundColor};
              --color-surface: ${settings.surfaceColor};
              --color-foreground: ${settings.foregroundColor};
            }
            ${settings.customCss || ""}
          `,
        }}
      />
    </>
  )
}
