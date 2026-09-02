#!/usr/bin/env node
// One-time, run from a Mac with the Figma desktop app open on the file.
//
// REST tells us which variable id a node's fill is bound to. The Dev Mode MCP
// server tells us what that variable is called. Neither knows both, but both
// are keyed by node id, so joining on it gives the id -> name map CI needs.
//
// The catch: the MCP answer for a node covers its whole subtree, so a container
// names many variables. Working deepest-first fixes that. By the time we reach a
// container, every variable its children use is already named, so subtracting
// what we know leaves the container's own - and one leftover name against one
// bound colour is an unambiguous pair.
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
if (!Object.keys(themeNodes).length) {
  console.error('tokens/tokens.json needs figma.themeNodes, e.g. { "light": "2:67" }');
  process.exit(1);
}

const fileKey = await resolveFileKey();
const ids = Object.values(themeNodes).join(",");
const { nodes } = await figma(`/v1/files/${fileKey}/nodes?ids=${ids}`, token);

// Every node that paints with a variable, deepest first.
const candidates = [];
for (const [mode, key] of Object.entries(themeNodes)) {
  const doc = nodes[key]?.document ?? nodes[key.replace(":", "-")]?.document;
  if (!doc) {
    console.error(`REST returned no node ${key} for mode "${mode}". Check figma.themeNodes.`);
    process.exit(1);
  }
  walk(doc, (n, depth) => {
    const bound = boundColours(n);
    if (bound.length) candidates.push({ depth, id: n.id, variableIds: bound.map((b) => b.variableId) });
  });
}
candidates.sort((a, b) => b.depth - a.depth);

const variableIds = {};
const mapped = new Set();
const conflicts = [];
for (const { id, variableIds: bound } of candidates) {
  // Anything already named on this node is a descendant's or an earlier node's.
  const open = [...new Set(bound.filter((v) => !variableIds[v]))];
  if (open.length !== 1) continue;
  const variableId = open[0];
  let defs;
  try {
    defs = JSON.parse(await mcp("get_variable_defs", { nodeId: id.replace(":", "-") }));
  } catch {
    continue; // node the MCP server will not answer for; a sibling leaf will do
  }
  // Deepest-first means anything already named belongs to a descendant, not here.
  const names = Object.keys(defs).filter((n) => !mapped.has(n));
  if (names.length !== 1) continue; // still ambiguous - leave it to another node
  const name = names[0];
  const clash = Object.entries(variableIds).find(([vid, n]) => n === name && vid !== variableId);
  if (clash) conflicts.push(`"${name}" claimed by ${clash[0]} and ${variableId}`);
  variableIds[variableId] = name;
  mapped.add(name);
}

if (conflicts.length) {
  console.error("Two variable ids mapped to one name - the join is wrong:\n  " + conflicts.join("\n  "));
  process.exit(1);
}

const known = Object.keys(current.collections?.theme?.variables ?? {});
const missing = known.filter((n) => !mapped.has(n));

current.figma.variableIds = Object.fromEntries(
  Object.entries(variableIds).sort((a, b) => a[1].localeCompare(b[1]))
);
writeFileSync(tokensPath, JSON.stringify(current, null, 2) + "\n");

console.log(`mapped ${Object.keys(variableIds).length} variable ids`);
if (missing.length) {
  console.error(
    `\nnot mapped (${missing.length}): ${missing.join(", ")}\n` +
      "A variable is only mappable where the design paints something with it.\n" +
      "Use it on a plain shape or text layer in a theme frame, then run this again."
  );
  process.exit(1);
}
