"""Unit checks for agent-plugins-aligned skill layout (no LLM)."""

from __future__ import annotations

import re
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
PLUGIN_SKILLS = ROOT / "plugins/digitalocean-internal/skills"
MCP_URLS = {
    "https://droplets.mcp.digitalocean.com/mcp",
    "https://apps.mcp.digitalocean.com/mcp",
    "https://accounts.mcp.digitalocean.com/mcp",
    "https://databases.mcp.digitalocean.com/mcp",
    "https://networking.mcp.digitalocean.com/mcp",
    "https://insights.mcp.digitalocean.com/mcp",
    "https://docs.mcp.digitalocean.com/mcp",
}


def _skill_names() -> list[str]:
    return sorted(d.name for d in SKILLS.iterdir() if d.is_dir() and (d / "SKILL.md").is_file())


@pytest.mark.parametrize("name", _skill_names())
def test_skill_frontmatter_matches_directory(name: str) -> None:
    skill_md = SKILLS / name / "SKILL.md"
    text = skill_md.read_text(encoding="utf-8")
    assert text.startswith("---\n")
    end = text.index("\n---\n", 4)
    front = yaml.safe_load(text[4:end])
    assert front["name"] == name
    desc = front.get("description", "")
    assert isinstance(desc, str) and len(desc.strip()) >= 20
    assert (
        re.search(r"\bUse when\b", desc, re.I)
        or re.search(r"\bUse for\b", desc, re.I)
        or name == "digitalocean-safety"
    )


@pytest.mark.parametrize("name", _skill_names())
def test_metadata_present(name: str) -> None:
    meta_path = SKILLS / name / "METADATA.yml"
    assert meta_path.is_file(), f"missing METADATA.yml for {name}"
    meta = yaml.safe_load(meta_path.read_text(encoding="utf-8"))
    assert meta.get("maintainer")
    assert meta.get("tier") in (1, 2, 3)
    assert "declared_endpoints" in meta
    for ep in meta["declared_endpoints"]:
        assert ep in MCP_URLS or ep == "", f"unexpected endpoint {ep} in {name}"


@pytest.mark.parametrize("name", _skill_names())
def test_plugin_skill_symlink(name: str) -> None:
    link = PLUGIN_SKILLS / name
    assert link.is_symlink(), f"expected symlink at {link}"
    target = (link.parent / link.readlink()).resolve()
    assert target == (SKILLS / name).resolve()


def test_mcp_json_unchanged_endpoints() -> None:
    import json

    mcp = json.loads((ROOT / "plugins/digitalocean-internal/mcp.json").read_text())
    urls = {s["url"] for s in mcp["mcpServers"].values()}
    assert urls == MCP_URLS


def test_docs_policy_is_read_only_tier1() -> None:
    import json

    policy_path = ROOT / "plugins/digitalocean-internal/policy/approval-tiers-docs.json"
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    assert policy["mcpServer"] == "digitalocean-docs"
    assert policy["tools"], "docs policy must list every docs tool"
    for row in policy["tools"]:
        assert row["upstreamReadOnly"] is True
        assert row["proposedTier"] == 1
        assert row["upstreamDestructive"] is False


def test_insights_policy_covers_monitoring_writes() -> None:
    import json

    policy_path = ROOT / "plugins/digitalocean-internal/policy/approval-tiers-insights.json"
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    names = {row["tool"] for row in policy["tools"]}
    assert "uptimecheck-create" in names
    assert "alert-policy-create" in names
    assert "uptimecheck-delete" in names
