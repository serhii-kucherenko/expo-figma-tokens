// Figma LIBRARY_PUBLISH webhook -> GitHub repository_dispatch.
// Only fires when the designer's publish message contains the trigger phrase.
// ponytail: one handler, no framework, no router.

const TRIGGER = "ready for dev";

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("POST only", { status: 405 });

    const event = await request.json().catch(() => null);
    if (!event) return new Response("bad json", { status: 400 });

    // Figma echoes back the passcode we set when registering the webhook.
    if (event.passcode !== env.FIGMA_PASSCODE) return new Response("bad passcode", { status: 401 });

    if (event.event_type === "PING") return new Response("pong");
    if (event.event_type !== "LIBRARY_PUBLISH") return new Response("ignored: wrong event");

    const message = String(event.description ?? "");
    if (!message.toLowerCase().includes(TRIGGER)) {
      return new Response(`ignored: message "${message}" does not contain "${TRIGGER}"`);
    }

    const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
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

    if (!res.ok) return new Response(`github ${res.status}: ${await res.text()}`, { status: 502 });
    return new Response("dispatched");
  },
};
