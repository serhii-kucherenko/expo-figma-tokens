# figma-webhook relay

One serverless function. Figma cannot call GitHub's `repository_dispatch` endpoint itself, and the
"Ready for dev" check has to live somewhere. This is that somewhere.

## Deployed

| | |
|---|---|
| Vercel project | `figma-webhook` on team **Kucherenko Web** |
| Endpoint | <https://figma-webhook-flax.vercel.app/api/figma> |
| Dashboard | <https://vercel.com/kucherenko-web/figma-webhook> |
| Root Directory | `infra/figma-webhook` - a push to `main` redeploys it |

## Environment variables

| Name | Set? | What it is |
|---|---|---|
| `FIGMA_PASSCODE` | yes | Shared secret Figma echoes back. Value is in `.env.local` at the repo root (gitignored). |
| `GITHUB_REPO` | yes | `serhii-kucherenko/expo-figma-tokens` |
| `GH_TOKEN` | yes | Fine-grained GitHub PAT, Contents: read-write on this repo only |

`GH_TOKEN`, not `GITHUB_TOKEN`: Vercel's Git integration injects `GITHUB_*` names itself.

### If the relay answers `github 403: Resource not accessible by personal access token`

Two causes, both on the token:

1. **The repo is not in the token's list.** A fine-grained token defaults to *Public repositories*,
   and this repo is private. It must be **Only select repositories** -> `expo-figma-tokens`.
2. **Contents is read-only.** `repository_dispatch` needs **Contents: Read and write**.

Check both at <https://github.com/settings/personal-access-tokens>. Editing the token keeps the same
value, so nothing needs re-adding to Vercel afterwards.

A classic token with the `repo` scope also works and has no per-permission subtleties, at the cost of
being far broader than this endpoint needs.

Add the missing one:

```bash
cd infra/figma-webhook
npx vercel env add GH_TOKEN production --scope kucherenko-web
npx vercel deploy --prod --scope kucherenko-web
```

## Deployment protection must be off

Figma posts to this endpoint unauthenticated. Vercel Authentication is on by default and answers
every request with a 401 SSO page, so Figma never reaches the function.

Turn it off: <https://vercel.com/kucherenko-web/figma-webhook/settings/deployment-protection>
-> **Vercel Authentication** -> **Disabled** -> Save.

That is safe here. The function's own passcode check is the real gate: a request without the exact
`FIGMA_PASSCODE` is rejected before anything else happens, and the endpoint does nothing except
forward a matching publish event to GitHub.

## Test it without Figma

```bash
curl -X POST https://figma-webhook-flax.vercel.app/api/figma \
  -H 'content-type: application/json' \
  -d "{\"passcode\":\"$(grep FIGMA_PASSCODE ../../.env.local | cut -d= -f2)\",\"event_type\":\"LIBRARY_PUBLISH\",\"description\":\"Ready for dev\",\"file_name\":\"DS\"}"
```

Answers `dispatched` on success. Any other answer names the check that rejected the event, so you
can see exactly where it stopped.
