# Changelog

## Unreleased

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
