# DigitalOcean (Internal)

**Run Droplets, apps, databases, and DNS on DigitalOcean.**

Internal Cursor plugin for Quinn's team (v1). Bundles seven DigitalOcean hosted
MCP connectors and eleven agent skills with an explicit Droplets approval tier
map. Designed to stay clean enough to upstream as an official DigitalOcean plugin
later.

**Includes:** 7 connectors · 11 skills

## Install (team marketplace)

1. In Cursor, open **Dashboard → Plugins & MCPs**.
2. Under **Team Marketplaces**, choose **Add Marketplace → Import from Repo**.
3. Paste this repository URL: `https://github.com/QuinnEckart/digitalocean-grokbot-plugin`
4. Cursor reads [`.cursor-plugin/marketplace.json`](.cursor-plugin/marketplace.json) and
   lists the **DigitalOcean (Internal)** container plugin automatically.
5. Add the plugin to the marketplace and set installation mode (Default Off,
   Default On, or Required).
6. Teammates install from **Customize** in the sidebar.

For local development, copy `plugins/digitalocean-internal` to
`~/.cursor/plugins/local/digitalocean-internal` and reload the window (see
[Cursor plugins docs](https://cursor.com/docs/plugins)).

## MCP connectors

Per-service endpoints (not the router). OAuth on first use unless noted.

| MCP server | Endpoint |
| --- | --- |
| digitalocean-droplets | `https://droplets.mcp.digitalocean.com/mcp` |
| digitalocean-apps | `https://apps.mcp.digitalocean.com/mcp` |
| digitalocean-accounts | `https://accounts.mcp.digitalocean.com/mcp` |
| digitalocean-databases | `https://databases.mcp.digitalocean.com/mcp` |
| digitalocean-networking | `https://networking.mcp.digitalocean.com/mcp` |
| digitalocean-insights | `https://insights.mcp.digitalocean.com/mcp` |
| digitalocean-docs | `https://docs.mcp.digitalocean.com/mcp` (no token) |

**Sign-in model (v1):** separate OAuth grant per connector. Connect **Droplets**,
**Apps**, and **Accounts** at install; connect **Databases**, **Networking**, and
**Insights** the first time a skill needs them. No shared scoped token by default.

Configuration lives in
[`plugins/digitalocean-internal/mcp.json`](plugins/digitalocean-internal/mcp.json)
(Cursor Plugin format).

## Skills

| Skill | Purpose |
| --- | --- |
| digitalocean | Route requests to the right skill and docs |
| digitalocean-connect | OAuth, lazy connect, 401/403/429 |
| digitalocean-safety | Approval tiers and global safety rules |
| digitalocean-costs | Price-first and billing reads |
| digitalocean-droplets | Droplet lifecycle (tier-gated) |
| digitalocean-app-platform | App specs, deploy, logs |
| digitalocean-databases | Managed DB operations |
| digitalocean-networking | DNS, firewalls, LB, VPC |
| digitalocean-monitoring | Insights uptime and alerts |
| digitalocean-troubleshoot | Cross-service diagnosis |
| digitalocean-inventory | Inventory and cleanup suggestions |

## Approval tiers

Cursor does not show DigitalOcean `readOnly` / `destructive` hints in the tool
UI. This plugin carries its own map for **all 43 Droplets tools** in
[`plugins/digitalocean-internal/policy/approval-tiers-droplets.json`](plugins/digitalocean-internal/policy/approval-tiers-droplets.json).

| Tier | Behavior |
| --- | --- |
| 1 | Read-only — no prompt |
| 2 | Confirm reversible change |
| 3 | Named high-risk (destructive / outage / bulk) |
| 4 | Show price before billable actions |

Skills enforce tiers in instructions until platform-level enforcement exists.

### Sync with upstream

Compare policy metadata to
[`droplet_annotations_test.go`](https://github.com/digitalocean-labs/mcp-digitalocean/blob/main/pkg/registry/droplet/droplet_annotations_test.go):

```bash
node scripts/sync-tier-map.mjs
node scripts/sync-tier-map.mjs --fail-on-diff   # CI-friendly
```

## Test plan

Manual tests only in v1 — **no live writes from automation in this repo.**

| Connector | Read smoke | Write (sandbox team, human-run) |
| --- | --- | --- |
| Droplets | `droplet-list`, `droplet-get`, `size-list`, `region-list`, `image-list` | Create smallest Droplet, snapshot, resize, power cycle, delete |
| Apps | `apps-list`, `apps-get-info`, `apps-get-logs`, `apps-get-deployment-status` | Hello-world deploy, update, delete |
| Accounts | `account-get-information`, `balance-get`, `billing-history-list`, `invoice-list` | Add/remove test SSH key |
| Databases | `db-cluster-list`, `db-cluster-get`, `db-cluster-list-options` | Smallest cluster lifecycle |
| Networking | `domain-list`, `domain-record-list`, `firewall-list`, `vpc-list` | TXT record + test firewall |
| Insights | `uptimecheck-list`, `alert-policy-list`, `insights-notification-channel-list` | Create/delete uptime check |
| Docs | `docs-search` | None; no sign-in |

Prompt scripts and skill trigger evals: [`tests/`](tests/).

Also verify per-connector OAuth, 403 scope errors (digitalocean-connect), and that
tool names match the policy file.

## Repository layout

```text
.cursor-plugin/marketplace.json              # Team marketplace manifest (lists plugins)
plugins/digitalocean-internal/
  .cursor-plugin/plugin.json                 # Container plugin manifest
  mcp.json                                   # Seven HTTP MCP servers
  assets/logo.svg
  policy/approval-tiers-droplets.json
  skills/*/SKILL.md                          # Eleven skills (auto-discovered)
scripts/sync-tier-map.mjs
tests/
```

## v1.1 (deferred)

Kubernetes (DOKS), Volumes, Spaces, Container Registry — additional connectors
and skills.

## License

MIT — see [LICENSE](LICENSE). App Platform guidance attribution in [NOTICE](NOTICE).
