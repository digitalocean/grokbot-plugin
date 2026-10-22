# Agent / developer guide

Repository for the **DigitalOcean** Cursor plugin (`digitalocean`). Canonical skill trees
follow [Agent Plugins](https://agent-plugins.org/) layout for portability.

## Layout

- **`skills/<name>/`** — canonical skill trees (`SKILL.md`, optional `references/`, `evals/`,
  `METADATA.yml`).
- **`plugins/digitalocean/`** — shippable plugin: `mcp.json`, policy, hooks, assets, and
  **`skills/<name>/`** copies (run `make sync-plugin-skills` after editing canonical skills).
- **`.cursor-plugin/marketplace.json`** — multi-plugin catalog for Git import / marketplace.

MCP OAuth endpoints live in `plugins/digitalocean/mcp.json` (seven connectors; do not
change URLs without product sign-off).

## Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/)
- Node.js 20+ (tier drift + hook tests)

## Commands

```bash
uv sync --group dev
make sync-plugin-skills   # skills/ → plugins/digitalocean/skills/
make lint-fix && make lint
make test
make tier-drift
```

Integration evals (network + `MODEL_ACCESS_KEY` + `skill-tools`) run in a CI environment
that provides those dependencies. Eval sources live under `skills/*/evals/`.

Hook logic: `plugins/digitalocean/lib/mcp-tier-policy.mjs` (`tests/test_mcp_tier_policy.mjs`).

See [CONFORMANCE.md](CONFORMANCE.md) and [SUBMISSION.md](SUBMISSION.md).
