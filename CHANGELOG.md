# Changelog

## Unreleased

- Simplified to a pure **Agent Plugins** package: flattened the plugin to the repo root (`plugin.json` + `mcp.json` + `skills/`).
- Removed Cursor-specific packaging and ceremony: `.cursor-plugin/` (marketplace + manifest), the `beforeMCPExecution` hook and its tier-policy library, the per-service `policy/*.json` maps and their generators, and the smoke/eval fixtures. Approval tiers are now carried by the `digitalocean-safety` skill.

## 1.2.0

- Switch to the single hosted **DigitalOcean MCP** server (`mcp.digitalocean.com/mcp`); replaces the seven per-service connectors with one OAuth sign-in.
- Cursor-only plugin: removed Claude Code packaging (`.claude-plugin/`, `.mcp.json`, `PreToolUse` hook).
- Tier hook now runs only on Cursor `beforeMCPExecution`, unwraps the `invoke_tool` target (qualified `service/tool`), and tiers it generically by verb so **every** DigitalOcean product is covered; curated `policy/*.json` maps act as precise overrides. Unknown/non-read verbs default to Tier 2+ (`ask`) instead of a hard deny; discovery tools (`find_tools`, `retrieve_schema`) pass through.
- Updated skills, docs, and tests for the single DigitalOcean MCP server model.

## 1.1.0

- Public marketplace layout: plugin id `digitalocean`, path `plugins/digitalocean/`.
- Copied plugin skills (no `..` symlinks); `scripts/sync-plugin-skills.mjs`.
- Agent Plugins root `plugin.json` + SUBMISSION.md checklist.
- MCP tier enforcement hooks (`failClosed`) for Cursor and Claude Code.
- Tier maps for all connectors including Insights and Docs; drift CI + weekly schedule.
- Security-hardened skills, adversarial evals, SECURITY-REVIEW.md.

## 1.0.0 — 2026-10-22

- Initial internal release: seven per-service DigitalOcean MCP connectors, eleven skills, Droplets approval tier map (43 tools), and tier sync script.
- Deferred to v1.1: Kubernetes (DOKS), Volumes, Spaces, Container Registry.
