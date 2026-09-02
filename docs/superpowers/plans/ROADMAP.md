# Roadmap

Ordered. Take the top unblocked item.

## Now

1. **Wire the live Figma file.** Follow `docs/figma-sync.md`. Blocked on Serhii: needs a Figma
   personal access token, the file key, and the team id. Everything else is written and committed.

## Next

2. **Screenshots.** Capture the demo screen in all three themes into `docs/`, wire them into
   `README.md`, and add a command that regenerates them so they cannot go stale.
3. **Font tokens.** Today the app uses the platform system font. When the designer adds font
   variables, wire `primitives.font` into `tailwind.config.js` `fontFamily` and load the faces with
   `expo-font`.
4. **Token diff in the PR body.** The sync PR currently says "review the diff". Print a
   before/after table of changed tokens so review is a glance, not a JSON read.

## Later

5. **Second role in the demo.** MVP bar wants a multi-role E2E path. Add a "designer preview" mode
   that renders every component in every theme side by side, next to the current "developer" screen.

## Decided without asking

Grill tree decided without asking Serhii:
- **Token hand-off shape**: one committed `tokens/tokens.json` shaped like the Figma Variables API
  (collections -> modes -> variables). Both sync paths (Enterprise API, Tokens Studio plugin) write
  the same file, so the app never learns which path produced it.
- **Styling**: NativeWind v4 + CSS variables, not a bespoke theme context. It is the shadcn pattern
  and it is what was asked for. Tailwind pinned to v3 - NativeWind v4 does not support Tailwind v4.
- **Trigger**: Figma webhook + a Cloudflare Worker relay, not a cron poll. The "Ready for dev" phrase
  only exists in the webhook payload; a poll cannot see it.
- **Colour format**: hex, not OKLCH. React Native cannot parse `oklch()`.
- **No theme persistence**: in-memory only. AsyncStorage is a dependency the starter does not need.
