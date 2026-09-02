# figma-webhook relay

One serverless function. Figma cannot call GitHub's `repository_dispatch` endpoint itself, and the
"Ready for dev" check has to live somewhere. This is that somewhere.

Deploy it as its own Vercel project - it is not part of the Expo app.

```bash
cd infra/figma-webhook
npx vercel link          # create a new project, name it figma-webhook-relay
npx vercel env add FIGMA_PASSCODE production   # a long random string you invent, keep it
npx vercel env add GH_TOKEN production         # fine-grained PAT, Contents: read-write on the repo
npx vercel env add GITHUB_REPO production      # serhii-kucherenko/expo-figma-tokens
npx vercel deploy --prod
```

The endpoint is `<deployment-url>/api/figma`. That is the URL you register with Figma.

`GH_TOKEN`, not `GITHUB_TOKEN`: Vercel reserves names starting with `VERCEL_` and some CI names, and
`GITHUB_*` is injected by its Git integration.

Test it without Figma:

```bash
curl -X POST https://<deployment-url>/api/figma -H 'content-type: application/json' \
  -d '{"passcode":"<FIGMA_PASSCODE>","event_type":"LIBRARY_PUBLISH","description":"Ready for dev","file_name":"DS"}'
```

It answers `dispatched` on success, or names the check that rejected the event.
