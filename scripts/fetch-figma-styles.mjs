#!/usr/bin/env node
// Figma STYLES -> tokens/tokens.json. Works on every Figma plan.
//
// Naming convention the designer follows in Figma:
//   colour style  "light/bg"      -> theme collection, mode "light",  token color/bg
//   colour style  "dark/primary"  -> theme collection, mode "dark",   token color/primary
//   colour style  "brand"         -> theme collection, mode "default", token color/brand
//   text style    "body"          -> primitives, token text/body (font size)
//
// Needs FIGMA_TOKEN (scope files:read). The file key comes from figma.config.json.
import { writeFileSync } from "node:fs";
import { figma, fileKey as resolveFileKey, hex, requireEnv, slug, HEADER } from "./figma-api.mjs";

const token = requireEnv("FIGMA_TOKEN");
const fileKey = await resolveFileKey();

const { meta } = await figma(`/v1/files/${fileKey}/styles`, token);
const styles = meta.styles ?? [];
if (styles.length === 0) {
  console.error(
    "No published styles in this file - it defines its design system as variables instead.\n" +
      "This fallback only helps files built the other way round."
  );
  process.exit(1);
}

const wanted = styles.filter((s) => s.style_type === "FILL" || s.style_type === "TEXT");
const ids = wanted.map((s) => s.node_id);

// The styles endpoint gives names and node ids; the nodes endpoint gives the actual values.
const { nodes } = await figma(`/v1/files/${fileKey}/nodes?ids=${ids.join(",")}`, token);

const themeVars = {};
const modes = new Set();
const primitives = {};

for (const style of wanted) {
  const node = nodes[style.node_id]?.document;
  if (!node) continue;

  if (style.style_type === "FILL") {
    const fill = (node.fills ?? []).find((f) => f.type === "SOLID" && f.visible !== false);
    if (!fill) continue;
    const parts = style.name.split("/").map(slug).filter(Boolean);
    const mode = parts.length > 1 ? parts[0] : "default";
    const name = `color/${parts.slice(parts.length > 1 ? 1 : 0).join("-")}`;
    modes.add(mode);
    (themeVars[name] ??= {})[mode] = hex({ ...fill.color, a: fill.opacity ?? fill.color.a ?? 1 });
  }

  if (style.style_type === "TEXT" && node.style?.fontSize) {
    primitives[`text/${style.name.split("/").map(slug).join("-")}`] = {
      value: Math.round(node.style.fontSize),
    };
  }
}

const modeList = [...modes].sort((a, b) => (a === "light" ? -1 : b === "light" ? 1 : a.localeCompare(b)));

// A token missing from one mode would silently render as undefined. Fail loudly instead.
const gaps = [];
for (const [name, byMode] of Object.entries(themeVars)) {
  for (const mode of modeList) if (byMode[mode] === undefined) gaps.push(`${name} has no "${mode}" value`);
}
if (gaps.length) {
  console.error("Incomplete styles in Figma:\n  " + gaps.join("\n  "));
  process.exit(1);
}

const out = {
  $comment: HEADER + " Pulled from Figma styles.",
  collections: {
    theme: { modes: modeList, variables: themeVars },
    ...(Object.keys(primitives).length
      ? { primitives: { modes: ["value"], variables: primitives } }
      : {}),
  },
};

writeFileSync(new URL("../tokens/tokens.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(
  `pulled ${Object.keys(themeVars).length} colours across ${modeList.length} modes ` +
    `(${modeList.join(", ")}) and ${Object.keys(primitives).length} text sizes`
);
