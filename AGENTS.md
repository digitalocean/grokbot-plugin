# Agent / developer guide

This repository is a single [Agent Plugins](https://agent-plugins.org/) package
for **DigitalOcean**: `plugin.json` + `mcp.json` + `skills/`.

## Layout

- **`plugin.json`** — Agent Plugins manifest.
- **`mcp.json`** — the single hosted DigitalOcean MCP server
  (`https://mcp.digitalocean.com/mcp`; do not change the URL without product
  sign-off).
- **`skills/<name>/`** — skill trees (`SKILL.md`, optional `references/`,
  `METADATA.yml`).

## Conventions

- Each skill dir has a `SKILL.md` whose frontmatter `name` matches the directory.
- `METADATA.yml` records `maintainer`, `tier`, and `declared_endpoints` (the MCP
  URL above).
- Approval tiers live in the **digitalocean-safety** skill and are referenced by
  the other skills.
