# Agent Plugins conformance

This document maps [Agent Plugins](https://agent-plugins.org/) expectations to this repository.

| Requirement                         | Status      | Notes                                                                                                |
| ----------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| Canonical `skills/<name>/` trees    | **Met**     | Eleven skills with `SKILL.md` + `METADATA.yml`.                                                      |
| Shippable plugin package            | **Met**     | `plugins/digitalocean/` with `.cursor-plugin/plugin.json`, `plugin.json`, `mcp.json`, hooks, policy. |
| Plugin skills without `..` paths    | **Met**     | Copies under `plugins/digitalocean/skills/` via `scripts/sync-plugin-skills.mjs`.                    |
| Paired `.claude-plugin/plugin.json` | **Met**     | `plugins/digitalocean/.claude-plugin/plugin.json` + `.mcp.json`.                                     |
| `.cursor-plugin/marketplace.json`   | **Met**     | Catalog `digitalocean`, plugin entry `digitalocean`.                                                 |
| MCP endpoint URLs                   | **Met**     | Seven hosted connectors; URLs unchanged without product sign-off.                                    |
| Tier policy JSON                    | **Met**     | `plugins/digitalocean/policy/approval-tiers-*.json`.                                                 |
| Integration evals                   | **Partial** | Under `skills/*/evals/`; require `skill-tools` in CI that provides it.                               |

Org-only controls (secret scanning on internal GitHub Enterprise, SkillSpector in internal CI) apply when this tree lives in DigitalOcean’s internal monorepo; this public repo uses `make lint` / `make test` instead.
