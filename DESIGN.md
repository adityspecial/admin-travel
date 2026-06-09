# Design

## Theme

Light mode. Navy sidebar (#101a2f), white content surface. Restrained accent (blue).

## Color Palette

| Token | Value | Use |
|-------|-------|-----|
| `--accent` | oklch(0.52 0.195 264) | Primary actions, active nav, links |
| `--ink` | oklch(0.145 0.022 264) | Body text |
| `--ink-2` | oklch(0.42 0.022 264) | Secondary text, labels |
| `--ink-3` | oklch(0.62 0.016 264) | Muted / captions |
| `--bg` | oklch(0.975 0.006 255) | Page background |
| `--surface` | oklch(1 0 0) | Card background |
| `--border` | oklch(0.88 0.010 255) | All borders |
| `--sidebar-bg` | oklch(0.148 0.028 264) | Sidebar |
| `--teal` | oklch(0.60 0.13 196) | Biz portal accent |
| `--orange` | oklch(0.68 0.19 50) | Partner portal accent |

## Typography

- **Font**: Inter (variable, Google Fonts)
- **Scale**: Fixed rem — 11 / 12 / 13 / 15 / 18 / 22 / 28 / 36px
- **Weight contrast**: labels 500–600, headings 700–800, data 800
- **Letter-spacing**: -0.025em to -0.04em on headings

## Components

- Cards: white, 1px border, `var(--r-xl)` radius, `var(--shadow-sm)`
- Buttons: `var(--r-md)` radius, 8–9px vertical padding, 600 weight
- Tables: 11px uppercase headers, 13px td, row hover on `var(--bg-soft)`
- Badges: pill shape, semantic colors with light backgrounds
- Sidebar nav: 9px vertical padding, active = accent fill

## Spacing

Base unit 4px. Common: 8 / 12 / 16 / 20 / 24 / 32 / 40px.
