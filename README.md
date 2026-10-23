# DigitalOcean Cursor Plugin

**Manage any DigitalOcean product — Droplets, App Platform, Kubernetes, managed databases, networking, monitoring, and more — from Cursor.**

Official Cursor plugin (`digitalocean`) with the single hosted DigitalOcean MCP
connector, eleven agent skills, and approval-tier policy maps plus optional hook
enforcement.

**Includes:** 1 DigitalOcean MCP connector · 11 skills

## Install

### Cursor Marketplace (recommended)

After the plugin is published, install **DigitalOcean** from the
[Cursor Marketplace](https://cursor.com/marketplace) or submit this repo via
[cursor.com/marketplace/publish](https://cursor.com/marketplace/publish).

### Team marketplace (Git import)

1. Open **Dashboard → Plugins & MCPs**.
1. **Add Marketplace → Import from Repo**.
1. Use `https://github.com/digitalocean/grokbot-plugin` (must be a **public** repository).
1. Cursor reads [`.cursor-plugin/marketplace.json`](.cursor-plugin/marketplace.json) and lists the **digitalocean** plugin.
1. Teammates install from **Customize** in the sidebar.

### Local development

Copy [`plugins/digitalocean`](plugins/digitalocean) to
`~/.cursor/plugins/local/digitalocean` and reload the window. See
[Cursor plugins docs](https://cursor.com/docs/plugins).

Maintainers: after editing canonical [`skills/`](skills/), run
`make sync-plugin-skills` before committing (CI enforces parity).

## MCP connector

The plugin ships a single hosted **DigitalOcean MCP** server, which fronts every
first-party DigitalOcean service (the
[recommended setup](https://docs.digitalocean.com/reference/mcp/configure-mcp/)).

| MCP server   | Endpoint                           |
| ------------ | ---------------------------------- |
| digitalocean | `https://mcp.digitalocean.com/mcp` |

It exposes three meta-tools — `find_tools`, `retrieve_schema`, and `invoke_tool`
— and runs service tools (droplets, apps, databases, networking, accounts,
insights, docs, and more) by their qualified `service/tool` name.

**Auth:** one OAuth grant covers every service; connect DigitalOcean MCP from
**Customize → MCP** when you enable the plugin (**digitalocean-connect** skill).
Do not paste Personal Access Tokens in chat.

Configuration: [`plugins/digitalocean/mcp.json`](plugins/digitalocean/mcp.json) (Agent Plugins schema). No `${VAR}` placeholders — hosted OAuth only.

## Skills

| Skill                     | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| digitalocean              | Route requests to the right skill and docs |
| digitalocean-connect      | OAuth, lazy connect, 401/403/429           |
| digitalocean-safety       | Approval tiers and global safety rules     |
| digitalocean-costs        | Price-first and billing reads              |
| digitalocean-droplets     | Droplet lifecycle (tier-gated)             |
| digitalocean-app-platform | App specs, deploy, logs                    |
| digitalocean-databases    | Managed DB operations                      |
| digitalocean-networking   | DNS, firewalls, LB, VPC                    |
| digitalocean-monitoring   | Insights uptime and alerts                 |
| digitalocean-troubleshoot | Cross-service diagnosis                    |
| digitalocean-inventory    | Inventory and cleanup suggestions          |

## Approval tiers and hooks

Every tool is tiered — **Tier 1** runs freely (reads), **Tier 2** confirms,
**Tier 3** needs named confirmation (destructive), **Tier 4** shows price first
(billable). Because the server covers **all** DigitalOcean products, tiers are
assigned generically from the tool's verb, so no per-product map is required.
Curated maps under [`plugins/digitalocean/policy/`](plugins/digitalocean/policy/)
(Droplets, Accounts, Networking, Databases, Apps, Insights, Docs) act as precise,
upstream-synced **overrides** on top of that generic classification.

Skills enforce tiers; [`plugins/digitalocean/hooks/hooks.json`](plugins/digitalocean/hooks/hooks.json)
can enforce them at MCP execution time (`failClosed: true`): it unwraps the
`invoke_tool` target, applies an override if present, otherwise classifies by
verb, and returns **ask** for anything that is not a plain read. See
[SECURITY-REVIEW.md](SECURITY-REVIEW.md) for client caveats.

```bash
make tier-drift   # compare policy JSON to upstream mcp-digitalocean annotations
```

## Development

```bash
uv sync --group dev
make sync-plugin-skills   # after editing skills/
make lint-fix && make lint && make test
```

See [AGENTS.md](AGENTS.md), [CONFORMANCE.md](CONFORMANCE.md), and [SUBMISSION.md](SUBMISSION.md)
(marketplace logo: [`plugins/digitalocean/assets/logo.png`](plugins/digitalocean/assets/logo.png)).

## License

MIT — see [LICENSE](LICENSE). App Platform guidance attribution in [NOTICE](NOTICE).
