// Minimal MCP-over-HTTP client for the Figma Dev Mode server that the desktop
// app runs. Used by the scripts that have to run next to Figma.
const URL_ = process.env.FIGMA_MCP_URL ?? "http://127.0.0.1:3845/mcp";
let sessionId;

async function rpc(body) {
  const res = await fetch(URL_, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-06-18",
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`MCP ${res.status}: ${await res.text()}`);
  sessionId ??= res.headers.get("mcp-session-id") ?? undefined;

  // The server answers as server-sent events; the payload is on the "data:" line.
  const line = (await res.text()).split("\n").find((l) => l.startsWith("data: "));
  return line ? JSON.parse(line.slice(6)) : null;
}

let ready;
async function connect() {
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
    throw new Error(
      `Cannot reach the Figma MCP server at ${URL_}.\n` +
        "Open the Figma desktop app on the design file, then\n" +
        "Figma menu -> Preferences -> Enable local MCP server.\n\n" +
        e.message
    );
  }
  await rpc({ jsonrpc: "2.0", method: "notifications/initialized" });
}

export async function mcp(name, args = {}) {
  ready ??= connect();
  await ready;
  const r = await rpc({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name,
      arguments: { clientLanguages: "typescript,tsx", clientFrameworks: "react-native,expo", ...args },
    },
  });
  if (r?.error) throw new Error(`${name}: ${r.error.message}`);
  return (r.result.content ?? []).map((c) => c.text ?? "").join("");
}
