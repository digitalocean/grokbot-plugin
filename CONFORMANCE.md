# agent-plugins conformance checklist

This document maps [digitalocean/agent-plugins](https://github.internal.digitalocean.com/digitalocean/agent-plugins)
requirements to this Grok Bot repository. Status keys: **Met** (already satisfied),
**Fixed** (addressed in the conformance PR), **Blocked** (cannot fully satisfy outside agent-plugins).

## Repository layout

| Requirement                                                  | Status    | Notes                                                                                                         |
| ------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------- |
| Canonical `skills/<name>/SKILL.md` trees                     | **Fixed** | Skills moved to repo-root `skills/`; plugin keeps symlinks.                                                   |
| `plugins/<package>/skills/<name>` → `../../../skills/<name>` | **Fixed** | Eleven symlinks under `plugins/digitalocean-internal/skills/`.                                                |
| Domain package `.cursor-plugin/plugin.json`                  | **Met**   | `plugins/digitalocean-internal/.cursor-plugin/plugin.json` (Grok-specific fields retained).                   |
| Paired `.claude-plugin/plugin.json`                          | **Fixed** | Added under `plugins/digitalocean-internal/.claude-plugin/`.                                                  |
| `.cursor-plugin/marketplace.json` catalog                    | **Met**   | Catalog id stays `digitalocean-internal`; owner ``; display **DigitalOcean**. |
| Upstream package id `digitalocean` (agent-plugins)           | **Met**   | Documented below; Grok keeps `plugins/digitalocean-internal/` path and catalog id.                            |
| `.claude-plugin/marketplace.json`                            | **Fixed** | Mirror catalog for Claude Code / agent-plugins import.                                                        |
| `mcp.json` hosted connectors (7 endpoints)                   | **Met**   | Unchanged URLs and OAuth-per-connector model.                                                                 |
| Optional `rules/`, `hooks/`, `scripts/` per skill            | **Met**   | Not used (skills are instruction-only).                                                                       |

## Skill authoring (`CONTRIBUTING`, `writing-skills`)

| Requirement                                      | Status    | Notes                                                                                          |
| ------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------- |
| `name` matches directory; lowercase hyphenated   | **Met**   | Enforced in `tests/test_skill_conformance.py`.                                                 |
| `description` with action + **Use when** trigger | **Met**   | All user-facing skills; `digitalocean-safety` is policy-loaded (exception documented in test). |
| Folded YAML `description: >-`                    | **Met**   | Preserved via `format-markdown` shim (not bare `mdformat`).                                    |
| DO-specific content; no personal identifiers     | **Met**   | Manual review; no usernames/home paths in skills.                                              |
| `references/` for long sidecars                  | **Met**   | `digitalocean-app-platform`, `digitalocean-connect`.                                           |
| Register skill only via domain package symlinks  | **Fixed** | No per-skill marketplace entries.                                                              |

## Governance (`GOVERNANCE`, SEC-AI-002)

| Requirement                                           | Status      | Notes                                                                                                     |
| ----------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| `METADATA.yml` (maintainer, tier, declared endpoints) | **Fixed**   | `` / `` on all eleven skills.                    |
| Risk tier proposal                                    | **Fixed**   | `tier: 3` for `digitalocean-safety`; others `tier: 2`. Run `scripts/classify_skill.py --all` locally.     |
| No secrets / no guardrail bypass in skills            | **Met**     | Policy in `digitalocean-safety`.                                                                          |
| Dual approval (maintainers + ProdSec)                 | **Blocked** | Requires agent-plugins `CODEOWNERS` teams and GHE branch protection.                                      |
| SkillSpector CI gate                                  | **Blocked** | `scripts/skillspector_ci.sh` copied; scanner not in this repo’s CI (no `skillspector` on public runners). |
| Evals blocking at merge                               | **Blocked** | agent-plugins sets `EVAL_TEST_PASS_ENFORCE`; public CI runs unit tests only.                              |
| Secret scanning / Semgrep / sandboxed scripts         | **Blocked** | Org-level controls on internal GHE only.                                                                  |

## Testing (`testing-skills`, `AGENTS.md`)

| Requirement                                     | Status      | Notes                                                                                                                                     |
| ----------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Unit tests for repo/skill layout                | **Fixed**   | `tests/test_skill_conformance.py`.                                                                                                        |
| Integration evals for high-risk skills          | **Fixed**   | `digitalocean-safety` and `digitalocean-connect` under `skills/*/evals/` (pytest `integration`; need `skill-tools` + `MODEL_ACCESS_KEY`). |
| `conftest.py` + eval artifacts                  | **Blocked** | Full harness lives in agent-plugins; optional `uv sync --group evals` when on VPN/GHE.                                                    |
| `make evals` / `EVAL_TEST_PASSING_THRESHOLD=75` | **Fixed**   | `Makefile` target; runs when eval group installed.                                                                                        |

## Tooling and CI

| Requirement                          | Status      | Notes                                                                  |
| ------------------------------------ | ----------- | ---------------------------------------------------------------------- |
| `.mdformat.toml` (wrap 100)          | **Fixed**   | Matches agent-plugins.                                                 |
| `make lint` / `make lint-fix`        | **Fixed**   | Markdown + Ruff; GitHub Actions `lint.yml` on public `ubuntu-latest`.  |
| `scripts/classify_skill.py`          | **Fixed**   | Copied from agent-plugins snapshot.                                    |
| `uv` + `pyproject.toml` / lockfile   | **Partial** | `uv.lock` gitignored here; agent-plugins will run `uv lock` on import. |
| Pre-commit hook                      | **Blocked** | Not enabled in Grok Bot repo (optional for contributors).              |
| Internal `skill-tools` git pin in CI | **Blocked** | Needs Vault GHE token + `digitalocean/agent-skills` clone.             |

## PR #4 (`cursor/improve-do-skill-guidance-7e41`)

**Merged to `main`** (commit `1252418`). This branch was rebased onto `main`; PR #4 skill text for
`digitalocean-app-platform`, `digitalocean-connect`, `digitalocean-costs`, and
`digitalocean-troubleshoot` is carried in `skills/<name>/SKILL.md`.

## Submitting to agent-plugins later

1. Add package id **`digitalocean`** to **both** `.cursor-plugin/marketplace.json` and
   `.claude-plugin/marketplace.json` in agent-plugins (`source`: `digitalocean`, directory
   `plugins/digitalocean/`).
1. Copy `skills/*` into agent-plugins `skills/` (or merge if names collide).
1. Copy `plugins/digitalocean-internal/` into **`plugins/digitalocean/`** (rename only at upstream;
   keep `mcp.json` and policy JSON). Plugin **display name**: **DigitalOcean**.
1. Set `CODEOWNERS` to agent-plugins maintainers + ProdSec; enable SkillSpector, evals, and classify
   workflows.
1. Confirm Vault roles for `MODEL_ACCESS_KEY` if integration evals should gate merge.

**Grok Bot stays on** catalog/plugin id `digitalocean-internal` and path `plugins/digitalocean-internal/`
so existing team marketplace installs keep working.
