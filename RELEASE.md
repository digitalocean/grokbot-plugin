# Releases and marketplace pinning

Pin team marketplaces and production installs to a **release tag or commit SHA**, not floating `main`.

## Tags

- **`v1.1.0`** — marketplace submission layout (`digitalocean` plugin id, copied skills, security hooks).

## Marketplace admin

In **Cursor Dashboard → Plugins & MCPs**, set the Git source to
`https://github.com/digitalocean/grokbot-plugin` at tag `v1.1.0` (or the release SHA).

## Verify before tagging

```bash
make sync-plugin-skills
make lint
make test
make tier-drift
```
