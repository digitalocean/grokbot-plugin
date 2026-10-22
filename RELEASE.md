# Releases and marketplace pinning

Security review requires the Grok Bot team marketplace to install a **fixed**
plugin revision, not auto-tracking `main`.

## What this repo provides

- **Git tags** of the form `v1.0.x` (see [CHANGELOG.md](CHANGELOG.md)) on commits
  that passed `make lint`, `make test`, and `make tier-drift`.
- Policy maps pinned to upstream `mcp-digitalocean` commit **`8ce21db`** until
  intentionally bumped in `approval-tiers-*.json` and `scripts/sync-tier-map.mjs`.

## What the marketplace admin must do

In **Cursor Dashboard → Plugins & MCPs → Team Marketplaces** for catalog
`digitalocean-internal`:

1. Change the marketplace source from branch `main` to a **tag** (for example
   `v1.1.0`) or a **full commit SHA**.
1. Re-pin after each intentional upgrade; document the SHA in your change ticket.
1. Optional: disable auto-update for the marketplace entry if the UI exposes it.

This repository cannot set marketplace pin policy; only the dashboard (or
enterprise MDM) can.

## Suggested workflow

1. Merge security-reviewed changes to `main`.
1. Tag: `git tag -a v1.1.0 -m "..." && git push origin v1.1.0`
1. Update marketplace pin to `v1.1.0` (or the tag's SHA).
1. Ask operators to reload Cursor / reinstall the plugin if needed.
