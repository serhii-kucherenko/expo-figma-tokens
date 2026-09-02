# Roadmap

Ordered. Take the top unblocked item.

## Now

1. **Arm the hourly schedule.** Commented out in the workflow while Serhii tests the flow by hand,
   so a scheduled run does not race him. Uncomment the `schedule:` block once he is done.

## Next

2. **Screenshots.** Capture the Settings screen in all three themes into `docs/`, wire them into
   `README.md`, and add a command that regenerates them so they cannot go stale.
3. **Pull primitives as real variables.** They are read off the design geometry today, which works
   but infers intent from padding and fixed sizes. If the designer promotes spacing, radius and
   type size to Figma variables, drop the geometry pass for a plain variable read.
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
- **No webhook relay at all**: one was built on Vercel and then deleted. It bought instant instead
  of hourly, at the cost of a server kept alive holding a GitHub token. The scheduled poll reads the
  same version name, so it keeps the "Ready for dev" gate the relay was needed for.
- **Primitives read from geometry, not hand-written**: the file has 15 variables, all colours, and
  no published styles, so spacing/radius/type have nothing to read. Auto-layout padding, gaps and
  FIXED node sizes are deliberate values; a hugging node's width is not. `build-tokens.mjs` fails if
  the resulting scale no longer covers a class the components use, because NativeWind drops an
  unknown class in silence.
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
