# Cursor Marketplace submission — DigitalOcean plugin

Publisher checklist for [Submit a plugin](https://cursor.com/docs/reference/plugins#submitting-a-plugin) and the form at [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish).

## Submission checklist

| Item                                                     | Status   | Notes                                                                                                                                                                                                  |
| -------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Valid `.cursor-plugin/plugin.json` or root `plugin.json` | **Pass** | Both: [`plugins/digitalocean/.cursor-plugin/plugin.json`](plugins/digitalocean/.cursor-plugin/plugin.json) and [`plugins/digitalocean/plugin.json`](plugins/digitalocean/plugin.json) (Agent Plugins). |
| Unique lowercase kebab-case `name`                       | **Pass** | `digitalocean` (public id). `displayName`: **DigitalOcean**.                                                                                                                                           |
| Clear `description`                                      | **Pass** | Manifest + marketplace entry describe MCP connectors, skills, and safety tiers.                                                                                                                        |
| Valid component files and frontmatter                    | **Pass** | Eleven `SKILL.md` files with `name` + `description`; hooks, MCP, policy JSON validated in CI.                                                                                                          |
| Logo committed + relative path                           | **Pass** | [`plugins/digitalocean/assets/logo.svg`](plugins/digitalocean/assets/logo.svg); `"logo": "assets/logo.svg"`.                                                                                           |
| README usage and configuration                           | **Pass** | [README.md](README.md) — install, MCP OAuth, skills, tiers, dev commands.                                                                                                                              |
| Agent Plugins schema conformance                         | **Pass** | `mcp.json` uses `$schema` from agent-plugins.org; root `plugin.json` present.                                                                                                                          |
| Every `${VAR}` declared in manifest                      | **Pass** | No `${VAR}` in shipped `mcp.json` (OAuth hosted endpoints only). N/A until PAT/header vars are added.                                                                                                  |
| Relative paths only (no `..`)                            | **Pass** | Plugin skills are **copies** under `plugins/digitalocean/skills/` (synced via `scripts/sync-plugin-skills.mjs`). Tests reject `..` in manifest paths.                                                  |
| Tested locally                                           | **Pass** | `make lint` and `make test` (includes skill copy drift check).                                                                                                                                         |
| Root `marketplace.json` with unique plugin names         | **Pass** | [`.cursor-plugin/marketplace.json`](.cursor-plugin/marketplace.json) — marketplace `name` and plugin entry both `digitalocean`.                                                                        |

## Publisher form (draft)

| Field                 | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Publisher**         | DigitalOcean                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Repository URL**    | `https://github.com/digitalocean/grokbot-plugin` (must be **public** before review)                                                                                                                                                                                                                                                                                                                                                                    |
| **Maintainers**       | ``, ``                                                                                                                                                                                                                                                                                                                                                                                        |
| **Plugin name (id)**  | `digitalocean`                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Display name**      | DigitalOcean                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Short description** | Run Droplets, apps, databases, DNS, and monitoring on DigitalOcean with OAuth MCP connectors and approval-tier safety.                                                                                                                                                                                                                                                                                                                                 |
| **Long description**  | The DigitalOcean plugin bundles seven official hosted MCP connectors (Droplets, App Platform, Accounts, Databases, Networking, Insights, and public Docs) with eleven agent skills. Skills route tasks, enforce approval tiers for destructive and billable API actions, and document OAuth per connector. Optional plugin hooks fail closed on unmapped MCP writes. Tier maps sync to DigitalOcean’s open-source `mcp-digitalocean` annotation tests. |
| **Category**          | `cloud` (suggested; confirm against publisher UI options)                                                                                                                                                                                                                                                                                                                                                                                              |
| **Logo**              | `plugins/digitalocean/assets/logo.svg` (relative path in manifest)                                                                                                                                                                                                                                                                                                                                                                                     |
| **License**           | MIT                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Version**           | `1.1.0` (manifest)                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## Internal / pre-public content neutralized (not removed)

These were changed for public marketplace submission; policy and security content were **kept**, only identifiers and install paths were updated:

| Was (internal)                                                               | Now (public)                                                                       |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Plugin / catalog id `digitalocean-internal`                                  | `digitalocean`                                                                     |
| Path `plugins/digitalocean-internal/`                                        | `plugins/digitalocean/`                                                            |
| Repo `QuinnEckart/digitalocean-grokbot-plugin`                               | `digitalocean/grokbot-plugin` (target; see decisions)                              |
| README “Grok Bot internal” framing                                           | Official / marketplace-oriented README                                             |
| Skill symlinks `../../../skills/` (parent `..` paths)                        | Copied trees + `make sync-plugin-skills`                                           |
| Claude hook matcher `mcp__plugin_digitalocean-internal_…`                    | `mcp__plugin_digitalocean_…` (regex still accepts `-internal` for legacy installs) |
| `AGENTS.md` link to `github.internal.digitalocean.com`                       | Public GitHub URLs or removed                                                      |
| Author field email-only in manifest                                          | `DigitalOcean` + ``                                |
| `CONFORMANCE.md` Grok-only catalog id notes                                  | Updated for public `digitalocean` id                                               |
| Smoke test tag name `grokbot-test` in `tests/`                               | **Unchanged** — sandbox resource naming only, not user-facing copy                 |
| [`SECURITY-REVIEW.md`](SECURITY-REVIEW.md) Grok Bot / internal id references | Paths updated; historical review text retained for auditors                        |

## Human decisions required

1. **Repository hosting:** Create or transfer **`digitalocean/grokbot-plugin`** as a **public** repo and point the marketplace submission to it (current clone may still be under a personal fork until transfer).
1. **Grok Bot team marketplace:** Existing installs may use catalog id `digitalocean-internal`. Plan migration (re-import marketplace, pin version, or dual-publish) — not handled in this repo alone.
1. **Category / tags:** Confirm final category in the publisher UI (`cloud`, `developer tools`, etc.).
1. **First published version:** Tag `v1.1.0` (or align with DigitalOcean release process) after merge.
1. **SECURITY-REVIEW.md in public repo:** Keep as audit trail vs. move to internal docs — product/legal preference.
1. **OAuth / MCP product:** Hosted MCP URLs and OAuth clients are production DigitalOcean services; confirm marketplace listing is approved by MCP platform owners.
1. **Optional PAT variables:** If future manifests add `${API_TOKEN}` to `mcp.json`, declare `variables` in `plugin.json` per Cursor docs.

## Pre-submit commands

```bash
make sync-plugin-skills
make lint
make test
make tier-drift
```
