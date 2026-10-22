.PHONY: lint lint-fix test evals classify

MDFORMAT_PATHS ?= README.md CHANGELOG.md CONFORMANCE.md AGENTS.md skills plugins/digitalocean-internal/policy

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
	uv run --group dev python -m pytest tests skills -v -m "not integration"

evals:
	@echo "Run integration evals from digitalocean/agent-plugins after skill-tools is installed." >&2
	@exit 1

classify:
	uv run python scripts/classify_skill.py $(SKILLS)
