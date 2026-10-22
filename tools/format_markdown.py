"""Format Markdown under skills/ while preserving folded YAML front matter.

Do not run bare ``mdformat`` on SKILL.md files; it can unwrap ``description:`` folds.
This shim matches the agent-plugins ``format-markdown`` entry point closely enough for
local lint in this repository.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import mdformat
from ruamel.yaml import YAML

FRONT_MATTER_END = "---\n"


def _repo_root(start: Path) -> Path:
    for parent in [start, *start.parents]:
        if (parent / "skills").is_dir() and (parent / ".mdformat.toml").is_file():
            return parent
    return start


def _split_front_matter(text: str) -> tuple[str | None, str]:
    if not text.startswith("---"):
        return None, text
    rest = text[3:]
    if rest.startswith("\n"):
        rest = rest[1:]
    elif rest.startswith("\r\n"):
        rest = rest[2:]
    else:
        return None, text
    end = rest.find("\n---")
    if end == -1:
        return None, text
    yaml_block = rest[:end]
    body = rest[end + 4 :]
    if body.startswith("\n"):
        body = body[1:]
    return yaml_block, body


def _format_front_matter(yaml_block: str) -> str:
    yaml = YAML()
    yaml.default_flow_style = False
    yaml.width = 100
    data = yaml.load(yaml_block) or {}
    from io import StringIO

    buf = StringIO()
    yaml.dump(data, buf)
    return buf.getvalue().rstrip("\n")


def format_file(path: Path, check: bool) -> bool:
    original = path.read_text(encoding="utf-8")
    yaml_block, body = _split_front_matter(original)
    if yaml_block is None:
        formatted_body = mdformat.text(original, extensions=["gfm"], options={"number": False})
        changed = formatted_body != original
    else:
        formatted_yaml = _format_front_matter(yaml_block)
        formatted_body = mdformat.text(body, extensions=["gfm"], options={"number": False})
        formatted = f"---\n{formatted_yaml}\n---\n{formatted_body}"
        if not formatted_body.endswith("\n") and original.endswith("\n"):
            formatted += "\n"
        changed = formatted != original
        if not changed:
            return True
        if check:
            print(f"would reformat: {path}", file=sys.stderr)
            return False
        path.write_text(formatted, encoding="utf-8")
        return True
    if check and changed:
        print(f"would reformat: {path}", file=sys.stderr)
        return False
    if not check and changed:
        path.write_text(formatted_body, encoding="utf-8")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Format Markdown with YAML front matter preserved."
    )
    parser.add_argument("paths", nargs="+", help="Files or directories")
    parser.add_argument(
        "--check", action="store_true", help="Exit non-zero if formatting would change files."
    )
    args = parser.parse_args()
    root = _repo_root(Path.cwd())
    ok = True
    for raw in args.paths:
        path = Path(raw)
        if not path.is_absolute():
            path = root / path
        if path.is_dir():
            files = sorted(path.rglob("*.md"))
        else:
            files = [path]
        for file in files:
            if not file.is_file():
                continue
            if not format_file(file, check=args.check):
                ok = False
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
