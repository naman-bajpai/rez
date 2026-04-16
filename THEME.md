# Rez Design System — Theme Reference

> Single source of truth for all UI decisions across the dashboard and booking pages.

---

## Typography

| Role | Value |
|------|-------|
| Dashboard font | `Jost` via `--font-jost` — loaded at weights 300, 400, 500 only |
| Booking display headings | `Fraunces` (Google Fonts) — editorial serif, booking pages only |
| Booking body | `DM Sans` (Google Fonts) — booking pages only |
| Base weight | `300` (light) — default for all dashboard text |
| Emphasis weight | `400` (regular) — active nav, headings, important labels |
| Max weight used | `500` — used extremely sparingly, e.g. stat numbers |
| **Never use** | `600` (semibold) or `700` (bold) in the dashboard |
| Base size | `14px` body, `13px` secondary, `10–11px` uppercase labels |
| Letter spacing | `0.01em` base, `0.06em` for uppercase eyebrow labels, `wide` for nav items |

---

## Dashboard Color Tokens

All variables are defined in `src/app/dashboard/dashboard-skins.css` on `.dash-root`.

### Page & Layout

| Token | Value | Usage |
|-------|-------|-------|
| `--dash-page-bg` | `#F8F8FC` | Page background — slightly purple-tinted white |
| `--dash-nav-bg` | `#FFFFFF` | Sidebar background |
| `--dash-nav-border` | `#E4E4E7` | Sidebar right border |

### Surfaces

| Token | Value | Usage |
|-------|-------|-------|
| `--dash-surface` | `#FFFFFF` | Cards, panels |
| `--dash-surface-elevated` | `#FFFFFF` | Modals, dropdowns |
| `--dash-surface-muted` | `#F4F4F5` | Sidebar backgrounds, muted areas |

### Text

| Token | Value | Usage |
|-------|-------|-------|
| `--dash-text` | `#18181B` | Primary text |
| `--dash-text-secondary` | `#3F3F46` | Secondary labels |
| `--dash-muted` | `#71717A` | Placeholder, metadata |

### Borders & Dividers

| Token | Value | Usage |
|-------|-------|-------|
| `--dash-border` | `#E4E4E7` | All card/input borders |
| `--dash-border-strong` | `#D4D4D8` | Hover states, focus |
| `--dash-divider` | `#F4F4F5` | Internal row dividers |

### Accent — Light Purple

| Token | Value | Usage |
|-------|-------|-------|
| `--dash-accent` | `#7C3AED` | Primary buttons, active nav, highlights |
| `--dash-accent-hover` | `#6D28D9` | Button hover state |
| `--dash-accent-fg` | `#FFFFFF` | Text on accent background |
| `--dash-accent-soft` | `#F5F3FF` | Accent tint backgrounds |
| `--dash-accent-ring` | `rgba(124,58,237,0.14)` | Focus rings |

### Icon Tiles

| Token | Value | Usage |
|-------|-------|-------|
| `--dash-icon-tile` | `#F5F3FF` | Icon container background |
| `--dash-icon-fg` | `#7C3AED` | Icon color |

### Rez AI

| Token | Value | Usage |
|-------|-------|-------|
| `--rez-glow` | `#7C3AED` | AI accent borders, active indicators |
| `--rez-glow-dim` | `rgba(124,58,237,0.12)` | Subtle AI borders/shadows |
| `--rez-glow-inner` | `rgba(124,58,237,0.05)` | Inner glow on AI cards |
| `--rez-online` | `#10B981` | Online/active pulse dot |
| `--rez-online-ring` | `rgba(16,185,129,0.25)` | Pulse ring |
| `--rez-highlight` | `rgba(124,58,237,0.05)` | AI message bubble backgrounds |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--dash-shadow-card` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)` | Cards and panels |
| `--dash-shadow-active` | `0 1px 4px rgba(124,58,237,0.18)` | Active nav item |

---

## Booking Page Tokens

Defined inline in `BookingFlow.tsx` and `AIChatBooking.tsx` as CSS variables on `.bk` / `.bk-chat`.

| Token | Value | Usage |
|-------|-------|-------|
| `--c-bg` | `#F5F1EA` | Warm ivory page background |
| `--c-surface` | `#FFFFFF` | Cards |
| `--c-text` | `#1A1614` | Primary text |
| `--c-sub` | `#7C736D` | Secondary text |
| `--c-muted` | `#ABA39D` | Placeholders |
| `--c-border` | `#E4DDD4` | Borders |
| `--c-accent` | `#B86332` | Terracotta — CTA, focus rings, dots |
| `--c-accent-soft` | `#FBF0E9` | Accent hover backgrounds |

---

## Component Patterns

### Buttons (Dashboard)

```
Primary (dash variant):    bg #7C3AED · text white · hover #6D28D9
Outline (dashOutline):     border #E4E4E7 · bg white · hover bg #F4F4F5
Ghost (dashGhost):         transparent · hover bg #F4F4F5
Destructive:               bg red-50 · text red-700
```

### Buttons (Booking)

```
Primary (.bk-btn):         bg #1A1614 (near-black) · text white
Secondary (.bk-btn-sec):   border #E4DDD4 · bg white
Danger (.bk-btn-del):      bg #FFF2F1 · text red
```

### Cards

- Border radius: `0.875rem` (14px) dashboard, `22px` booking
- Border: `1px solid var(--dash-border)`
- Shadow: `var(--dash-shadow-card)` — subtle, no glow
- No `backdrop-filter`, no glass effects

### Inputs

- Border radius: `0.5rem` (dashboard), `12px` (booking)
- Focus: accent border + `3px` accent ring
- Background: white

---

## Design Rules

1. **No gradients** on backgrounds — flat colours only
2. **No glass / backdrop-filter** — clean solid surfaces
3. **No skin switching** — single theme, no localStorage toggling
4. **Light purple is the only accent** — `#7C3AED` throughout the dashboard
5. **Warm terracotta** (`#B86332`) is used only on the customer-facing booking pages
6. **Geist Sans** everywhere in the dashboard — no serif fonts in admin UI
7. **Fraunces + DM Sans** only on `/book/[slug]` pages — not loaded in dashboard
8. All new dashboard components must reference `var(--dash-*)` tokens, not hardcoded colours

---

## File Map

| File | Purpose |
|------|---------|
| `src/app/dashboard/dashboard-skins.css` | All dashboard CSS tokens and utility classes |
| `src/components/dashboard/dashboard-skin-context.tsx` | Static `DashboardSkinProvider` wrapper |
| `THEME.md` | This file — design reference |
