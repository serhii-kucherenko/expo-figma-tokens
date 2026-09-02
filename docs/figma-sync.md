# Figma -> GitHub PR runbook

Goal: the designer saves a Figma version named **Ready for dev**, and a pull request appears here
with the new token values.

## Route 0 - local sync, no setup at all

If you just want a Figma change in the app right now, you do not need any of the below.

1. Open the **Figma desktop app** on the design file.
2. Figma menu -> **Preferences** -> **Enable local MCP server**.
3. `npm run sync`

That reads the variables straight out of the running desktop app. No token, no plan requirement, no
webhook. It cannot run in CI - the server is local to your machine - which is what the rest of this
document is for.

The theme-to-node map lives in `tokens/tokens.json` under `figma.themeNodes`. Adding a theme means
adding one line there and re-running the sync.

## How the automatic route works

```
Designer: File -> Save to version history, names it "Ready for dev"
        |
        v
Figma FILE_VERSION_UPDATE webhook  ->  relay function (Vercel)  ->  GitHub repository_dispatch
                                    (checks the message)              |
                                                                      v
                                             GitHub Action: pull variables, rebuild theme, open PR
```

Three moving parts:

1. **The webhook** - Figma fires `FILE_VERSION_UPDATE` every time someone saves a named version.
   Registered once with `scripts/register-figma-webhook.mjs`. `LIBRARY_PUBLISH` is not used: it
   only fires for files published as a library, and this file is not one.
2. **The relay** - `infra/figma-webhook/api/figma.js`. Thirty lines on Vercel. It exists only
   because Figma cannot call GitHub's `repository_dispatch` endpoint directly, and because the
   "Ready for dev" filter has to live somewhere. Free on a Vercel hobby plan.
3. **The Action** - `.github/workflows/sync-figma-tokens.yml`. Pulls variables, regenerates the theme,
   opens the PR.

## Before you start: which path applies to you

**The Figma Variables REST API is Enterprise-plan only.** Check your plan first.

| Your Figma plan | Path |
|---|---|
| Enterprise | **Path A** below. Fully automatic. |
| Professional / Organization | **Path B** below. Tokens Studio plugin. |

---

## Path A - Enterprise (fully automatic)

### A1. Get a Figma personal access token

1. Open <https://www.figma.com/settings>.
2. Click the **Security** tab, scroll to **Personal access tokens**.
3. Click **Generate new token**.
4. Name: `expo-figma-tokens ci`. Expiration: 1 year (or No expiration).
5. Scopes - tick all three:
   - `files:read` - the Styles API fallback, works on every plan
   - `file_variables:read` - the Variables API, Enterprise plans only
   - `webhooks:write` - registers the publish webhook in step A6
6. Press Enter, then copy the token. **Figma shows it once.** Navigate away and you start over.

### A2. Get the file key and team id

- File key: open the library file. The URL is
  `https://www.figma.com/design/<FILE_KEY>/<name>`. Copy `<FILE_KEY>`.
- Team id: open the team page. The URL is `https://www.figma.com/files/team/<TEAM_ID>/...`.
  Copy `<TEAM_ID>`.

### A3. Add the repo secrets

```bash
gh secret set FIGMA_TOKEN --repo <owner>/expo-figma-tokens
gh secret set FIGMA_FILE_KEY --repo <owner>/expo-figma-tokens
```

Check it works before wiring the webhook:

```bash
gh workflow run "Sync Figma tokens" --repo <owner>/expo-figma-tokens
```

A PR titled `design: sync tokens from Figma` should appear within a minute. If it does not, read the
run log in the Actions tab.

### A4. Make a GitHub token for the relay

1. Open <https://github.com/settings/personal-access-tokens/new>.
2. Token name: `figma-token-relay`. Expiration: 1 year.
3. Repository access: **Only select repositories** -> this repo.
4. Permissions -> Repository permissions -> **Contents: Read and write**.
5. Generate, copy the token.

### A5. Deploy the relay

**Already done for this repo** - see `infra/figma-webhook/README.md` for the live URL, what is set,
and the two steps left (`GH_TOKEN`, and turning deployment protection off). The generic steps:

```bash
cd infra/figma-webhook
npx vercel link
npx vercel env add FIGMA_PASSCODE production   # invent a long random string, keep it
npx vercel env add GH_TOKEN production         # the token from A4
npx vercel env add GITHUB_REPO production      # <owner>/expo-figma-tokens
npx vercel deploy --prod
```

Vercel prints the deployment URL. The endpoint is that URL plus `/api/figma`. Copy it.

No Vercel account either? See **Route C** at the bottom - a scheduled poll with no server at all.

### A6. Register the webhook

```bash
FIGMA_TOKEN=<from A1> \
FIGMA_FILE_KEY=QFShnF5EA3cNl8afImTyuj \
RELAY_URL=https://figma-webhook-flax.vercel.app/api/figma \
FIGMA_PASSCODE=<in .env.local> \
node scripts/register-figma-webhook.mjs
```

A `200` response means it is live. Figma immediately sends a `PING`; the worker answers `pong`.

### A7. Test end to end

Ask the designer to do **File -> Save to version history** and name it **Ready for dev - test**.
Within a minute a PR should open. If nothing happens, `curl` the relay URL with a fake payload - it tells you exactly
which check rejected the event:

```bash
curl -X POST <RELAY_URL> -H 'content-type: application/json' \
  -d '{"passcode":"<FIGMA_PASSCODE>","event_type":"FILE_VERSION_UPDATE","label":"Ready for dev","file_name":"DS"}'
```

`<RELAY_URL>` ends in `/api/figma`.

---

## Path B - not on Enterprise (Tokens Studio plugin)

The relay and the trigger phrase still work. Only the "pull the values" step changes: the plugin
pushes the token JSON to GitHub instead of the Action pulling it.

1. The designer installs **Tokens Studio for Figma** from the Figma community.
2. In the plugin: **Settings -> Sync providers -> Add new -> GitHub**.
3. Fill in: repo `<owner>/expo-figma-tokens`, branch `figma/tokens`, file path `tokens/tokens.json`,
   and a GitHub token created the same way as step A4.
4. The designer presses **Push to GitHub** after publishing. The plugin opens a PR on `figma/tokens`.
5. Delete the `Pull variables from Figma` step from `.github/workflows/sync-figma-tokens.yml`, and
   change the trigger to `pull_request` on `tokens/tokens.json` so CI regenerates
   `src/theme/tokens.gen.ts` and pushes it into the same PR.

Trade-off: the designer has to press Push. There is no way around that without the Enterprise API.

---

## Facts this runbook depends on

- Variables REST API requires an Enterprise plan and a Full seat.
  <https://developers.figma.com/docs/rest-api/variables>
- Webhook limits are per plan: Professional 150 file webhooks, Organization 300, Enterprise 600.
  Team webhooks need team-admin rights. <https://developers.figma.com/docs/rest-api/webhooks>
- `FILE_VERSION_UPDATE` carries the version name and description. Figma's docs do not pin the exact
  field name, so the relay checks `label`, `description`, `version_name` and `name`, and its ignore
  response prints every text field it actually saw. If none of the four is right, that message tells
  you which one to add.

---

## Route C - no relay at all (scheduled poll)

If you do not want to host anything, drop the webhook and the relay and let GitHub check on a timer.

Add this to `.github/workflows/sync-figma-tokens.yml` under `on:`:

```yaml
  schedule:
    - cron: "0 */6 * * *"   # every 6 hours
```

`peter-evans/create-pull-request` opens a PR only when the token values actually changed, so a run
that finds nothing new is silent and free.

**What you give up:** the "Ready for dev" gate. A poll cannot see the publish message - that text
exists only in the webhook payload. So the PR appears for *any* variable change the designer saves,
including work in progress.

**Partial recovery:** the Action can read `GET /v1/files/:key/versions`, look at the newest label,
and skip the sync when it is not `Ready for dev`. Same gesture as the webhook route, checked on a
timer instead of pushed. That trades a server for a delay.
