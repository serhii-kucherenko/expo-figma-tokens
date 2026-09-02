# DESIGN.md - expo-figma-tokens

Source of truth for how this app looks. Figma owns the values; this file owns the rules.

## Token pipeline

```
Figma variables  ->  tokens/tokens.json  ->  src/theme/tokens.gen.ts  ->  tailwind.config.js
   (designer)         (committed, generated)      (generated)              (utility classes)
```

- `tokens/tokens.json` is the only hand-off point. Never hand-edit it - Figma writes it.
- `npm run tokens` regenerates `src/theme/tokens.gen.ts`. Both files are committed so CI diffs are readable.
- `tailwind.config.js` reads `tokens/tokens.json` directly, so a new token is a utility class immediately.

## Colour

Colours are hex, not OKLCH: React Native's style engine does not parse `oklch()`. Figma exports hex,
so hex is also the shortest honest path. Contrast is checked against the `bg` and `surface` tokens of
each mode.

Nine semantic colour tokens, three modes (`light`, `dark`, `sunset`). Modes map 1:1 to Figma variable
modes, so adding a fourth theme in Figma adds it here with no code change.

| Token | Job |
|---|---|
| `bg` | Page ground |
| `surface` | Raised card ground |
| `text` | Primary reading colour |
| `muted` | Secondary text, captions, labels |
| `border` | Hairlines and card edges |
| `primary` | The one action colour |
| `primary-fg` | Text on `primary` |
| `accent` | Focus ring, highlights. Never a second CTA colour. |
| `danger` | Destructive only |

Rule: no raw hex in components. Use `bg-surface`, `text-muted`, `border-border`. A colour that is not
a token does not exist. Add it in Figma, publish, re-sync.

## Space and radius

4pt scale from `primitives`: `space/1` = 4 through `space/7` = 48. Radius: `sm` 6, `md` 12, `lg` 20,
`pill` 999. Cards use `rounded-lg`, buttons `rounded-md`, swatches `rounded-sm`.

## Type

Six sizes from `text/*` (12 / 14 / 16 / 20 / 28 / 40). Five roles, all in `src/components/ui/Text.tsx`:
`display`, `title`, `body`, `label`, `muted`. Headings are always roman - no italic display type.

Font family is the platform system font today. When the designer adds font variables in Figma, they
land in `primitives` and get wired into `tailwind.config.js` `fontFamily`.

## Components

`src/components/ui/` holds the primitives: `Text`, `Card`, `Badge`, `Button`. Variants are plain
lookup tables, not a class-variance library. Every interactive component ships default, active,
disabled, loading, and (on web) hover and focus-visible states.

## Motion

None yet. Add motion only when it carries information. Animate `transform` and `opacity` only, and
honour `prefers-reduced-motion`.

## Screenshots

None committed yet - roadmap item 2. When they land in `docs/`, they get regenerated in the same
commit as any change to the demo screen. A stale screenshot is worse than no screenshot.
