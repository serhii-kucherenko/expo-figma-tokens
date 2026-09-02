#!/usr/bin/env node
// Registers the FILE_VERSION_UPDATE webhook that points at the relay.
// That is the event a normal design file emits when someone names a version;
// LIBRARY_PUBLISH only fires for published libraries.
// Run once. Needs FIGMA_TOKEN (scope webhooks:write), FIGMA_FILE_KEY, RELAY_URL, FIGMA_PASSCODE.
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
    event_type: "FILE_VERSION_UPDATE",
    context: "file",
    context_id: need("FIGMA_FILE_KEY"),
    endpoint: need("RELAY_URL"),
    passcode: need("FIGMA_PASSCODE"),
    description: "Ready for dev -> GitHub PR",
  }),
});

console.log(res.status, await res.text());
