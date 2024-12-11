# NRK Sjakk

En enkel implementasjon av [bluesky-social/feed-generator](https://github.com/bluesky-social/feed-generator) som lytter etter poster som matcher regexen `\b(nrk[s]*.*?sjakk\w*)\b` og lagrer disse i en sqlite database.

## Lokalt oppsett

Installer pakker med

```bash
yarn
```

Kjør med

```bash
yarn start
```

Feeden er da tilgjengelig på:
http://localhost/xrpc/app.bsky.feed.getFeedSkeleton?feed=at://did:example:alice/app.bsky.feed.generator/nrksjakk

Publiser eller oppdater feed

```bash
yarn publishFeed
```

Avpubliser feed

```bash
yarn unpublishFeed
```

## .env (mal)

```.env
FEEDGEN_PORT=3000
FEEDGEN_LISTENHOST="localhost"
FEEDGEN_SQLITE_LOCATION=":memory:"
FEEDGEN_SUBSCRIPTION_ENDPOINT="wss://bsky.network"
FEEDGEN_HOSTNAME="example.com"
FEEDGEN_PUBLISHER_DID="did:example:alice"
FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY=3000
```
