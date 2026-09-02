#!/usr/bin/env node
// Figma REST -> tokens/tokens.json, on any Figma plan.
//
// The Variables endpoint is Enterprise-only, but the plain file endpoint is not,
// and Figma resolves every variable-bound fill to a real colour per node. So
// reading the three theme frames and looking at what each variable resolved to
// gives the same table the Variables endpoint would have returned.
//
// Needs FIGMA_TOKEN with file_content:read, and the id -> name map that
// scripts/map-figma-variable-ids.mjs writes into tokens/tokens.json.
import { readFileSync, writeFileSync } from "node:fs";
import { figma, fileKey as resolveFileKey, requireEnv, HEADER } from "./figma-api.mjs";
import { boundColours, walk } from "./figma-nodes.mjs";

const token = requireEnv("FIGMA_TOKEN");
const tokensPath = new URL("../tokens/tokens.json", import.meta.url);
const current = JSON.parse(readFileSync(tokensPath, "utf8"));
const { themeNodes, variableIds } = current.figma ?? {};

if (!themeNodes || !variableIds) {
  console.error(
    "tokens/tokens.json needs figma.themeNodes and figma.variableIds.\n" +
      "Run `npm run tokens:map` once from a Mac with Figma desktop open."
  );
  process.exit(1);
}

const fileKey = await resolveFileKey();
const modes = Object.keys(themeNodes);
const ids = modes.map((m) => themeNodes[m]).join(",");
const { nodes } = await figma(`/v1/files/${fileKey}/nodes?ids=${ids}`, token);

const byMode = {};
for (const mode of modes) {
  const key = themeNodes[mode];
  const doc = nodes[key]?.document ?? nodes[key.replace(":", "-")]?.document;
  if (!doc) {
    console.error(`REST returned no node ${key} for mode "${mode}".`);
    process.exit(1);
  }
  const found = {};
  walk(doc, (n) => {
    for (const { variableId, hex } of boundColours(n)) {
      const name = variableIds[variableId];
      if (name) found[name] ??= hex; // first use wins; later ones are the same value
    }
  });
  byMode[mode] = found;
}

const names = [...new Set(modes.flatMap((m) => Object.keys(byMode[m])))].sort();
if (names.length === 0) {
  console.error("No mapped variables resolved. The id map is probably stale - re-run `npm run tokens:map`.");
  process.exit(1);
}

// A variable resolved in one mode but not another means the design does not use
// it on that frame. Rendering it would produce undefined, so stop instead.
const gaps = names.flatMap((n) => modes.filter((m) => !byMode[m][n]).map((m) => `${n} not used in "${m}"`));
if (gaps.length) {
  console.error("Some variables could not be resolved:\n  " + gaps.join("\n  "));
  process.exit(1);
}

current.$comment = HEADER + " Pulled from the Figma REST file endpoint.";
current.collections.theme = {
  modes,
  variables: Object.fromEntries(
    names.map((n) => [n, Object.fromEntries(modes.map((m) => [m, byMode[m][n]]))])
  ),
};

writeFileSync(tokensPath, JSON.stringify(current, null, 2) + "\n");
console.log(`resolved ${names.length} variables across ${modes.length} modes (${modes.join(", ")})`);
