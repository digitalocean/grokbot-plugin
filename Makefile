.PHONY: lint lint-fix test evals classify

MDFORMAT_PATHS ?= README.md CHANGELOG.md CONFORMANCE.md AGENTS.md SECURITY-REVIEW.md RELEASE.md SUBMISSION.md skills plugins/digitalocean/policy

PYTHON_PATHS ?= tools scripts tests skills

EVAL_FILES ?= skills
EVAL_TEST_PASSING_THRESHOLD ?= 75

lint:
	uv run format-markdown --check $(MDFORMAT_PATHS)
	uv run ruff check $(PYTHON_PATHS)
	uv run ruff format --check $(PYTHON_PATHS)

lint-fix:
	uv run format-markdown $(MDFORMAT_PATHS)
	uv run ruff format $(PYTHON_PATHS)
	uv run ruff check --fix $(PYTHON_PATHS)

test:
	node scripts/sync-plugin-skills.mjs --check
	uv run --group dev python -m pytest tests skills -v -m "not integration"
	node --test tests/test_mcp_tier_policy.mjs

sync-plugin-skills:
	node scripts/sync-plugin-skills.mjs

tier-drift:
	node scripts/sync-tier-map.mjs --fail-on-diff

evals:
	@echo "Run integration evals from digitalocean/agent-plugins after skill-tools is installed." >&2
	@exit 1

classify:
	uv run python scripts/classify_skill.py $(SKILLS)
