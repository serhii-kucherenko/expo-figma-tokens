# Roadmap

Ordered. Take the top unblocked item.

## Now

1. **Wire the automatic route.** `npm run sync` already works locally against the live Figma file.
   The publish-to-PR path still needs a Figma personal access token and the relay deployed - see
   `docs/figma-sync.md`. Blocked on Serhii: only he can create the token.

## Next

2. **Screenshots.** Capture the Settings screen in all three themes into `docs/`, wire them into
   `README.md`, and add a command that regenerates them so they cannot go stale.
3. **Sync the primitives too.** Spacing, radius and type sizes were read off the design, not pulled
   from Figma. When the designer promotes them to variables, extend `scripts/fetch-figma-mcp.mjs`
   to pull that collection and drop the hand-written scale.
4. **Token diff in the PR body.** The sync PR says "review the diff". Print a before/after table of
   changed tokens so review is a glance, not a JSON read.

## Later

5. **Second role in the demo.** MVP bar wants a multi-role E2E path. Add a "designer preview" mode
   that renders every component in every theme side by side, next to the current app screen.

## Decided without asking

Grill tree decided without asking Serhii:
- **Token hand-off shape**: one committed `tokens/tokens.json` shaped like the Figma Variables API
  (collections -> modes -> variables). All three sync routes write the same file, so the app never
  learns which one produced it.
- **Three sync routes, not one**: local MCP (no secrets, cannot run in CI), REST Variables API
  (Enterprise), REST Styles API (any plan). The dispatcher tries them in order.
- **Relay on Vercel, not Cloudflare**: Serhii already has two Vercel hobby teams wired to this
  GitHub account, so the relay costs him no new account. A scheduled poll is documented as Route C
  for anyone who wants zero hosting, but it cannot see the publish message and so loses the
  "Ready for dev" gate.
- **Mode-to-node map in `tokens.json`**: the MCP server resolves variables per node, so the file has
  to say which Figma frame means "dark". One line per theme.
- **Styling**: NativeWind v4 + CSS variables, the shadcn pattern. Tailwind pinned to v3 - NativeWind
  v4 does not support Tailwind v4.
- **Colour format**: hex, not OKLCH. React Native cannot parse `oklch()`.
- **Keep Figma's variable names verbatim** rather than inventing app-side semantic names. Costs a
  repetitive `text-text-primary`; buys a rename in Figma showing up as a compile-visible diff.
- **No device chrome**: the Figma frames draw a status bar and home indicator; the app lets the OS
  draw those and uses `SafeAreaView`.
- **No theme persistence**: in-memory only. AsyncStorage is a dependency the starter does not need.
