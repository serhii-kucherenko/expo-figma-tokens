// Figma LIBRARY_PUBLISH webhook -> GitHub repository_dispatch.
// Only fires when the designer's publish message contains the trigger phrase.
// ponytail: one handler, no framework, no router.

const TRIGGER = "ready for dev";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("POST only");

  const event = req.body ?? {};

  // Figma echoes back the passcode we set when registering the webhook.
  if (event.passcode !== process.env.FIGMA_PASSCODE) return res.status(401).send("bad passcode");

  if (event.event_type === "PING") return res.status(200).send("pong");
  if (event.event_type !== "LIBRARY_PUBLISH") return res.status(200).send("ignored: wrong event");

  const message = String(event.description ?? "");
  if (!message.toLowerCase().includes(TRIGGER)) {
    return res.status(200).send(`ignored: message "${message}" does not contain "${TRIGGER}"`);
  }

  const gh = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPO}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "figma-token-relay",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: "figma-ready-for-dev",
      client_payload: {
        description: message,
        file_name: event.file_name ?? null,
        file_key: event.file_key ?? null,
        triggered_by: event.triggered_by?.handle ?? null,
      },
    }),
  });

  if (!gh.ok) return res.status(502).send(`github ${gh.status}: ${await gh.text()}`);
  return res.status(200).send("dispatched");
}
