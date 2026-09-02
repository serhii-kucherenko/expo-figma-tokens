#!/usr/bin/env node
// Is the newest saved version of the Figma file named "Ready for dev"?
//
// Writes `match=true|false` to $GITHUB_OUTPUT so a workflow can gate on it.
// This is the no-server version of the trigger: the same signal the webhook
// carries - the version name the designer typed - read on a timer instead.
import { appendFileSync } from "node:fs";
import { figma, fileKey as resolveFileKey, requireEnv } from "./figma-api.mjs";

const TRIGGER = "ready for dev";

const token = requireEnv("FIGMA_TOKEN");
const fileKey = await resolveFileKey();

const { versions } = await figma(`/v1/files/${fileKey}/versions?page_size=10`, token);

// Figma inserts an unlabelled autosave version on every edit. Only named ones are a signal.
const named = (versions ?? []).find((v) => (v.label ?? "").trim() || (v.description ?? "").trim());

const text = `${named?.label ?? ""} ${named?.description ?? ""}`.toLowerCase();
const match = text.includes(TRIGGER);

// Figma has two text fields on a saved version, and the trigger may sit in
// either, so print both - otherwise a match looks unexplained.
console.log(
  named
    ? `newest named version at ${named.created_at} by ${named.user?.handle ?? "?"}\n` +
      `  title: "${(named.label ?? "").trim()}"\n` +
      `  description: "${(named.description ?? "").trim()}"`
    : "no named versions in the last 10 saves"
);
console.log(match ? `matches "${TRIGGER}" - syncing` : `does not match "${TRIGGER}" - skipping`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `match=${match}\n`);
  const shown = [named?.label, named?.description].filter((x) => (x ?? "").trim()).join(" - ");
  appendFileSync(process.env.GITHUB_OUTPUT, `label=${shown.replace(/\n/g, " ")}\n`);
}
