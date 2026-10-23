.PHONY: lint lint-fix test

MDFORMAT_PATHS ?= README.md CHANGELOG.md AGENTS.md skills

PYTHON_PATHS ?= tools tests skills

lint:
	uv run format-markdown --check $(MDFORMAT_PATHS)
	uv run ruff check $(PYTHON_PATHS)
	uv run ruff format --check $(PYTHON_PATHS)

lint-fix:
	uv run format-markdown $(MDFORMAT_PATHS)
	uv run ruff format $(PYTHON_PATHS)
	uv run ruff check --fix $(PYTHON_PATHS)

test:
	uv run --group dev python -m pytest tests skills -v
