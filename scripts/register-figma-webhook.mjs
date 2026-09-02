#!/usr/bin/env node
// Registers the LIBRARY_PUBLISH webhook that points at the relay worker.
// Run once. Needs FIGMA_TOKEN (scope webhooks:write), FIGMA_TEAM_ID, RELAY_URL, FIGMA_PASSCODE.
const need = (k) => {
  const v = process.env[k];
  if (!v) {
    console.error(`Missing ${k}`);
    process.exit(1);
  }
  return v;
};

const res = await fetch("https://api.figma.com/v2/webhooks", {
  method: "POST",
  headers: { "X-Figma-Token": need("FIGMA_TOKEN"), "Content-Type": "application/json" },
  body: JSON.stringify({
    event_type: "LIBRARY_PUBLISH",
    context: "team",
    context_id: need("FIGMA_TEAM_ID"),
    endpoint: need("RELAY_URL"),
    passcode: need("FIGMA_PASSCODE"),
    description: "Ready for dev -> GitHub PR",
  }),
});

console.log(res.status, await res.text());
