#!/usr/bin/env node
// Pulls the whole design system from the Figma Dev Mode MCP server into
// tokens/tokens.json - colours from the variables, and the radius / type /
// spacing scale from the code the server generates for each theme frame.
//
// Needs the Figma desktop app open on the design file, with Preferences ->
// "Enable local MCP server" switched on. No token, no plan requirement.
// The theme node ids live in tokens/tokens.json under "figma".
import { readFileSync, writeFileSync } from "node:fs";
import { mcp } from "./figma-mcp-client.mjs";
import { geometryFromCode, primitivesFrom } from "./figma-nodes.mjs";

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
// The generated code cannot see inside a layer the designer flattened to an
// SVG - the toggle knob is 22px, and no class says so. REST reads the real node
// tree and does see it. So this route adds to the scale and never prunes it;
// `npm run tokens:fetch` is the one that decides what is no longer used.
const geo = { radius: new Set(), space: new Set(), text: new Set() };
for (const [name, { value }] of Object.entries(current.collections?.primitives?.variables ?? {})) {
  const [group, key] = name.split("/");
  if (geo[group] && Number.isInteger(value) && key !== "pill") geo[group].add(value);
}
for (const mode of modes) {
  byMode[mode] = await variablesFor(themeNodes[mode]);
  // Same frame, asked a second way: the generated code carries every explicit
  // radius, font size and spacing value the design uses.
  geometryFromCode(await mcp("get_design_context", { nodeId: themeNodes[mode] }), geo);
}

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

// Spacing, radius and type size are not variables on this file, so they come
// from the code generated for the same frames rather than from a variables panel.
current.collections.primitives = primitivesFrom(geo);
const primCount = Object.keys(current.collections.primitives.variables).length;

writeFileSync(tokensPath, JSON.stringify(current, null, 2) + "\n");
console.log(
  `pulled ${names.length} variables across ${modes.length} modes (${modes.join(", ")})\n` +
    `read ${primCount} primitives from the design ` +
    `(${geo.radius.size} radius, ${geo.text.size} text, ${geo.space.size} space)`
);
