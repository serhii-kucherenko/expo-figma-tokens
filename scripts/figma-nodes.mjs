// Walking a Figma REST node tree for variable-bound colours.
import { hex } from "./figma-api.mjs";

export function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

// A node can bind a variable to its fills and, separately, to its strokes.
// Figma resolves both to real colours per mode, so reading them off the three
// theme frames gives the same values the Variables endpoint would have.
export function boundColours(node) {
  const out = [];
  for (const prop of ["fills", "strokes"]) {
    const bindings = node.boundVariables?.[prop];
    if (!Array.isArray(bindings)) continue;
    bindings.forEach((binding, i) => {
      const paint = node[prop]?.[i];
      if (!binding?.id || paint?.type !== "SOLID" || !paint.color) return;
      out.push({
        variableId: binding.id,
        prop,
        hex: hex({ ...paint.color, a: paint.opacity ?? paint.color.a ?? 1 }),
      });
    });
  }
  return out;
}
