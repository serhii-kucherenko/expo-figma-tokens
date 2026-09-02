# Setup runbook

How to get this repo syncing from a Figma file. Section 0 of the [README](../README.md) covers why;
this covers the clicks.

There are two routes and they need different things. Start with the local one - it needs nothing.

---

## Route 1 - local sync (no token, no setup)

Works today, on any Figma plan.

1. Open the file in the **Figma desktop app**. Not the browser - the local server only runs
   next to the desktop app.
2. Figma menu -> Preferences -> tick **Enable local MCP server**.
3. `npm run sync`

That reads the variables straight out of Figma and rebuilds the theme. Colours only - the spacing
and type scale come from the REST route, and they move far less often.

If it says it cannot reach the server, the active tab is not a design file. Click the design tab and
run it again.

---

## Route 2 - GitHub opens a pull request

This is the one the designer's work flows through. Set it up once.

### 1. Make a Figma personal access token

1. Go to <https://www.figma.com/settings> -> **Security** tab.
2. Scroll to **Personal access tokens** -> **Generate new token**.
3. Name it `expo-figma-tokens CI`. Expiry: whatever you are comfortable with.
4. Scopes: tick **File content** (`file_content:read`) and **File versions**
   (`file_versions:read`). Nothing else is needed.
5. Copy the token now. Figma shows it once.

You do **not** need `file_variables:read`. See section 7 of the README for why.

### 2. Add it as a repo secret

```bash
gh secret set FIGMA_TOKEN
```

Paste the token when it asks. Or: repo -> Settings -> Secrets and variables -> Actions ->
**New repository secret**, name `FIGMA_TOKEN`.

### 3. Let Actions open pull requests

Off by default on a new repo. One call:

```bash
gh api -X PUT repos/OWNER/REPO/actions/permissions/workflow \
  -f default_workflow_permissions=write -F can_approve_pull_request_reviews=true
```

Or: repo -> Settings -> Actions -> General -> **Allow GitHub Actions to create and approve pull
requests**.

Skip it and the run still passes, but the last step fails with
`GitHub Actions is not permitted to create or approve pull requests`.

### 4. Point it at your file

`figma.config.json` holds the file key - the part of the Figma URL after `/design/`:

```
https://www.figma.com/design/QFShnF5EA3cNl8afImTyuj/Untitled
                             ^^^^^^^^^^^^^^^^^^^^^^
```

`tokens/tokens.json` holds `figma.themeNodes`, which says which frame is which theme. Right-click a
frame in Figma -> **Copy link**; the `node-id` in that URL is the value, with the `-` turned into a
`:`.

```json
"themeNodes": { "light": "2:67", "dark": "2:68", "ocean": "2:69" }
```

### 5. Build the variable-id map

REST returns variable **ids**, never names. This joins them, once, from your Mac:

```bash
echo "FIGMA_TOKEN=<your token>" >> .env.local   # gitignored
npm run tokens:map
```

Needs the Figma desktop app open on the file, same as Route 1. Commit the result.

Re-run it when the designer **renames, adds or removes** a variable. A colour value change does not
need it.

### 6. Test it

1. Change a colour variable in Figma.
2. **File -> Save to version history**, name it `Ready for dev`.
3. Actions tab -> **Sync Figma tokens** -> **Run workflow**.
4. A pull request appears.

### 7. Arm the schedule

Uncomment the `schedule:` block in `.github/workflows/sync-figma-tokens.yml`. It then checks hourly
and only acts when the newest saved version is named `Ready for dev`.

The manual button ignores that name check - a human asking is signal enough.

---

## Things worth knowing

- **The designer never leaves Figma.** No export, no plugin, no handoff file. Naming a version is
  the whole interface.
- **`tokens/tokens.json` is generated.** Editing it by hand works until the next sync overwrites it.
- **A rename is a breaking change on purpose.** If `color/primary` becomes `color/brand`, the class
  `bg-primary` stops existing and the build says so.
- **GitHub cron is not punctual.** An hourly job often runs 5-15 minutes late. If you need instant,
  see the webhook row in the README comparison table.
