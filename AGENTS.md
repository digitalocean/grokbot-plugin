# Agent / developer guide (Grok Bot plugin)

This repository hosts the **DigitalOcean (Internal)** Cursor plugin for Grok Bot. Skill content
follows the layout and conventions of
[digitalocean/agent-plugins](https://github.internal.digitalocean.com/digitalocean/agent-plugins)
so the package can move into that monorepo later.

## Layout

- **`skills/<name>/`** — canonical skill trees (`SKILL.md`, optional `references/`, `evals/`,
  `METADATA.yml`).
- **`plugins/digitalocean-internal/`** — container plugin: `mcp.json`, policy, assets, and
  **`skills/<name>`** symlinks → `../../../skills/<name>`.
- **`.cursor-plugin/marketplace.json`** — Grok Bot team marketplace catalog (unchanged contract).
- **`.claude-plugin/marketplace.json`** — Claude Code catalog mirror for agent-plugins drop-in.

MCP OAuth endpoints live in `plugins/digitalocean-internal/mcp.json` (seven connectors; do not
change URLs without product sign-off).

## Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/)

## Commands

```bash
uv sync --group dev
make lint-fix && make lint
make test
```

Integration evals (internal network + `MODEL_ACCESS_KEY` + `skill-tools` from
`digitalocean/agent-skills`) run in the agent-plugins monorepo after these skill trees are
imported. Eval sources live under `skills/*/evals/` here for drop-in.

Advisory tier comment helper (same script as agent-plugins):

```bash
uv run python scripts/classify_skill.py --all
```

SkillSpector (when installed on PATH):

```bash
scripts/skillspector_ci.sh digitalocean-safety
```

See [CONFORMANCE.md](CONFORMANCE.md) for the full agent-plugins requirement matrix.
