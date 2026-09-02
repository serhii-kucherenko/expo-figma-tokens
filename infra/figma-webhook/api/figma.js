// Figma webhook -> GitHub repository_dispatch.
// Fires only when the designer names a version (or publishes) with the trigger phrase.
// ponytail: one handler, no framework, no router.

const TRIGGER = "ready for dev";

// FILE_VERSION_UPDATE is what a normal design file emits when someone does
// File -> Save to version history and names it. LIBRARY_PUBLISH only fires for
// published libraries, which most files are not.
const EVENTS = ["FILE_VERSION_UPDATE", "LIBRARY_PUBLISH"];

// Figma has used more than one name for "the text the designer typed", and it
// differs by event. Check every candidate rather than guess one and fail silently.
const MESSAGE_FIELDS = ["label", "description", "version_name", "name"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("POST only");

  const event = req.body ?? {};

  // Figma echoes back the passcode we set when registering the webhook.
  if (event.passcode !== process.env.FIGMA_PASSCODE) return res.status(401).send("bad passcode");

  if (event.event_type === "PING") return res.status(200).send("pong");
  if (!EVENTS.includes(event.event_type)) {
    return res.status(200).send(`ignored: event ${event.event_type}, want one of ${EVENTS.join(", ")}`);
  }

  const seen = MESSAGE_FIELDS.filter((f) => typeof event[f] === "string").map((f) => `${f}="${event[f]}"`);
  const matched = MESSAGE_FIELDS.some(
    (f) => typeof event[f] === "string" && event[f].toLowerCase().includes(TRIGGER)
  );
  if (!matched) {
    return res
      .status(200)
      .send(`ignored: no field contains "${TRIGGER}". Saw ${seen.length ? seen.join(", ") : "no text fields"}`);
  }

  const message = MESSAGE_FIELDS.map((f) => event[f]).find(
    (v) => typeof v === "string" && v.toLowerCase().includes(TRIGGER)
  );

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
        event: event.event_type,
        file_name: event.file_name ?? null,
        file_key: event.file_key ?? null,
        triggered_by: event.triggered_by?.handle ?? null,
      },
    }),
  });

  if (!gh.ok) {
    const body = await gh.text();
    if (gh.status === 401) {
      // "Bad credentials" is about the token string itself, not its permissions.
      // Report its shape so a truncated or whitespace-padded paste is obvious.
      // Never the value: only the kind prefix and the length.
      const t = process.env.GH_TOKEN ?? "";
      const kind = t.includes("_") ? t.slice(0, t.indexOf("_") + 1) : "(no prefix)";
      const padded = t !== t.trim() ? " HAS LEADING/TRAILING WHITESPACE" : "";
      return res
        .status(502)
        .send(`github 401 bad credentials. Token kind=${kind} length=${t.length}${padded}`);
    }
    return res.status(502).send(`github ${gh.status}: ${body}`);
  }
  return res.status(200).send("dispatched");
}
