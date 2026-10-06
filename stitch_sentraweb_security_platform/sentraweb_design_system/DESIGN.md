---
name: SentraWeb Design System
colors:
  surface: '#0d1322'
  surface-dim: '#0d1322'
  surface-bright: '#33394a'
  surface-container-lowest: '#080e1d'
  surface-container-low: '#151b2b'
  surface-container: '#191f2f'
  surface-container-high: '#242a3a'
  surface-container-highest: '#2f3445'
  on-surface: '#dde2f8'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#dde2f8'
  inverse-on-surface: '#2a3040'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#1bbd85'
  on-tertiary-container: '#00452e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0d1322'
  on-background: '#dde2f8'
  surface-variant: '#2f3445'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-default:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-strong:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  telemetry-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  telemetry-inline:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
  badge-label:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-md: 1rem
  gutter-lg: 1.25rem
  margin: 1rem
  margin-tablet: 1.25rem
  margin-desktop: 1.5rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

This design system targets SecOps engineers, SOC analysts, and incident responders operating high-stakes, real-time threat monitoring centers. The visual atmosphere projects calm precision, absolute control, and forensic clarity under incident conditions. The design merges high-density enterprise architecture with controlled glassmorphism and technical telemetry cues, discarding superfluous decorative neon glows in favor of surgical readability and rapid pattern recognition. 

Interfaces balance high information density with meticulous micro-spacing. Key interaction patterns prioritize low cognitive drag, instant anomaly triage, and seamless transitions between high-level security metrics and raw log forensics.

## Colors

The palette is engineered specifically for extended operational shifts in dark-mode environments:

- **Canvas & Layering**:
  - `bg-canvas`: `#0B1120` (Root viewport canvas, lowest spatial layer)
  - `bg-surface`: `#0F172A` (Panels, sidebars, module containers)
  - `bg-elevated`: `#1E293B` (Data tables, drawer modules, inner sub-panels)
  - `bg-glass`: `rgba(15, 23, 42, 0.75)` with `backdrop-filter: blur(12px)`
  - `border-subtle`: `#334155` (Crisp separation lines and framing borders)
  - `border-interactive`: `rgba(6, 182, 212, 0.4)` (State indicators, active focus rings)

- **Primary & Interactive Accents**:
  - `primary-cyan`: `#06B6D4` (Active selections, real-time tracers, focal interaction points)
  - `secondary-blue`: `#3B82F6` (Contextual navigations, links, information nodes)

- **Security Telemetry Semantics**:
  - `status-normal`: `#10B981` (Healthy, Allow, Validated, Encrypted, Clean)
  - `status-warning`: `#F59E0B` (Suspicious, Escalated, Verify, Rate-limited)
  - `status-critical`: `#EF4444` (Breach, Malware, Exploit Vector, Blocked)
  - `status-neutral`: `#64748B` (Inactive, Muted, Archive, Baseline)

Each semantic status color is accompanied by a 12% opacity tint for contextual background fills (e.g., `rgba(239, 68, 68, 0.12)` for threat containers), ensuring contrast ratios exceeding WCAG AAA standards against `#0B1120`.

## Typography

Typography establishes an uncompromising functional hierarchy separating structural narrative from forensic telemetry:

- **Inter** provides UI stability, form clarity, and legibility across dense navigation hierarchies, card summaries, and operational actions.
- **JetBrains Mono** governs all technical observables: IPv4/IPv6 addresses, payload snippets, SHA-256 signatures, timestamps, HTTP status codes, and raw JSON logs. Monospaced numeric alignment prevents layout shift during high-frequency live websocket data updates.

## Layout & Spacing

The layout is built upon a 12-column dynamic fluid grid optimized for high-density multi-display terminal workstations (1920x1080 up to 4K Ultrawide) down to tablet operational viewports:

- **Workstation Desktop (≥1440px)**: 12-column layout, `1.25rem` gutters, fixed 64px collapsed/240px expanded navigation rail, modular multi-pane split for simultaneous canvas inspection and telemetry trace.
- **Laptop / Operations View (1024px – 1439px)**: 12-column layout, `1rem` gutters, responsive canvas with telemetry drawers transitioning into docked overlays.
- **Mobile / Incident Response (<1024px)**: Single-column linear flow, `0.75rem` gutters, high-priority incident triage stream with collapsible log trees.

Internal padding follows a condensed rhythm: standard data tables, metric tiles, and log inspectors use `space-sm` and `space-md` gaps to maintain high density without optical clipping.

## Elevation & Depth

Visual hierarchy avoids heavy drop shadows, instead using layered tonal backgrounds and hairline outlines to define spatial relationships:

- **Base Layer (Elevation 0)**: Root surface `#0B1120`. No borders or drop shadows.
- **Card / Tile Layer (Elevation 1)**: Translucent glass `#0F172A` with 75% opacity, `backdrop-filter: blur(12px)`, framed with a persistent 1px hairline border of `#334155`.
- **Raised Panels & Flyouts (Elevation 2)**: Solid `#1E293B` with border `1px solid rgba(51, 65, 85, 0.8)` and a restrained, non-tinted structural drop shadow: `0 8px 24px -4px rgba(0, 0, 0, 0.45)`.
- **Modal Alerts / Critical Intercepts (Elevation 3)**: `#0F172A` enclosed in a dual border: an inner 1px `#334155` border and an outer 1px high-visibility trace in `primary-cyan` (`#06B6D4`) or `status-critical` (`#EF4444`) with an ambient diffused glow (`blur: 16px`, `opacity: 0.15`).

## Shapes

The design uses soft, precision-tooled geometry (`roundedness: 1`):

- **Micro elements** (pill badges, status markers, inline tags): `rounded-full` (9999px) for status indicators; `0.25rem` (4px) for data tags and telemetry pills.
- **Interactive components** (inputs, buttons, select menus): `0.25rem` (4px) to retain an authoritative, tactical feel.
- **Containers** (cards, inspectors, metrics modules): `0.5rem` (8px) outer corner radii, paired with `0.25rem` (4px) inner nested element radii to maintain optical harmony.

## Components

- **Buttons**:
  - *Primary*: Background `#06B6D4`, text `#0B1120`, font weight 600, border: none. On hover: background `#22D3EE`. Focus: outline 2px solid `#06B6D4` offset 2px.
  - *Secondary / Ghost*: Background `rgba(30, 41, 59, 0.6)`, text `#E2E8F0`, border `1px solid #334155`. On hover: border `#06B6D4`, text `#FFFFFF`.
  - *Destructive / Threat Mitigate*: Background `rgba(239, 68, 68, 0.15)`, text `#EF4444`, border `1px solid #EF4444`. On hover: background `#EF4444`, text `#FFFFFF`.

- **Telemetry Chips & Badges**:
  - Monospaced, uppercase, 10px bold text (`JetBrains Mono`). 
  - Composed of a 6px circular pulsing or static state dot alongside the status text.
  - *Safe*: Background `rgba(16, 185, 129, 0.1)`, text `#10B981`, border `1px solid rgba(16, 185, 129, 0.3)`.
  - *Suspicious*: Background `rgba(245, 158, 11, 0.1)`, text `#F59E0B`, border `1px solid rgba(245, 158, 11, 0.3)`.
  - *Threat*: Background `rgba(239, 68, 68, 0.1)`, text `#EF4444`, border `1px solid rgba(239, 68, 68, 0.3)`.

- **Data Tables & Event Logs**:
  - Alternating zebra striping via `rgba(30, 41, 59, 0.2)` on even rows against `bg-surface`.
  - Row height fixed at dense 36px, vertical-align center.
  - Monospace columns for IP, Port, Protocol, and Latency; proportional font for Event Summary.
  - Hover state highlights row with `rgba(6, 182, 212, 0.08)` and reveals contextual quick-action buttons (e.g., "Add to Blocklist", "Inspect Trace").

- **Input Fields & Query Bars**:
  - Background `#0F172A`, border `1px solid #334155`, text `#F8FAFC`.
  - Placeholder text in `#64748B`.
  - Focused state triggers border `#06B6D4` with `box-shadow: 0 0 0 1px #06B6D4`.
  - Integrated syntax-highlighting for KQL/SQL security query inputs using `JetBrains Mono`.

- **Cards & Modules**:
  - Glass-surfaced panels framed by a 1px border of `#334155`.
  - Module headers contain an icon, a 14px bold title, a live update indicator, and a secondary action slot.
  - Card padding strictly set to `space-md` (12px) or `space-lg` (16px) to maximize data visualization area.