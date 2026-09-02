#!/usr/bin/env node
// Pulls colour variables from the Figma Dev Mode MCP server into tokens/tokens.json.
//
// Needs the Figma desktop app open on the design file, with Preferences ->
// "Enable local MCP server" switched on. No token, no plan requirement.
// The theme node ids live in tokens/tokens.json under "figma".
import { readFileSync, writeFileSync } from "node:fs";

const URL_ = process.env.FIGMA_MCP_URL ?? "http://127.0.0.1:3845/mcp";
const tokensPath = new URL("../tokens/tokens.json", import.meta.url);
const current = JSON.parse(readFileSync(tokensPath, "utf8"));
const themeNodes = current.figma?.themeNodes;
if (!themeNodes) {
  console.error('tokens/tokens.json has no "figma".themeNodes map. Add one: { "light": "2:67", ... }');
  process.exit(1);
}

let sessionId;

async function rpc(body, extraHeaders = {}) {
  const res = await fetch(URL_, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-06-18",
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`MCP ${res.status}: ${await res.text()}`);
  if (!sessionId) sessionId = res.headers.get("mcp-session-id") ?? undefined;

  // The server answers as server-sent events; the payload is on the "data:" line.
  const text = await res.text();
  const line = text.split("\n").find((l) => l.startsWith("data: "));
  return line ? JSON.parse(line.slice(6)) : null;
}

async function variablesFor(nodeId) {
  const r = await rpc({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "get_variable_defs",
      arguments: { nodeId, clientLanguages: "typescript,tsx", clientFrameworks: "react-native,expo" },
    },
  });
  if (r?.error) throw new Error(`get_variable_defs(${nodeId}): ${r.error.message}`);
  const body = (r.result.content ?? []).map((c) => c.text ?? "").join("");
  return JSON.parse(body);
}

try {
  await rpc({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "expo-figma-tokens", version: "1.0" },
    },
  });
} catch (e) {
  console.error(
    `Cannot reach the Figma MCP server at ${URL_}.\n` +
      "Open the Figma desktop app, open the design file, then\n" +
      "Figma menu -> Preferences -> Enable local MCP server.\n\n" +
      String(e.message)
  );
  process.exit(1);
}
await rpc({ jsonrpc: "2.0", method: "notifications/initialized" });

const modes = Object.keys(themeNodes);
const byMode = {};
for (const mode of modes) byMode[mode] = await variablesFor(themeNodes[mode]);

// A variable present in one mode but not another would render as undefined. Fail loudly.
const names = [...new Set(modes.flatMap((m) => Object.keys(byMode[m])))].sort();
const gaps = names.flatMap((n) => modes.filter((m) => byMode[m][n] === undefined).map((m) => `${n} missing in "${m}"`));
if (gaps.length) {
  console.error("Incomplete variables in Figma:\n  " + gaps.join("\n  "));
  process.exit(1);
}

current.collections.theme = {
  modes,
  variables: Object.fromEntries(
    names.map((n) => [n, Object.fromEntries(modes.map((m) => [m, String(byMode[m][n]).toUpperCase()]))])
  ),
};

writeFileSync(tokensPath, JSON.stringify(current, null, 2) + "\n");
console.log(`pulled ${names.length} variables across ${modes.length} modes (${modes.join(", ")})`);
