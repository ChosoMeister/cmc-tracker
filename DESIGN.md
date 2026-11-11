---
version: alpha
name: Zarfolio Bullion Precision
description: Institutional-grade bilingual (RTL Persian / LTR English) wealth & portfolio terminal for gold bullion, coins, FX, and digital assets. Single Bullion Gold brand accent on deep obsidian slate surfaces, strict tabular numerals, and zero decorative AI-slop.
colors:
  primary: "#D97706"
  primary-hover: "#B45309"
  primary-dark: "#F59E0B"
  surface-canvas-light: "#F8FAFC"
  surface-card-light: "#FFFFFF"
  surface-muted-light: "#F1F5F9"
  surface-pill-light: "#E2E8F0"
  border-light: "#E2E8F0"
  text-primary-light: "#0F172A"
  text-muted-light: "#64748B"
  surface-canvas-dark: "#090D16"
  surface-card-dark: "#0F172A"
  surface-elevated-dark: "#162033"
  surface-pill-dark: "#1E293B"
  border-dark: "#1E293B"
  text-primary-dark: "#F8FAFC"
  text-muted-dark: "#94A3B8"
  profit-light: "#047857"
  profit-dark: "#10B981"
  loss-light: "#BE123C"
  loss-dark: "#F43F5E"
  chart-gold: "#F59E0B"
  chart-fx: "#0EA5E9"
  chart-crypto: "#2563EB"
  chart-other: "#64748B"
typography:
  headline-hero:
    fontFamily: Vazirmatn
    fontSize: 44px
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: -0.02em
    fontFeature: tnum
  headline-lg:
    fontFamily: Vazirmatn
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
  headline-md:
    fontFamily: Vazirmatn
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.35
  body-lg:
    fontFamily: Vazirmatn
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.6
  body-md:
    fontFamily: Vazirmatn
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
  label-lg:
    fontFamily: Vazirmatn
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
  label-md:
    fontFamily: Vazirmatn
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.4
  numeric-md:
    fontFamily: Vazirmatn
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.3
    fontFeature: tnum
rounded:
  sm: 8px
  md: 12px
  lg: 20px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 12px
  card-surface:
    backgroundColor: "{colors.surface-card-dark}"
    rounded: "{rounded.lg}"
    padding: 20px
  badge-delta:
    rounded: "{rounded.sm}"
    padding: 4px
---

# Zarfolio Bullion Precision — Design System

## Overview
Zarfolio is an institutional-grade personal wealth and portfolio tracker engineered for multi-asset investors holding Gold Bullion (`GOLD18`, `ABSHODEH`), Sovereign Coins (`SEKKEH`, `BAHAR`, `NIM`, `ROB`, `GRAM_COIN`), Foreign Currencies (`USD`, `EUR`, `AED`), and Cryptocurrencies (`BTC`, `ETH`, `USDT`).

The interface follows Swiss / Linear financial precision: calm neutral slate surfaces, **one unmistakable Bullion Gold brand accent**, strict semantic PnL colors, crisp hairline borders, and effortless bilingual (`RTL` Persian / `LTR` English) symmetry.

## Colors
- **Single Brand Accent — Bullion Gold (`#D97706` light / `#F59E0B` dark):** Used exclusively for the primary CTA (`+ New Transaction`), active brand indicator, and focus highlights.
- **Obsidian Slate Surfaces (`#090D16` canvas / `#0F172A` card / `#162033` elevated):** Unified cool slate family in dark mode paired with crisp `#F8FAFC` / `#FFFFFF` surfaces in light mode.
- **Strict Semantic Financial Delta:**
  - **Profit (`#047857` light / `#10B981` dark):** Exclusively for positive price changes, unrealized/realized gains, and `BUY` transaction badges.
  - **Loss (`#BE123C` light / `#F43F5E` dark):** Exclusively for negative price changes, losses, `SELL` badges, and destructive confirmations.
- **Zero-Rainbow & Purple Ban:** Never use purple, violet, or indigo (`#8B5CF6`, `indigo-*`, `violet-*`, `purple-*`) anywhere in chrome, charts, shadows, or tool buttons. Secondary utility buttons use neutral surface + border tokens.

## Typography
- **Bilingual Typeface:** Variable `Vazirmatn` (`wght 300..900`) for Persian (`RTL`) and clean geometric sans (`Inter` / system UI + `Vazirmatn`) for English (`LTR`).
- **Mandatory Tabular Numerals (`tabular-nums`):** Every price, net worth figure, percentage, quantity, and timestamp MUST apply `font-variant-numeric: tabular-nums` so columns align vertically and animated numbers never jitter horizontally.
- **Minimum 12px (`text-xs`) Floor:** Never render sub-12px micro-typography (`text-[8px]`, `text-[9px]`, `text-[10px]`). Never apply `uppercase` or wide `tracking-widest` to connected Persian script.
- **Clamp-Safe Hero Display:** Hero net worth scales via `clamp(1.75rem, 4vw, 2.75rem)` so 12–13 digit Toman figures never clip or overflow on mobile or desktop.

## Layout
- **Container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` with safe bottom clearance for mobile navigation (`pb-28 md:pb-10`).
- **Slim 7-Item Header (`Navbar`):** Brand + Live Source Status Pill (`BrsApi` / `TGJU + Binance`), 4 primary tabs (`Overview`, `Holdings`, `Market Board`, `Transactions`), Spotlight `⌘K`, Primary `+ Transaction` button, and Profile/Settings trigger. Sign-out lives safely inside `SettingsDrawer` with confirmation.
- **Thumb-Zone Mobile Navigation (`BottomNav`):** 5-slot dock (`Overview`, `Holdings`, centered `48×44px` Bullion Gold `+` CTA, `Market`, `Transactions`) with `>= 12px` labels and iOS `env(safe-area-inset-bottom)` support.

## Elevation & Depth
- **Hairline Structural Borders:** `1px solid var(--border-color)` defines hierarchy instead of heavy neon glows or 600px decorative blur orbs.
- **Restrained Translucent Chrome:** `backdrop-filter: blur(16px)` is reserved strictly for sticky `Navbar`, `BottomNav`, and modal backdrops—never applied to 90+ repeating `MarketBoard` cards.

## Shapes
- **Strict 3-Tier Corner Radius Scale:**
  - `sm` (`8px` / `rounded-lg`): Status pills, PnL chips, keyboard shortcuts.
  - `md` (`12px` / `rounded-xl`): Buttons, inputs, segmented controls, asset avatars, table row highlights.
  - `lg` (`20px` / `rounded-[20px]`): Cards, modals, drawers, summary containers.

## Components
- **`SummaryCard`:** Asymmetric hero displaying Net Worth (with 1-tap Privacy Mask `•••`), Total PnL (`%` + Toman), Cost Basis, Live USD, and Live 18K Gold with true 24h delta colors and live source provenance.
- **`AssetDetailDrawer`:** Contextual slide-over sheet (desktop right/left, mobile bottom sheet) showing Position Quantity (grams vs coins), Average Break-Even Buy Price, Realized & Unrealized PnL, Custody/Wallet breakdown, and filtered asset transactions—without polluting global tab filters.
- **`TransactionModal`:** Smart sheet with `BUY`/`SELL` segmented control, 1-tap "Use Live Market Rate", live `Quantity × Unit Price` total Toman preview, `feesToman` & `note` fields, and `SELL` owned-balance validation.

## Do's and Don'ts
- **Do** sync every token in this file with `index.css` CSS custom properties.
- **Do** support browser/mobile hardware `Back` navigation (`popstate`) to close open modals/drawers before leaving the app.
- **Do** honor `@media (prefers-reduced-motion: reduce)` across all transitions and counters.
- **Don't** display decorative `<Sparkles />` "AI Powered" badges or structural flag/pin emojis (`🇮🇷`, `🇬🇧`, `📍`).
- **Don't** color Live USD or utility buttons green/red unless representing actual positive/negative financial delta.
