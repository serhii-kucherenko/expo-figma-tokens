// Walking a Figma REST node tree for variable-bound colours.
import { hex } from "./figma-api.mjs";

export function walk(node, visit, depth = 0) {
  visit(node, depth);
  for (const child of node.children ?? []) walk(child, visit, depth + 1);
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

// The numbers the design actually uses. Figma has no variables for these on
// this file, so they are read off the geometry instead of a variables panel.
//
// Only deliberate values count: padding and gaps a designer typed into auto
// layout, and the size of a node they pinned to FIXED. A hugging node's width
// is whatever its text happened to measure, which is not a scale value.
export function geometry(node, out = { radius: new Set(), space: new Set(), text: new Set() }) {
  const add = (set, v) => {
    // Sub-pixel values are a nudge, not a token. Frame-sized values are canvas.
    if (Number.isInteger(v) && v > 0 && v <= 120) set.add(v);
  };

  if (typeof node.cornerRadius === "number") add(out.radius, node.cornerRadius);
  for (const r of node.rectangleCornerRadii ?? []) add(out.radius, r);

  add(out.space, node.itemSpacing);
  for (const p of ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom"]) {
    add(out.space, node[p]);
  }
  const box = node.absoluteBoundingBox;
  if (box) {
    if (node.layoutSizingHorizontal === "FIXED") add(out.space, box.width);
    if (node.layoutSizingVertical === "FIXED") add(out.space, box.height);
  }

  add(out.text, node.style?.fontSize);
  return out;
}

// { radius: Set, space: Set, text: Set } -> the primitives collection shape.
export function primitivesFrom({ radius, space, text }) {
  const scale = (prefix, values, extra = {}) =>
    Object.fromEntries([
      ...[...values].sort((a, b) => a - b).map((v) => [`${prefix}/${v}`, { value: v }]),
      ...Object.entries(extra),
    ]);
  return {
    modes: ["value"],
    variables: {
      // pill is not a design value - the design draws a full round as a big
      // radius. Naming it keeps `rounded-pill` readable in components.
      ...scale("radius", radius, { "radius/pill": { value: 999 } }),
      ...scale("text", text),
      ...scale("space", space),
    },
  };
}
