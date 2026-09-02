// Shared bits for the Figma fetchers.
import { readFileSync } from "node:fs";

// Local runs keep FIGMA_TOKEN in .env.local (gitignored). CI passes it as a real
// env var, so anything already set wins.
try {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {
  // no .env.local - fine, the env may already carry what we need
}

export const requireEnv = (key) => {
  const v = process.env[key];
  if (!v) {
    console.error(`Missing ${key}. Put it in .env.local or export it.`);
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
