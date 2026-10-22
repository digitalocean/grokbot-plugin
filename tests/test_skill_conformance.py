"""Unit checks for agent-plugins-aligned skill layout (no LLM)."""

from __future__ import annotations

import re
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
PLUGIN_DIR = ROOT / "plugins/digitalocean"
PLUGIN_SKILLS = PLUGIN_DIR / "skills"
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
def test_plugin_skill_is_copy_not_symlink(name: str) -> None:
    dest = PLUGIN_SKILLS / name
    assert dest.is_dir(), f"missing plugin skill dir {dest}"
    assert not dest.is_symlink(), f"plugin skill must be a copy, not symlink: {dest}"
    canonical = (SKILLS / name / "SKILL.md").read_text(encoding="utf-8")
    bundled = (dest / "SKILL.md").read_text(encoding="utf-8")
    assert canonical == bundled


def test_mcp_json_unchanged_endpoints() -> None:
    import json

    mcp = json.loads((PLUGIN_DIR / "mcp.json").read_text())
    urls = {s["url"] for s in mcp["mcpServers"].values()}
    assert urls == MCP_URLS


def test_docs_policy_is_read_only_tier1() -> None:
    import json

    policy_path = PLUGIN_DIR / "policy/approval-tiers-docs.json"
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    assert policy["mcpServer"] == "digitalocean-docs"
    assert policy["tools"], "docs policy must list every docs tool"
    for row in policy["tools"]:
        assert row["upstreamReadOnly"] is True
        assert row["proposedTier"] == 1
        assert row["upstreamDestructive"] is False


def test_insights_policy_covers_monitoring_writes() -> None:
    import json

    policy_path = PLUGIN_DIR / "policy/approval-tiers-insights.json"
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    names = {row["tool"] for row in policy["tools"]}
    assert "uptimecheck-create" in names
    assert "alert-policy-create" in names
    assert "uptimecheck-delete" in names


def test_cursor_plugin_manifest_public_id() -> None:
    import json

    manifest = json.loads((PLUGIN_DIR / ".cursor-plugin/plugin.json").read_text(encoding="utf-8"))
    assert manifest["name"] == "digitalocean"
    assert manifest["displayName"] == "DigitalOcean"
    assert manifest["logo"] == "assets/logo.png"
    assert ".." not in manifest["logo"]


def test_marketplace_manifest_unique_names() -> None:
    import json

    market = json.loads((ROOT / ".cursor-plugin/marketplace.json").read_text())
    names = [p["name"] for p in market["plugins"]]
    assert len(names) == len(set(names))
    assert market["name"] == "digitalocean"
    assert names == ["digitalocean"]
    for entry in market["plugins"]:
        for key, value in entry.items():
            if isinstance(value, str) and ".." in value:
                pytest.fail(f"parent path in marketplace entry {key}: {value}")
