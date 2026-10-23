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

## Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/)

## Commands

```bash
uv sync --group dev
make lint-fix && make lint
make test
```
