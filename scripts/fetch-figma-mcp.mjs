#!/usr/bin/env node
// Pulls colour variables from the Figma Dev Mode MCP server into tokens/tokens.json.
//
// Needs the Figma desktop app open on the design file, with Preferences ->
// "Enable local MCP server" switched on. No token, no plan requirement.
// The theme node ids live in tokens/tokens.json under "figma".
import { readFileSync, writeFileSync } from "node:fs";
import { mcp } from "./figma-mcp-client.mjs";

const tokensPath = new URL("../tokens/tokens.json", import.meta.url);
const current = JSON.parse(readFileSync(tokensPath, "utf8"));
const themeNodes = current.figma?.themeNodes;
if (!themeNodes) {
  console.error('tokens/tokens.json has no "figma".themeNodes map. Add one: { "light": "2:67", ... }');
  process.exit(1);
}

const variablesFor = async (nodeId) => {
  const body = await mcp("get_variable_defs", { nodeId });
  try {
    return JSON.parse(body);
  } catch {
    // The server answers in prose when it cannot serve the request at all,
    // e.g. the desktop app's active tab is not the design file.
    throw new Error(`Figma MCP server said: ${body.trim()}`);
  }
};

const modes = Object.keys(themeNodes);
const byMode = {};
for (const mode of modes) byMode[mode] = await variablesFor(themeNodes[mode]);

// A variable present in one mode but not another would render as undefined. Fail loudly.
const names = [...new Set(modes.flatMap((m) => Object.keys(byMode[m])))].sort();
const gaps = names.flatMap((n) => modes.filter((m) => byMode[m][n] === undefined).map((m) => `${n} missing in "${m}"`));
if (gaps.length) {
  console.error("Incomplete variables in Figma:\n  " + gaps.join("\n  "));
  process.exit(1);
}

current.collections.theme = {
  modes,
  variables: Object.fromEntries(
    names.map((n) => [n, Object.fromEntries(modes.map((m) => [m, String(byMode[m][n]).toUpperCase()]))])
  ),
};

writeFileSync(tokensPath, JSON.stringify(current, null, 2) + "\n");
console.log(`pulled ${names.length} variables across ${modes.length} modes (${modes.join(", ")})`);
