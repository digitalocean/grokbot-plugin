# agent-plugins conformance checklist

This document maps [digitalocean/agent-plugins](https://github.internal.digitalocean.com/digitalocean/agent-plugins)
requirements to this Grok Bot repository. Status keys: **Met** (already satisfied),
**Fixed** (addressed in the conformance PR), **Blocked** (cannot fully satisfy outside agent-plugins).

## Repository layout

| Requirement                                                  | Status    | Notes                                                                                       |
| ------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------- |
| Canonical `skills/<name>/SKILL.md` trees                     | **Fixed** | Skills moved to repo-root `skills/`; plugin keeps symlinks.                                 |
| `plugins/<package>/skills/<name>` → `../../../skills/<name>` | **Fixed** | Eleven symlinks under `plugins/digitalocean-internal/skills/`.                              |
| Domain package `.cursor-plugin/plugin.json`                  | **Met**   | `plugins/digitalocean-internal/.cursor-plugin/plugin.json` (Grok-specific fields retained). |
| Paired `.claude-plugin/plugin.json`                          | **Fixed** | Added under `plugins/digitalocean-internal/.claude-plugin/`.                                |
| `.cursor-plugin/marketplace.json` catalog                    | **Met**   | Grok Bot marketplace unchanged (`digitalocean-internal` entry).                             |
| `.claude-plugin/marketplace.json`                            | **Fixed** | Mirror catalog for Claude Code / agent-plugins import.                                      |
| `mcp.json` hosted connectors (7 endpoints)                   | **Met**   | Unchanged URLs and OAuth-per-connector model.                                               |
| Optional `rules/`, `hooks/`, `scripts/` per skill            | **Met**   | Not used (skills are instruction-only).                                                     |

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
| `METADATA.yml` (maintainer, tier, declared endpoints) | **Fixed**   | All eleven skills; `backup_maintainer` placeholder needs owner.                                           |
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

## Overlap with PR #4 (`cursor/improve-do-skill-guidance-7e41`)

PR #4 adds prose to `digitalocean-app-platform`, `digitalocean-connect`, `digitalocean-costs`, and
`digitalocean-troubleshoot` under the **old** path (`plugins/.../skills/`). This PR **moves** those
trees to `skills/` and replaces plugin paths with symlinks. **Merge PR #4 first**, then rebase this
branch (or cherry-pick its skill edits into `skills/<name>/`). No conflicting edits were made to
those four `SKILL.md` bodies here.

## Submitting to agent-plugins later

1. Add a domain package entry to **both** `.cursor-plugin/marketplace.json` and
   `.claude-plugin/marketplace.json` in agent-plugins (new package id, e.g. `digitalocean-mcp` or
   fold into an existing product package — **owner decision**).
1. Copy `skills/*` into agent-plugins `skills/` (or merge if names collide).
1. Copy `plugins/digitalocean-internal/` (minus Grok-only `repository` URL if needed) into
   `plugins/<package>/`; keep `mcp.json` and policy JSON.
1. Replace `backup_maintainer: pending-owner-assignment` with a real backup maintainer.
1. Register `CODEOWNERS` + ProdSec dual approval; enable SkillSpector, evals, and classify workflows.
1. Confirm Vault roles for `MODEL_ACCESS_KEY` if integration evals should gate merge.
