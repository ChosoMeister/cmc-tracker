# DESIGN.md — CMC Tracker Design System

## 1. Design Read & Vision
* **Product Kind:** Wealth & Asset Portfolio Tracker (Gold, Crypto, Currencies, Stocks)
* **Target Experience:** High-end, responsive financial dashboard (Desktop + Tablet + Mobile)
* **Inspiration & Aesthetic:** Linear / Kharji fintech elegance — deep contrast, Apple Liquid Glass cards, clear typography hierarchy, and wide multi-column layout on desktop instead of cramped mobile-only columns.
* **Dial Configuration:** `DESIGN_VARIANCE: 7` | `MOTION_INTENSITY: 5` | `VISUAL_DENSITY: 4`

---

## 2. Color Palette & Tokens

```css
:root {
  --bg-primary: #f8fafc;
  --bg-surface: #ffffff;
  --bg-card: #ffffff;
  --border-subtle: #e2e8f0;
  --border-glass: rgba(255, 255, 255, 0.4);
  
  --text-main: #0f172a;
  --text-muted: #64748b;
  
  --brand-primary: #2563eb;
  --brand-gold: #d97706;
  --status-profit: #059669;
  --status-loss: #e11d48;
}

body.dark {
  --bg-primary: #090d16;
  --bg-surface: #0f172a;
  --bg-card: #131c31;
  --border-subtle: #1e293b;
  --border-glass: rgba(255, 255, 255, 0.08);
  
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  
  --brand-primary: #3b82f6;
  --brand-gold: #f59e0b;
  --status-profit: #10b981;
  --status-loss: #f43f5e;
}
```

---

## 3. Responsive Layout Architecture

### Desktop Layout (>= 768px `md` / 1024px `lg` / 1280px `xl`)
* **Container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6` (Full wide desktop dashboard)
* **Header / Navigation:**
  * Top navigation bar with Logo & Brand, Tab switchers (نمای کلی، دارایی‌ها، تاریخچه تراکنش‌ها), Spotlight search (`⌘K`), quick tools (حباب طلا، خروجی اکسل، بروزرسانی نرخ‌ها), Theme switcher, and User dropdown.
  * Mobile Bottom Navigation hidden on `md:` (`hidden md:flex` for desktop nav, `md:hidden` for mobile bottom nav).
* **Grid Structure:**
  * **Top Stat Cards (4-column grid on desktop):**
    1. ارزش کل دارایی‌ها (Total Net Worth)
    2. سود / زیان کل (Total PnL with animated percentage)
    3. سرمایه‌گذاری اولیه (Total Invested Cost Basis)
    4. نرخ لحظه‌ای بازار (Live Rates: Dollar & 18K Gold)
  * **Main Content Area (12-column grid):**
    * **Left / Primary (8 cols):** Holdings list with detailed breakdown or Transaction History with filter chips, wallet tags, search, and action buttons.
    * **Right / Secondary (4 cols):** Asset Allocation Chart (Donut with interactive breakdown) + Quick Insights / Best & Worst Performers.

### Mobile Layout (< 768px)
* Clean, touch-optimized single column with smooth pull-to-refresh, hero summary card, and floating bottom navigation.

---

## 4. Component Rules & Anti-Slop Guidelines
* **Tables vs Cards:** Use rich tabular views on desktop with sticky headers, subtle hover rows, and direct actions; collapse into clean tactile cards on mobile.
* **Modals & Drawers:** Centered modals with smooth backdrop blur (`backdrop-blur-md`) on desktop; bottom-sheet drawers on mobile.
* **Micro-interactions:** Snappy 150-200ms ease-out transitions on hover and active states without sluggish bouncy animations.
