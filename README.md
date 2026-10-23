# DigitalOcean Agent Plugin

**Manage any DigitalOcean product — Droplets, App Platform, Kubernetes, managed
databases, networking, monitoring, and more — from your agent.**

An [Agent Plugins](https://agent-plugins.org/) package: the single hosted
DigitalOcean MCP server plus eleven agent skills. Portable across any
Agent-Plugins-compatible client (including Cursor).

## Layout

```text
.
├── plugin.json   # Agent Plugins manifest
├── mcp.json      # MCP server definition
└── skills/       # 11 skills (SKILL.md + METADATA.yml)
```

## MCP server

The plugin declares the single hosted **DigitalOcean MCP** server, which fronts
every first-party DigitalOcean service (the
[recommended setup](https://docs.digitalocean.com/reference/mcp/configure-mcp/)).

| MCP server   | Endpoint                           |
| ------------ | ---------------------------------- |
| digitalocean | `https://mcp.digitalocean.com/mcp` |

It exposes three meta-tools — `find_tools`, `retrieve_schema`, and `invoke_tool`
— and runs service tools (droplets, apps, databases, networking, accounts,
insights, docs, and more) by their qualified `service/tool` name.

**Auth:** one OAuth grant covers every service — connect DigitalOcean MCP in your
client (the **digitalocean-connect** skill walks through it). The config
([`mcp.json`](mcp.json)) uses hosted OAuth only, with no `${VAR}` placeholders or
tokens in the repo.

## Skills

| Skill                     | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| digitalocean              | Route requests to the right skill and docs |
| digitalocean-connect      | OAuth, lazy connect, 401/403/429           |
| digitalocean-safety       | Approval tiers and global safety rules     |
| digitalocean-costs        | Price-first and billing reads              |
| digitalocean-droplets     | Droplet lifecycle                          |
| digitalocean-app-platform | App specs, deploy, logs                    |
| digitalocean-databases    | Managed DB operations                      |
| digitalocean-networking   | DNS, firewalls, LB, VPC                    |
| digitalocean-monitoring   | Insights uptime and alerts                 |
| digitalocean-troubleshoot | Cross-service diagnosis                    |
| digitalocean-inventory    | Inventory and cleanup suggestions          |

## Safety

The **digitalocean-safety** skill defines approval tiers that every other skill
follows — **Tier 1** runs freely (reads), **Tier 2** confirms, **Tier 3** needs
named confirmation (destructive), **Tier 4** shows price first (billable).

## License

MIT — see [LICENSE](LICENSE).
