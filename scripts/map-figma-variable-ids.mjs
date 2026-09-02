#!/usr/bin/env node
// One-time, run from a Mac with the Figma desktop app open on the file.
//
// REST tells us which variable id a node is bound to. The Dev Mode MCP server
// tells us what that variable is called. Neither knows both, but both are keyed
// by node id, so joining on it gives the id -> name map that CI needs.
//
// Writes the map into tokens/tokens.json under figma.variableIds.
import { readFileSync, writeFileSync } from "node:fs";
import { figma, fileKey as resolveFileKey, requireEnv } from "./figma-api.mjs";
import { mcp } from "./figma-mcp-client.mjs";
import { boundColours, walk } from "./figma-nodes.mjs";

const token = requireEnv("FIGMA_TOKEN");
const tokensPath = new URL("../tokens/tokens.json", import.meta.url);
const current = JSON.parse(readFileSync(tokensPath, "utf8"));
const themeNodes = current.figma?.themeNodes ?? {};
const anyNode = Object.values(themeNodes)[0];
if (!anyNode) {
  console.error('tokens/tokens.json needs figma.themeNodes, e.g. { "light": "2:67" }');
  process.exit(1);
}

const fileKey = await resolveFileKey();

// --- side A: node id -> variable id, per property, from REST -------------------
const { nodes } = await figma(`/v1/files/${fileKey}/nodes?ids=${anyNode}`, token);
const doc = nodes[anyNode]?.document ?? nodes[anyNode.replace(":", "-")]?.document;
if (!doc) {
  console.error(`REST returned no node ${anyNode}. Check figma.themeNodes.`);
  process.exit(1);
}

const byNode = new Map(); // "2:71" -> { fills: "VariableID:x", strokes: ... }
walk(doc, (n) => {
  for (const { variableId, prop } of boundColours(n)) {
    const entry = byNode.get(n.id) ?? {};
    entry[prop] = variableId;
    byNode.set(n.id, entry);
  }
});

// --- side B: node id -> variable name, per property, from the MCP server -------
const code = await mcp("get_design_context", { nodeId: anyNode.replace(":", "-") });

// Generated markup looks like:
//   <div className="bg-[var(--color\/card-bg,white)] border-[var(--color\/border,#e0e0e8)]"
//        data-node-id="2:82">
// so each element carries both the token names and its node id.
const names = new Map(); // "2:82" -> { fills: "color/card-bg", strokes: "color/border" }
for (const chunk of code.split(/(?=<[a-zA-Z])/)) {
  const id = chunk.match(/data-node-id="([^"]+)"/)?.[1];
  if (!id) continue;
  const entry = names.get(id) ?? {};
  for (const [, prefix, name] of chunk.matchAll(/\b(bg|text|border)-\[(?:color:)?var\(--([^,)]+)/g)) {
    entry[prefix === "border" ? "strokes" : "fills"] = name.replace(/\\/g, "");
  }
  if (Object.keys(entry).length) names.set(id, entry);
}

// --- join ---------------------------------------------------------------------
const variableIds = {};
const conflicts = [];
for (const [nodeId, props] of byNode) {
  for (const [prop, variableId] of Object.entries(props)) {
    const name = names.get(nodeId)?.[prop];
    if (!name) continue;
    if (variableIds[variableId] && variableIds[variableId] !== name) {
      conflicts.push(`${variableId}: "${variableIds[variableId]}" vs "${name}" (node ${nodeId})`);
    }
    variableIds[variableId] = name;
  }
}

if (conflicts.length) {
  console.error("Same variable id mapped to two names - the join is wrong:\n  " + conflicts.join("\n  "));
  process.exit(1);
}

const known = Object.keys(current.collections?.theme?.variables ?? {});
const missing = known.filter((n) => !Object.values(variableIds).includes(n));

current.figma.variableIds = Object.fromEntries(Object.entries(variableIds).sort((a, b) => a[1].localeCompare(b[1])));
writeFileSync(tokensPath, JSON.stringify(current, null, 2) + "\n");

console.log(`mapped ${Object.keys(variableIds).length} variable ids`);
if (missing.length) {
  console.log(
    `\nnot mapped (${missing.length}): ${missing.join(", ")}\n` +
      "A variable is only mappable where the design actually uses it. Use it somewhere\n" +
      "in the light theme frame, or accept that CI cannot see it."
  );
}
