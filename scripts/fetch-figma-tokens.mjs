#!/usr/bin/env node
// Pulls tokens from Figma into tokens/tokens.json, for CI.
//
// Tries the Variables API first (matches what the designer actually uses), then
// falls back to the Styles API. Locally, prefer `npm run sync` - it reads the
// Figma desktop app directly and needs no token at all.
import { spawnSync } from "node:child_process";
import { requireEnv } from "./figma-api.mjs";

requireEnv("FIGMA_TOKEN");

const run = (script) =>
  spawnSync(process.execPath, [new URL(script, import.meta.url).pathname], { stdio: "inherit" });

console.log("Trying the Variables API...");
if (run("./fetch-figma-variables.mjs").status === 0) process.exit(0);

console.log("\nVariables API unavailable. Trying the Styles API...");
if (run("./fetch-figma-styles.mjs").status === 0) process.exit(0);

console.error(`
Both REST routes failed. The usual causes, in order:

1. FIGMA_TOKEN is missing the file_variables:read scope.
   Figma cannot add a scope to an existing token - generate a new one at
   https://www.figma.com/settings -> Security -> Personal access tokens, tick
   files:read AND file_variables:read, then:
       gh secret set FIGMA_TOKEN --repo <owner>/<repo>

2. The Variables REST API is Enterprise-plan only. With the scope present you
   will get a plan error instead of a scope error, which tells you it is this.

3. The Styles fallback found nothing because this file defines its design
   system as variables, not as published colour styles. That fallback only
   helps files built the other way round.

Local sync is unaffected: 'npm run sync' reads the Figma desktop app over its
own MCP server and needs no token and no plan.
`);
process.exit(1);
