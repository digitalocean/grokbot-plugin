import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import {
  evaluateMcpToolCall,
  loadPolicyIndex,
  normalizeHookInput,
  parseClaudePluginMcpTool,
  resolvePluginRoot,
} from "../plugins/digitalocean-internal/lib/mcp-tier-policy.mjs";

const PLUGIN_ROOT = resolvePluginRoot(
  join(import.meta.dirname, "../plugins/digitalocean-internal")
);

test("tier 1 read allows droplet-list", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean-droplets",
    toolName: "droplet-list",
    toolInput: {},
  });
  assert.equal(d.permission, "allow");
});

test("tier 3 destructive asks with target ids", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean-droplets",
    toolName: "droplet-delete",
    toolInput: { id: 12345, name: "web-prod-01" },
  });
  assert.equal(d.permission, "ask");
  assert.match(d.user_message, /12345/);
  assert.match(d.user_message, /Tier 3/i);
});

test("tier 4 billable asks", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean-droplets",
    toolName: "droplet-create",
    toolInput: { region: "nyc3", size: "s-1vcpu-1gb" },
  });
  assert.equal(d.permission, "ask");
  assert.match(d.user_message, /Tier 4/i);
});

test("unmapped write on insights is denied", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean-insights",
    toolName: "uptimecheck-create",
    toolInput: { name: "prod-check" },
  });
  assert.equal(d.permission, "deny");
});

test("unmapped read on insights is allowed", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean-insights",
    toolName: "uptimecheck-list",
    toolInput: {},
  });
  assert.equal(d.permission, "allow");
});

test("policy load failure treats write as ask tier 3", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: "/nonexistent/plugin",
    mcpServerName: "digitalocean-droplets",
    toolName: "droplet-delete",
    toolInput: { id: 1 },
  });
  assert.equal(d.permission, "ask");
  assert.match(d.user_message, /policy/i);
});

test("docs connector always allows", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean-docs",
    toolName: "docs-search",
    toolInput: { query: "firewall" },
  });
  assert.equal(d.permission, "allow");
});

test("accounts ssh key create is tier 3 ask", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean-accounts",
    toolName: "key-create",
    toolInput: { name: "laptop" },
  });
  assert.equal(d.permission, "ask");
  assert.match(d.user_message, /Tier 3/i);
});

test("networking firewall delete is tier 3 ask", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean-networking",
    toolName: "firewall-delete",
    toolInput: { id: "fw-abc" },
  });
  assert.equal(d.permission, "ask");
});

test("parse Claude scoped MCP tool names", () => {
  const parsed = parseClaudePluginMcpTool(
    "mcp__plugin_digitalocean-internal_digitalocean-droplets__droplet-delete"
  );
  assert.deepEqual(parsed, {
    mcpServerName: "digitalocean-droplets",
    toolName: "droplet-delete",
  });
});

test("normalize Cursor beforeMCPExecution payload", () => {
  const n = normalizeHookInput({
    mcp_server_name: "digitalocean-droplets",
    tool_name: "droplet-list",
    tool_input: "{}",
  });
  assert.equal(n.mcpServerName, "digitalocean-droplets");
  assert.equal(n.toolName, "droplet-list");
});

test("policy index loads all endpoint maps", () => {
  const idx = loadPolicyIndex(PLUGIN_ROOT);
  assert.ok(idx.byServer.has("digitalocean-accounts"));
  assert.ok(idx.byServer.has("digitalocean-networking"));
  assert.ok(idx.byServer.has("digitalocean-databases"));
  assert.ok(idx.byServer.has("digitalocean-apps"));
  assert.ok(idx.byServer.has("digitalocean-droplets"));
});

test("bulk tag firewall change asks tier 2", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean-networking",
    toolName: "firewall-add-tags",
    toolInput: { tags: ["env:production"] },
  });
  assert.equal(d.permission, "ask");
  assert.match(d.user_message, /env:production/);
});
