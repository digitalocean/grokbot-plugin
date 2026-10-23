"""Unit checks for the Agent Plugins layout (no LLM).

The repo is a single Agent Plugin at the root: `plugin.json` + `mcp.json` +
`skills/`. See https://agent-plugins.org/ and the Agent Plugins schemas.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
# Single hosted DigitalOcean MCP endpoint (see mcp.json and
# https://docs.digitalocean.com/reference/mcp/configure-mcp/).
DO_MCP_URL = "https://mcp.digitalocean.com/mcp"
MCP_URLS = {DO_MCP_URL}


def _skill_names() -> list[str]:
    return sorted(d.name for d in SKILLS.iterdir() if d.is_dir() and (d / "SKILL.md").is_file())


@pytest.mark.parametrize("name", _skill_names())
def test_skill_frontmatter_matches_directory(name: str) -> None:
    text = (SKILLS / name / "SKILL.md").read_text(encoding="utf-8")
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


def test_agent_plugin_manifest_conformance() -> None:
    # Agent Plugins manifest schema (additionalProperties: false) allows only:
    allowed = {
        "$schema",
        "name",
        "version",
        "description",
        "author",
        "homepage",
        "repository",
        "license",
        "keywords",
        "extensions",
    }
    manifest = json.loads((ROOT / "plugin.json").read_text(encoding="utf-8"))
    assert manifest["$schema"] == "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"
    assert manifest["name"] == "digitalocean"
    unexpected = set(manifest) - allowed
    assert not unexpected, f"disallowed Agent Plugin manifest keys: {sorted(unexpected)}"


def test_mcp_json_single_streamable_http_server() -> None:
    mcp = json.loads((ROOT / "mcp.json").read_text(encoding="utf-8"))
    assert list(mcp["mcpServers"].keys()) == ["digitalocean"]
    server = mcp["mcpServers"]["digitalocean"]
    assert server["type"] == "streamable-http"
    assert server["url"] == DO_MCP_URL
    # streamableHttpServer schema: additionalProperties false, only type/url/headers
    assert set(server) <= {"type", "url", "headers"}
