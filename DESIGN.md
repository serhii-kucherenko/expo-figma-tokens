# DESIGN.md - expo-figma-tokens

Source of truth for how this app looks. Figma owns the values; this file owns the rules.

Figma file: <https://www.figma.com/design/QFShnF5EA3cNl8afImTyuj/Untitled>
Theme frames: Light `2:67`, Dark `2:68`, Ocean `2:69`.

## Token pipeline

```
Figma variables  ->  tokens/tokens.json  ->  src/theme/tokens.gen.ts  ->  tailwind.config.js
   (designer)         (committed, generated)      (generated)              (utility classes)
```

- `tokens/tokens.json` is the only hand-off point. Never hand-edit it - Figma writes it.
- `npm run sync` pulls from Figma and regenerates the theme. `npm run tokens` regenerates only.
- `tailwind.config.js` reads `tokens/tokens.json` directly, so a new token is a utility class
  immediately.

## Colour

Fifteen colour variables, three modes (`light`, `dark`, `ocean`). Modes are Figma variable modes, so
a fourth theme added in Figma appears here with no code change.

Values are hex, not OKLCH: React Native's style engine cannot parse `oklch()`, and Figma exports hex.

| Token | Class | Job |
|---|---|---|
| `color/background` | `bg-background` | Screen ground |
| `color/surface` | `bg-surface` | Inset wells - row icon tiles |
| `color/surface-elevated` | `bg-surface-elevated` | Tab bar |
| `color/card-bg` | `bg-card-bg` | Card ground |
| `color/border` | `border-border` | Card and control edges |
| `color/border-subtle` | `border-border-subtle` | Row dividers, tab-bar top rule |
| `color/text-primary` | `text-text-primary` | Titles and row labels |
| `color/text-secondary` | `text-text-secondary` | Row values, eyebrows, captions |
| `color/text-tertiary` | `text-text-tertiary` | Chevrons, disabled |
| `color/primary` | `text-primary` | The one action colour |
| `color/switch-on` | `bg-switch-on` | Toggle track, on |
| `color/tab-active` / `color/tab-inactive` | `text-tab-*` | Tab bar states |
| `color/success` | `text-success` | Positive stat only |
| `color/warning` | `text-warning` | Caution stat only |

Rule: no raw hex in components. If a colour is not a token it does not exist - add it in Figma and
re-sync. The one exception is `ThemeOption`, which paints each theme's own swatch and therefore has
to read other themes' values from `tokens.gen.ts` rather than the active theme's CSS variables.

## Space, radius, type

`primitives` in `tokens/tokens.json` is a numeric scale holding every pixel size the Figma design
actually uses, so no component needs an arbitrary value: `p-16`, `gap-12`, `rounded-16`, `text-13`.

These are **not** Figma variables yet - they were read off the design. When the designer promotes
them to variables, extend `scripts/fetch-figma-mcp.mjs` to pull that collection too and delete this
paragraph.

Type roles live in `src/components/ui/Text.tsx` - `title` 28, `body` 16, `value` 14, `eyebrow` 13,
`stat` 22, `statLabel` 12, `tabLabel` 10. Headings are roman; no italic display type.

Font is **Inter** (400 / 500 / 600) via `@expo-google-fonts/inter`, matching the Figma file.

## Components

`src/components/ui/`: `Text`, `Card`, `SettingsRow` + `Divider`, `StatCard`, `ThemeOption`, `Toggle`,
`TabBar`. Variants are plain lookup tables, not a class-variance library. Every interactive component
ships default, active (pressed) and disabled states, and carries an accessibility role.

Device chrome is **not** re-drawn. The Figma frames include a status bar and home indicator so the
mockup reads as a phone; the real app lets the OS draw those and uses `SafeAreaView` for the insets.

## Motion

None yet. Add motion only when it carries information. Animate `transform` and `opacity` only, and
honour `prefers-reduced-motion`.

## Screenshots

None committed yet - roadmap item 2. When they land in `docs/`, they get regenerated in the same
commit as any change to the screen. A stale screenshot is worse than no screenshot.
