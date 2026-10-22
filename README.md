# DigitalOcean Cursor Plugin

**Run Droplets, App Platform, managed databases, DNS, firewalls, and monitoring on DigitalOcean.**

Official Cursor plugin (`digitalocean`) with seven hosted DigitalOcean MCP connectors,
eleven agent skills, and approval-tier policy maps plus optional hook enforcement.

**Includes:** 7 MCP connectors · 11 skills

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

## MCP connectors

Per-service hosted endpoints (not the `mcp.digitalocean.com` router). OAuth on first use unless noted.

| MCP server              | Endpoint                                           |
| ----------------------- | -------------------------------------------------- |
| digitalocean-droplets   | `https://droplets.mcp.digitalocean.com/mcp`        |
| digitalocean-apps       | `https://apps.mcp.digitalocean.com/mcp`            |
| digitalocean-accounts   | `https://accounts.mcp.digitalocean.com/mcp`        |
| digitalocean-databases  | `https://databases.mcp.digitalocean.com/mcp`       |
| digitalocean-networking | `https://networking.mcp.digitalocean.com/mcp`      |
| digitalocean-insights   | `https://insights.mcp.digitalocean.com/mcp`        |
| digitalocean-docs       | `https://docs.mcp.digitalocean.com/mcp` (no token) |

**Auth:** one OAuth grant per connector (not shared). Connect **Droplets** when you enable the plugin; connect **Apps**, **Accounts**, **Databases**, **Networking**, and **Insights** on first use (**digitalocean-connect** skill). Do not paste Personal Access Tokens in chat.

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

Tier maps live under [`plugins/digitalocean/policy/`](plugins/digitalocean/policy/) for
Droplets, Accounts, Networking, Databases, Apps, Insights, and Docs (read-only).

Skills enforce tiers; [`plugins/digitalocean/hooks/hooks.json`](plugins/digitalocean/hooks/hooks.json)
can enforce them at MCP execution time (`failClosed: true`). See README hook verification
in [SECURITY-REVIEW.md](SECURITY-REVIEW.md) for client caveats.

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
