// Shared bits for the two Figma fetchers.
export const requireEnv = (key) => {
  const v = process.env[key];
  if (!v) {
    console.error(`Missing ${key}.`);
    process.exit(1);
  }
  return v;
};

// The file key is not a secret, so it lives in figma.config.json. FIGMA_FILE_KEY overrides it.
export async function fileKey() {
  if (process.env.FIGMA_FILE_KEY) return process.env.FIGMA_FILE_KEY;
  const { default: cfg } = await import("../figma.config.json", { with: { type: "json" } });
  if (!cfg.fileKey) {
    console.error("No fileKey in figma.config.json and no FIGMA_FILE_KEY set.");
    process.exit(1);
  }
  return cfg.fileKey;
}

export async function figma(path, token) {
  const res = await fetch(`https://api.figma.com${path}`, { headers: { "X-Figma-Token": token } });
  if (!res.ok) {
    const err = new Error(`Figma API ${res.status} on ${path}: ${await res.text()}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const hex = ({ r, g, b, a = 1 }) => {
  const c = (n) => Math.round(n * 255).toString(16).padStart(2, "0").toUpperCase();
  return `#${c(r)}${c(g)}${c(b)}${a < 1 ? c(a) : ""}`;
};

export const slug = (s) =>
  String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const HEADER =
  "Source of truth for the design system. Figma writes this file; nothing else should edit it by hand.";
