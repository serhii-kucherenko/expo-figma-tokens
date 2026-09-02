#!/usr/bin/env node
// Figma Variables REST API -> tokens/tokens.json
//
// Needs FIGMA_TOKEN with scope file_variables:read. The file key comes from
// figma.config.json. This endpoint is Enterprise-plan only; on any other plan it
// answers 403 and the dispatcher falls through to the styles fetcher.
import { writeFileSync } from "node:fs";
import { figma, fileKey as resolveFileKey, hex, requireEnv, slug, HEADER } from "./figma-api.mjs";

const token = requireEnv("FIGMA_TOKEN");
const fileKey = await resolveFileKey();

let meta;
try {
  ({ meta } = await figma(`/v1/files/${fileKey}/variables/local`, token));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

// Aliases point at another variable; follow the chain (depth-capped).
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

const out = { $comment: HEADER + " Pulled from the Figma Variables API.", collections };
writeFileSync(new URL("../tokens/tokens.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(
  `pulled ${Object.keys(collections).length} collections, ` +
    `${Object.values(collections).reduce((n, c) => n + Object.keys(c.variables).length, 0)} variables`
);
