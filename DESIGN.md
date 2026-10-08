---
name: Vault
description: Calm financial control for developers.
mode: scan
register: product
creativeNorthStar: Silent Control Panel
surfacePhilosophy: flat and restrained
strategicReferences:
  - Efferd
  - Vercel
brandPersonality:
  - precise
  - minimalist
  - confident
colors:
  paper-canvas: "oklch(1 0 0)"
  ink-text: "oklch(0.145 0 0)"
  quiet-surface: "oklch(0.97 0 0)"
  divider-line: "oklch(0.922 0 0)"
  muted-annotation: "oklch(0.556 0 0)"
  focus-ring-light: "oklch(0.708 0 0)"
  warning-cut: "oklch(0.58 0.22 27)"
  night-canvas: "oklch(0.145 0 0)"
  night-ink: "oklch(0.985 0 0)"
  night-panel: "oklch(0.205 0 0)"
  night-secondary-surface: "oklch(0.269 0 0)"
  night-divider-line: "oklch(1 0 0 / 10%)"
  focus-ring-dark: "oklch(0.556 0 0)"
  auth-accent-signal: "oklch(0.488 0.243 264.376)"
  chart-fog: "oklch(0.92 0 0)"
  chart-mist: "oklch(0.78 0 0)"
  chart-slate: "oklch(0.62 0 0)"
  chart-graphite: "oklch(0.48 0 0)"
  chart-carbon: "oklch(0.34 0 0)"
typography:
  display:
    fontFamily: "\"Space Grotesk\", \"Inter Variable\", sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "\"Space Grotesk\", \"Inter Variable\", sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "\"Inter Variable\", sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "\"Inter Variable\", sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "\"Inter Variable\", sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  2xl: "1.125rem"
  3xl: "1.375rem"
  4xl: "1.625rem"
components:
  button-primary:
    backgroundColor: "{colors.ink-text}"
    textColor: "{colors.paper-canvas}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.25rem"
  button-outline:
    backgroundColor: "{colors.paper-canvas}"
    textColor: "{colors.ink-text}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.625rem"
    height: "2rem"
  card-panel:
    backgroundColor: "{colors.paper-canvas}"
    textColor: "{colors.ink-text}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "1rem"
  input-field:
    backgroundColor: "{colors.paper-canvas}"
    textColor: "{colors.ink-text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.625rem"
    height: "2rem"
  nav-item-active:
    backgroundColor: "{colors.quiet-surface}"
    textColor: "{colors.ink-text}"
    typography: "{typography.title}"
    rounded: "{rounded.2xl}"
    padding: "0.75rem 1rem"
---

## Overview

**Creative North Star: "Silent Control Panel"**

Vault is a calm, task-first financial tool for developers. The primary language belongs to the authenticated product: shell, sidebar, header, dashboard cards, tables, inputs, buttons, and settings flows. It should feel visually quiet, technically fluent, and operational rather than promotional, with the clarity of Efferd and the restraint of Vercel filtered through Vault's own precise, minimalist, confident tone.

The system is flat and restrained by default. Depth comes from contrast, borders, panel separation, sticky structure, tabular data rhythm, and rare shadow use instead of decorative glow. Hero or marketing motifs are not the default system vocabulary. The login screen is a secondary surface: darker, more branded, slightly more atmospheric, but still disciplined enough to hand the user back into the product without a visual reset.

This system explicitly rejects crypto neon, corporate banking blue, and bloated SaaS-card dashboards. Numbers are operational data, not decoration. Accent is sparse, hierarchy is earned through typography and spacing, and every surface should reduce financial noise instead of adding it.

## Colors

Vault uses a restrained, mostly neutral product palette with one sparse accent role. The core experience is monochrome-leaning: paper and night canvases, quiet panel surfaces, divider lines, muted annotations, and grayscale chart bands. The accent exists to mark focus, selected states, and the darker branded-auth moments, not to wash the interface.

Primary neutrals are `paper-canvas`, `ink-text`, `quiet-surface`, and `divider-line` in light mode, then `night-canvas`, `night-ink`, `night-panel`, and `night-divider-line` in dark mode. `muted-annotation` carries secondary copy and low-emphasis data. `chart-fog` through `chart-carbon` define the default analytical grayscale for charts before category color is introduced. `warning-cut` is reserved for destructive or error messaging only.

`auth-accent-signal` is the one intentional chromatic break in the documented token set. Use it sparingly for current selection, focus-adjacent affordances, or secondary branded-auth framing. Do not turn it into a theme wash. The login route can borrow darker zinc surfaces and this accent posture, but the authenticated app should remain predominantly neutral.

**The Quiet Signal Rule.** Accent should occupy a small fraction of any given screen. If a dashboard still reads as "accent-colored" from a distance, it is overused.

## Typography

Inter is the body and system UI default. It should carry labels, table rows, inputs, buttons, and dense operational copy because it keeps the product familiar and trustworthy under repeated use. Space Grotesk is the explicit heading and display accent already present in the app, used for route titles, settings headings, and selected moments that need more identity without making the interface theatrical.

The hierarchy stays tight and product-native. `display` and `headline` are Space Grotesk roles for welcome states, page titles, and modal headings. `title`, `body`, and `label` stay in Inter to keep controls, metadata, and data tables stable. Body copy should generally stay within 65 to 75 characters when it becomes paragraph text, but dense tabular and dashboard contexts can run tighter.

**The Operational Typography Rule.** Display styling belongs on headings only. Do not use Space Grotesk for buttons, small labels, table cells, or form controls.

## Elevation

Vault is flat by default. Most surfaces should sit on the same plane and separate through border lines, tonal shifts, sticky framing, and controlled spacing. The shared card and shell primitives already lean this way: rings and borders do most of the work, while shadows appear as a minor assist on overlays or inset shell framing rather than a constant effect.

Dialogs, sheets, and login testimonial framing can use one restrained lift to establish focus, but standard dashboard cards, settings sections, and table containers should not look stacked or floating. If a surface needs emphasis, solve it with structure first, not blur or glow.

**The Flat-By-Default Rule.** Resting product surfaces stay flat. Shadow is a state or overlay tool, never the default personality of the dashboard.

## Components

Buttons are compact, direct, and familiar. Primary actions use the dark-ink fill against light text in light mode, or the inverse high-contrast pairing in dark mode. Outline and ghost buttons stay quiet, relying on border, hover contrast, and text clarity instead of filled color. Rounded corners should follow the existing `md` to `2xl` scale depending on context, with product buttons generally landing in the smaller half of the scale.

Cards and panels are structural containers, not decorative trophies. The shared `Card` primitive is square by default, while Vault's local product surfaces often soften this into `2xl` or `3xl` radii for settings sections and dashboard groupings. Use borders, muted backgrounds, and measured padding to separate modules. Avoid nesting flashy card treatments inside other card treatments.

Financial analytics use four shared app primitives: `FinancialPanel` for the neutral bordered surface, `FinanceMonthSelect` for month-scoped views, `FinanceMetricStrip` for compact period metrics, and `DataQueryToolbar` for search plus filters. A page may use one dark summary surface to establish period context; its operational panels remain light in light mode and token-driven in dark mode. Do not add shadows, blur, or internal scrolling to these resting data surfaces.

Inputs are thin, legible, and operational. They should keep transparent or near-transparent fills, visible input borders, and a clear ring response on focus. Disabled and error states should remain explicit but restrained. Navigation follows the authenticated shell pattern first: persistent sidebar, compact sticky header, muted default text, stronger active states, and predictable mobile collapse. The login screen is secondary and may be darker, more branded, and more testimonial-driven, but it should not redefine the component baseline for the rest of the app.

## Do's and Don'ts

### Do:

- Do keep the authenticated app as the default reference surface for new work: sidebar, header, dashboard panels, tables, forms, and settings.
- Do use the existing OKLCH tokens in `packages/ui/src/styles/globals.css` as the canonical source of truth, even when Stitch warns about non-hex values.
- Do convey depth through divider lines, tonal separation, tabular rhythm, sticky framing, and sparse overlay shadows.
- Do use Inter for operational UI and reserve Space Grotesk for headings or display moments already established in the app.
- Do keep charts and neutral surfaces mostly grayscale until a real semantic or data distinction needs color.

### Don't:

- Don't treat hero or marketing components as the default system vocabulary for the product UI.
- Don't use crypto-style neon, glow-heavy, hype-driven interfaces.
- Don't use generic blue corporate banking dashboards that feel bureaucratic or impersonal.
- Don't use bloated SaaS dashboards filled with decorative cards, fake metrics, and visual noise that makes the product feel templated.
- Don't turn `auth-accent-signal` into a full-screen brand wash, gradient habit, or decorative flourish across routine product surfaces.
