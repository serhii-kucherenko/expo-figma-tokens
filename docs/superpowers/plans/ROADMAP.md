# Roadmap

Ordered. Take the top unblocked item.

## Now

1. **Give the Vercel relay a working GitHub token.** The hourly cron already opens the PR, so this
   only buys instant instead of within-the-hour. The relay's logic is proven end to end; the last
   `GH_TOKEN` in Vercel answered `401 Bad credentials`. Blocked on Serhii: only he can set it.
   Runbook in `infra/figma-webhook/README.md`.

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
- **Two sync routes, not three**: local MCP (no secrets, cannot run in CI) and REST. The Variables
  API needs `file_variables:read`, which Figma gates to Enterprise, and the Styles API cannot see a
  variables-based file at all. Both fetchers were deleted rather than left as dead paths.
- **CI resolves variables from the design, not from the variables panel.** `GET /v1/files/:key/nodes`
  needs only `file_content:read` and returns, per node, both the variable a fill is bound to and the
  colour it resolved to on that frame. Reading the three theme frames rebuilds the same table on any
  plan. Verified byte-identical to the MCP route across 15 variables x 3 modes.
- **The id -> name map is committed, not fetched.** REST gives variable ids, never names. So
  `npm run tokens:map` runs once on a Mac, asks the MCP server per node (deepest-first, subtracting
  names already taken, since a node answer covers its whole subtree), and writes `figma.variableIds`
  into `tokens.json`. Re-run it when a variable is renamed, added or removed - not on a value change.
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
