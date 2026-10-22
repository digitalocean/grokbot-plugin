# DigitalOcean

**Run Droplets, apps, databases, and DNS on DigitalOcean.**

Internal Cursor plugin for Grok Bot (v1). Bundles seven DigitalOcean hosted
MCP connectors and eleven agent skills with an explicit Droplets approval tier
map. Designed to stay clean enough to upstream as an official DigitalOcean plugin
later.

**Includes:** 7 connectors · 11 skills

## Install (team marketplace)

1. In Cursor, open **Dashboard → Plugins & MCPs**.
1. Under **Team Marketplaces**, choose **Add Marketplace → Import from Repo**.
1. Paste this repository URL: `https://github.com/QuinnEckart/digitalocean-grokbot-plugin`
1. Cursor reads [`.cursor-plugin/marketplace.json`](.cursor-plugin/marketplace.json) and
   lists the **DigitalOcean** plugin (`digitalocean-internal` catalog id) automatically.
1. Add the plugin to the marketplace and set installation mode (Default Off,
   Default On, or Required).
1. Teammates install from **Customize** in the sidebar.

For local development, copy `plugins/digitalocean-internal` to
`~/.cursor/plugins/local/digitalocean-internal` and reload the window (see
[Cursor plugins docs](https://cursor.com/docs/plugins)).

## MCP connectors

Per-service endpoints (not the router). OAuth on first use unless noted.

| MCP server              | Endpoint                                           |
| ----------------------- | -------------------------------------------------- |
| digitalocean-droplets   | `https://droplets.mcp.digitalocean.com/mcp`        |
| digitalocean-apps       | `https://apps.mcp.digitalocean.com/mcp`            |
| digitalocean-accounts   | `https://accounts.mcp.digitalocean.com/mcp`        |
| digitalocean-databases  | `https://databases.mcp.digitalocean.com/mcp`       |
| digitalocean-networking | `https://networking.mcp.digitalocean.com/mcp`      |
| digitalocean-insights   | `https://insights.mcp.digitalocean.com/mcp`        |
| digitalocean-docs       | `https://docs.mcp.digitalocean.com/mcp` (no token) |

**Sign-in model (v1):** separate OAuth grant per connector. Connect **Droplets**
at install; connect **Apps**, **Accounts**, **Databases**, **Networking**, and
**Insights** on first use (**digitalocean-connect**). `mcp.json` has no
install-time connect flag — lazy connect is skill-enforced only. Never paste
PATs in chat.

Configuration lives in
[`plugins/digitalocean-internal/mcp.json`](plugins/digitalocean-internal/mcp.json)
(Cursor Plugin format).

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

## Approval tiers

Cursor does not show DigitalOcean `readOnly` / `destructive` hints in the tool
UI. Tier maps ship for **Droplets, Accounts, Networking, Databases, and Apps**
under [`plugins/digitalocean-internal/policy/`](plugins/digitalocean-internal/policy/)
(all seven connectors; **docs** is read-only Tier 1 only).

| Tier | Behavior                                      |
| ---- | --------------------------------------------- |
| 1    | Read-only — no prompt                         |
| 2    | Confirm reversible change                     |
| 3    | Named high-risk (destructive / outage / bulk) |
| 4    | Show price before billable actions            |

Skills enforce tiers when hooks are unavailable; the plugin also ships
`hooks/hooks.json` (`beforeMCPExecution` + Claude `PreToolUse`, `failClosed: true`).

### Verify hook enforcement (Cursor / Claude Code)

1. Install the plugin from the team marketplace (or copy to `~/.cursor/plugins/local/`).
1. Enable **Settings → Agents → Third-Party Imports** if testing Claude-format hooks in Cursor.
1. Trigger a Tier 3 tool (for example `droplet-delete`) via the agent — expect an
   **ask** prompt naming targets from `tool_input`.
1. Trigger `uptimecheck-create` — expect **ask** (Tier 2). Trigger an unmapped
   tool name — expect **deny**.
1. Trigger `docs-search` — expect **allow** (Tier 1 read-only map).
1. **Caveat:** some Cursor **2.4.x** builds ignore hook `ask` while `deny` still
   works; confirm on the Grok Bot client version. See [SECURITY-REVIEW.md](SECURITY-REVIEW.md).

### Sync with upstream

```bash
make tier-drift
```

Compares every `approval-tiers-*.json` file to
[`mcp-digitalocean`](https://github.com/digitalocean-labs/mcp-digitalocean) `*_annotations_test.go`
at the pinned commit in each policy file (currently `8ce21db`). CI runs this on
every push and weekly (Mondays 06:00 UTC).

## Test plan

Manual tests only in v1 — **no live writes from automation in this repo.**

| Connector  | Read smoke                                                                       | Write (sandbox team, human-run)                                |
| ---------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Droplets   | `droplet-list`, `droplet-get`, `size-list`, `region-list`, `image-list`          | Create smallest Droplet, snapshot, resize, power cycle, delete |
| Apps       | `apps-list`, `apps-get-info`, `apps-get-logs`, `apps-get-deployment-status`      | Hello-world deploy, update, delete                             |
| Accounts   | `account-get-information`, `balance-get`, `billing-history-list`, `invoice-list` | Add/remove test SSH key                                        |
| Databases  | `db-cluster-list`, `db-cluster-get`, `db-cluster-list-options`                   | Smallest cluster lifecycle                                     |
| Networking | `domain-list`, `domain-record-list`, `firewall-list`, `vpc-list`                 | TXT record + test firewall                                     |
| Insights   | `uptimecheck-list`, `alert-policy-list`, `insights-notification-channel-list`    | Create/delete uptime check                                     |
| Docs       | `docs-search`                                                                    | None; no sign-in                                               |

Prompt scripts and skill trigger evals: [`tests/`](tests/).

Also verify per-connector OAuth, 403 scope errors (digitalocean-connect), and that
tool names match the policy file.

## Repository layout

```text
.cursor-plugin/marketplace.json              # Team marketplace manifest (lists plugins)
.claude-plugin/marketplace.json              # Claude Code catalog (agent-plugins-aligned)
skills/<name>/SKILL.md                      # Canonical skill trees (+ METADATA.yml, evals/)
plugins/digitalocean-internal/
  .cursor-plugin/plugin.json                 # Container plugin manifest
  .claude-plugin/plugin.json                 # Claude manifest (paired)
  mcp.json                                   # Seven HTTP MCP servers
  assets/logo.svg
  policy/approval-tiers-*.json
  hooks/hooks.json                           # MCP tier enforcement (failClosed)
  lib/ + scripts/before-mcp-hook.mjs
  .mcp.json                                  # Claude Code MCP discovery (copy of mcp.json)
  skills/<name>/ → ../../../skills/<name>    # Symlinks for marketplace install
scripts/sync-tier-map.mjs
scripts/bootstrap-tier-maps.mjs
scripts/classify_skill.py                   # Advisory tier helper (from agent-plugins)
tests/
CONFORMANCE.md                              # agent-plugins requirement matrix
```

Local lint (Markdown + unit tests): `uv sync --group dev && make lint && make test`. See
[AGENTS.md](AGENTS.md) and [CONFORMANCE.md](CONFORMANCE.md).

### Marketplace pinning (recommended)

Pin the team marketplace to a **release tag or commit SHA**, not floating `main`,
after security review. Tags: see [RELEASE.md](RELEASE.md). Dashboard change is
required on the marketplace admin side (not controllable from this repo).

## v1.1 (deferred)

Kubernetes (DOKS), Volumes, Spaces, Container Registry — additional connectors
and skills.

## License

MIT — see [LICENSE](LICENSE). App Platform guidance attribution in [NOTICE](NOTICE).
