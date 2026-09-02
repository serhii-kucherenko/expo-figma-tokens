# expo-figma-tokens

An Expo app whose whole look comes from Figma variables. The designer publishes with **Ready for
dev** in the publish message; a pull request opens here with the new values.

Themes are Figma variable modes. Ship three (`light`, `dark`, `sunset`), add a fourth in Figma and it
shows up with no code change.

## Run it

```bash
npm install && npm run tokens && npx expo start
```

## The pipeline

```
Figma variables -> tokens/tokens.json -> src/theme/tokens.gen.ts -> Tailwind classes
```

`tokens/tokens.json` is the hand-off file. Never edit it by hand.

| Command | What it does |
|---|---|
| `npm run tokens` | Rebuild `src/theme/tokens.gen.ts` from `tokens/tokens.json` |
| `npm run tokens:fetch` | Pull variables from Figma into `tokens/tokens.json` (Enterprise plan) |
| `npm run typecheck` | `tsc --noEmit` |

## Styling

NativeWind (Tailwind for React Native) with CSS variables, the shadcn pattern. `ThemeProvider` sets
the variables; components use semantic classes:

```tsx
<View className="rounded-lg border border-border bg-surface p-5">
  <Text className="text-text">Themed without knowing which theme.</Text>
</View>
```

Rules live in [DESIGN.md](DESIGN.md).

## Wiring the Figma automation

Step-by-step, including which path applies to your Figma plan: [docs/figma-sync.md](docs/figma-sync.md).

Short version: a Cloudflare Worker receives Figma's `LIBRARY_PUBLISH` webhook, checks the publish
message for "Ready for dev", and fires a GitHub `repository_dispatch`. The Action pulls the variables,
regenerates the theme, and opens the PR.
