#!/usr/bin/env node
// Figma Variables REST API -> tokens/tokens.json
//
// Needs: FIGMA_TOKEN (scope file_variables:read) and FIGMA_FILE_KEY.
// NOTE: the Variables REST API is Enterprise-plan only. On any other plan use the
// Tokens Studio plugin instead - it writes tokens/tokens.json straight from Figma.
// See docs/figma-sync.md.
import { writeFileSync } from "node:fs";

const token = process.env.FIGMA_TOKEN;
const fileKey = process.env.FIGMA_FILE_KEY;
if (!token || !fileKey) {
  console.error("Set FIGMA_TOKEN and FIGMA_FILE_KEY.");
  process.exit(1);
}

const res = await fetch(`https://api.figma.com/v1/files/${fileKey}/variables/local`, {
  headers: { "X-Figma-Token": token },
});
if (!res.ok) {
  console.error(`Figma API ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const { meta } = await res.json();

const hex = ({ r, g, b, a = 1 }) => {
  const c = (n) => Math.round(n * 255).toString(16).padStart(2, "0").toUpperCase();
  return `#${c(r)}${c(g)}${c(b)}${a < 1 ? c(a) : ""}`;
};

// Aliases point at another variable; follow the chain (depth-capped, cycles are a Figma bug not ours).
const resolve = (value, modeId, depth = 0) => {
  if (depth > 10) throw new Error("variable alias chain too deep");
  if (value && value.type === "VARIABLE_ALIAS") {
    const target = meta.variables[value.id];
    if (!target) throw new Error(`alias points at unknown variable ${value.id}`);
    const own = target.valuesByMode[modeId] ?? Object.values(target.valuesByMode)[0];
    return resolve(own, modeId, depth + 1);
  }
  if (value && typeof value === "object" && "r" in value) return hex(value);
  return value;
};

const slug = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const collections = {};
for (const collection of Object.values(meta.variableCollections)) {
  if (collection.remote) continue; // only variables defined in this file
  const modes = collection.modes.map((m) => slug(m.name));
  const variables = {};
  for (const id of collection.variableIds) {
    const v = meta.variables[id];
    if (!v || v.remote) continue;
    const byMode = {};
    collection.modes.forEach((m, i) => {
      byMode[modes[i]] = resolve(v.valuesByMode[m.modeId], m.modeId);
    });
    variables[v.name.split("/").map(slug).join("/")] = byMode;
  }
  collections[slug(collection.name)] = { modes, variables };
}

const out = {
  $comment:
    "Source of truth for the design system. Figma writes this file; nothing else should edit it by hand. Shape mirrors the Figma Variables API: collections -> modes -> variables.",
  collections,
};

writeFileSync(new URL("../tokens/tokens.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(
  `pulled ${Object.keys(collections).length} collections, ` +
    `${Object.values(collections).reduce((n, c) => n + Object.keys(c.variables).length, 0)} variables`
);
