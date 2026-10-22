#!/usr/bin/env python3
"""Advisory skill Tier 1/2/3 heuristics (AENG-335)."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"

# Shared tokens for skill folder names and declared_endpoints hosts.
TIER3_SIGNALS = ("vault", "ldap", "secret", "prodsec", "prod", "identity", "cert")
SPECTOR_TIER3 = 40
SPECTOR_TIER2 = 25


def _parse_metadata(skill_dir: Path) -> tuple[int | None, list[str]]:
    meta = skill_dir / "METADATA.yml"
    if not meta.is_file():
        meta = skill_dir / "METADATA.yaml"
    if not meta.is_file():
        return None, []
    text = meta.read_text(encoding="utf-8")
    author = None
    m = re.search(r"(?m)^tier:\s*([123])\s*$", text)
    if m:
        author = int(m.group(1))
    endpoints: list[str] = []
    in_declared_endpoints = False
    for line in text.splitlines():
        if re.match(r"^declared_endpoints:\s*$", line):
            in_declared_endpoints = True
            continue
        if in_declared_endpoints:
            if re.match(r"^\S", line):
                break
            item = re.match(r"^\s*-\s+(.+?)\s*$", line)
            if item:
                endpoints.append(item.group(1).strip(" '\""))
            elif re.match(r"^\s*\[\s*\]\s*$", line):
                break
    return author, endpoints


def _spector_tier(path: Path | None) -> tuple[int | None, list[str]]:
    if path is None or not path.is_file():
        return None, []
    data = json.loads(path.read_text(encoding="utf-8"))
    ra = data.get("risk_assessment") or {}
    score = ra.get("score")
    rec = ra.get("recommendation")
    reasons: list[str] = []
    if score is None:
        return None, [f"SkillSpector report missing score ({path.name})"]
    tier = 1
    if score >= SPECTOR_TIER3:
        tier = 3
        reasons.append(f"SkillSpector score {score} >= {SPECTOR_TIER3} -> >=3")
    elif score >= SPECTOR_TIER2:
        tier = 2
        reasons.append(f"SkillSpector score {score} >= {SPECTOR_TIER2} -> >=2")
    if rec == "DO_NOT_INSTALL" and tier < 3:
        tier = 3
        reasons.append("SkillSpector DO_NOT_INSTALL -> >=3")
    if not reasons:
        reasons.append(f"SkillSpector score {score} (no tier bump)")
    return tier, reasons


def _tier(skill: str, *, spector_json: Path | None = None) -> dict:
    d = SKILLS / skill
    reasons: list[str] = []
    heuristic = 1

    author, endpoints = _parse_metadata(d)
    if author is not None:
        reasons.append(f"METADATA.yml tier {author}")

    if endpoints:
        heuristic = max(heuristic, 2)
        reasons.append(f"declared_endpoints ({len(endpoints)}) -> >=2")
        hot = sorted({t for ep in endpoints for t in TIER3_SIGNALS if t in ep.lower()})
        if hot:
            heuristic = max(heuristic, 3)
            reasons.append(f"sensitive endpoint host signal ({', '.join(hot)}) -> >=3")

    scripts = d / "scripts"
    if scripts.is_dir() and any(scripts.iterdir()):
        heuristic = max(heuristic, 2)
        reasons.append("has scripts/ -> >=2")

    if any(t in skill.lower() for t in TIER3_SIGNALS):
        heuristic = max(heuristic, 3)
        reasons.append("name matches Tier-3 signal -> 3")

    spector, spector_reasons = _spector_tier(spector_json)
    reasons.extend(spector_reasons)

    if heuristic == 1 and author is None and spector is None and not reasons:
        reasons.append("no Tier-2/3 signals -> 1")

    suggested = max(heuristic, author or 0, spector or 0) or 1
    if author is not None and heuristic > author:
        reasons.insert(
            0,
            f"**Disagreement:** heuristic Tier {heuristic} > author Tier {author}",
        )
    if author is not None and spector is not None and spector > author:
        reasons.insert(
            0,
            f"**Disagreement:** SkillSpector Tier {spector} > author Tier {author}",
        )

    return {
        "skill": skill,
        "suggested_tier": suggested,
        "author_tier": author,
        "heuristic_tier": heuristic,
        "spector_tier": spector,
        "reasons": reasons,
    }


def _changed(base: str, head: str) -> list[str]:
    # Three-dot: only commits reachable from head not from base (PR-unique
    # changes). Two-dot base..head also includes main commits after diverge.
    out = subprocess.check_output(
        ["git", "diff", "--name-only", f"{base}...{head}"],
        text=True,
        cwd=ROOT,
    )
    names: list[str] = []
    for line in out.splitlines():
        if not line.startswith("skills/"):
            continue
        name = line.split("/")[1]
        if (SKILLS / name / "SKILL.md").is_file() and name not in names:
            names.append(name)
    return sorted(names)


def _spector_path(skill: str, explicit: Path | None) -> Path | None:
    if explicit is not None:
        return explicit
    report_dir = os.environ.get("SKILLSPECTOR_REPORT_DIR")
    if not report_dir:
        return None
    path = Path(report_dir) / f"{skill}.json"
    return path if path.is_file() else None


def _markdown(rows: list[dict]) -> str:
    lines = [
        "<!-- skill-tier-advisory -->",
        "## Skill risk tier (advisory)",
        "",
        "| Skill | Suggested | Author | Heuristic | Spector |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]
    if not rows:
        lines += ["| - | - | - | - | - |", "", "No changed skills with `SKILL.md`."]
        return "\n".join(lines) + "\n"
    for r in rows:
        lines.append(
            f"| `{r['skill']}` | **{r['suggested_tier']}** | "
            f"{r['author_tier'] if r['author_tier'] is not None else '-'} | "
            f"{r['heuristic_tier']} | "
            f"{r['spector_tier'] if r['spector_tier'] is not None else '-'} |"
        )
    lines.append("")
    for r in rows:
        lines.append(f"### `{r['skill']}` - Tier {r['suggested_tier']}")
        for reason in r["reasons"]:
            lines.append(f"- {reason}")
        lines.append("")
    return "\n".join(lines)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("skills", nargs="*")
    p.add_argument("--all", action="store_true")
    p.add_argument("--changed", nargs=2, metavar=("BASE", "HEAD"))
    p.add_argument("--spector-json", type=Path, help="SkillSpector JSON (single skill)")
    p.add_argument("--markdown", action="store_true")
    args = p.parse_args()

    if args.all:
        names = sorted(
            d.name for d in SKILLS.iterdir() if d.is_dir() and (d / "SKILL.md").is_file()
        )
    elif args.changed:
        names = _changed(*args.changed)
    elif args.skills:
        names = args.skills
    else:
        p.error("pass skill names, --all, or --changed BASE HEAD")

    if args.spector_json is not None and len(names) != 1:
        p.error("--spector-json requires exactly one skill")

    rows = [_tier(n, spector_json=_spector_path(n, args.spector_json)) for n in names]
    if args.markdown:
        print(_markdown(rows), end="")
    else:
        print(json.dumps(rows if len(rows) != 1 else rows[0], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
