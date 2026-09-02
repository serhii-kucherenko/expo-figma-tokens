#!/usr/bin/env node
// Pulls tokens from Figma into tokens/tokens.json.
//
// Tries the Variables API first (richest, but Enterprise-plan only), then falls
// back to the Styles API (works on every plan). One command either way.
import { spawnSync } from "node:child_process";
import { requireEnv } from "./figma-api.mjs";

requireEnv("FIGMA_TOKEN");

const run = (script) =>
  spawnSync(process.execPath, [new URL(script, import.meta.url).pathname], { stdio: "inherit" });

console.log("Trying the Variables API (Enterprise plan)...");
if (run("./fetch-figma-variables.mjs").status === 0) process.exit(0);

console.log("\nVariables API unavailable. Falling back to the Styles API (any plan)...");
process.exit(run("./fetch-figma-styles.mjs").status ?? 1);
