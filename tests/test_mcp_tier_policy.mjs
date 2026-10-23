import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import {
  evaluateMcpToolCall,
  loadPolicyIndex,
  normalizeHookInput,
  parseRouterInvocation,
  resolvePluginRoot,
} from "../plugins/digitalocean/lib/mcp-tier-policy.mjs";

const PLUGIN_ROOT = resolvePluginRoot(
  join(import.meta.dirname, "../plugins/digitalocean")
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

test("insights uptimecheck-create is tier 2 ask", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean-insights",
    toolName: "uptimecheck-create",
    toolInput: { name: "prod-check" },
  });
  assert.equal(d.permission, "ask");
  assert.match(d.user_message, /Tier 2/i);
});

test("unmapped write on insights is denied", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean-insights",
    toolName: "insights-future-write",
    toolInput: {},
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

test("docs-search allowed via read-only tier map", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean-docs",
    toolName: "docs-search",
    toolInput: { query: "firewall" },
  });
  assert.equal(d.permission, "allow");
});

test("unmapped docs tool is denied", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean-docs",
    toolName: "docs-destroy-all",
    toolInput: {},
  });
  assert.equal(d.permission, "deny");
});

test("unmapped docs-submit-feedback is denied despite docs- prefix", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean-docs",
    toolName: "docs-submit-feedback",
    toolInput: { message: "hi" },
  });
  assert.equal(d.permission, "deny");
});

test("unmapped foo-get-and-reset is denied despite -get in name", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean-droplets",
    toolName: "foo-get-and-reset",
    toolInput: {},
  });
  assert.equal(d.permission, "deny");
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

// --- DigitalOcean MCP (single server) ----------------------------------------

test("DigitalOcean MCP discovery tools pass through", () => {
  for (const toolName of ["find_tools", "retrieve_schema"]) {
    const d = evaluateMcpToolCall({
      pluginRoot: PLUGIN_ROOT,
      mcpServerName: "digitalocean",
      toolName,
      toolInput: { query: "delete a droplet" },
    });
    assert.equal(d.permission, "allow", toolName);
  }
});

test("invoke_tool unwraps tier 3 droplet-delete", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean",
    toolName: "invoke_tool",
    toolInput: JSON.stringify({
      tool: "droplets/droplet-delete",
      arguments: { id: 12345, name: "web-prod-01" },
    }),
  });
  assert.equal(d.permission, "ask");
  assert.match(d.user_message, /12345/);
  assert.match(d.user_message, /Tier 3/i);
});

test("invoke_tool unwraps tier 1 read as allow", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean",
    toolName: "invoke_tool",
    toolInput: { tool: "droplets/droplet-list", arguments: {} },
  });
  assert.equal(d.permission, "allow");
});

test("invoke_tool denies unmapped write target", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean",
    toolName: "invoke_tool",
    toolInput: { tool: "insights/insights-future-write", arguments: {} },
  });
  assert.equal(d.permission, "deny");
});

test("invoke_tool resolves service from tool name when segment omitted", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean",
    toolName: "invoke_tool",
    toolInput: { name: "firewall-delete", arguments: { id: "fw-abc" } },
  });
  assert.equal(d.permission, "ask");
  assert.match(d.user_message, /Tier 3/i);
});

test("invoke_tool with unparseable target fails to tier 3 ask", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "digitalocean",
    toolName: "invoke_tool",
    toolInput: { arguments: { id: 1 } },
  });
  assert.equal(d.permission, "ask");
});

test("plugin-scoped DigitalOcean MCP server name is recognized", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "plugin-digitalocean-digitalocean",
    toolName: "invoke_tool",
    toolInput: { tool: "droplets/droplet-create", arguments: { region: "nyc3" } },
  });
  assert.equal(d.permission, "ask");
  assert.match(d.user_message, /Tier 4/i);
});

test("parseRouterInvocation splits qualified name and arguments", () => {
  const parsed = parseRouterInvocation({
    tool: "databases/db-cluster-create",
    arguments: { name: "pg-prod" },
  });
  assert.deepEqual(parsed, {
    serviceKey: "databases",
    toolName: "db-cluster-create",
    toolInput: { name: "pg-prod" },
    qualified: "databases/db-cluster-create",
  });
});

test("non-digitalocean server is allowed", () => {
  const d = evaluateMcpToolCall({
    pluginRoot: PLUGIN_ROOT,
    mcpServerName: "some-other-server",
    toolName: "do-anything",
    toolInput: {},
  });
  assert.equal(d.permission, "allow");
});

test("normalize Cursor beforeMCPExecution payload", () => {
  const n = normalizeHookInput({
    mcp_server_name: "digitalocean",
    tool_name: "invoke_tool",
    tool_input: "{}",
  });
  assert.equal(n.mcpServerName, "digitalocean");
  assert.equal(n.toolName, "invoke_tool");
});

test("policy index loads all endpoint maps", () => {
  const idx = loadPolicyIndex(PLUGIN_ROOT);
  assert.ok(idx.byServer.has("digitalocean-accounts"));
  assert.ok(idx.byServer.has("digitalocean-networking"));
  assert.ok(idx.byServer.has("digitalocean-databases"));
  assert.ok(idx.byServer.has("digitalocean-apps"));
  assert.ok(idx.byServer.has("digitalocean-droplets"));
  assert.ok(idx.byServer.has("digitalocean-insights"));
  assert.ok(idx.byServer.has("digitalocean-docs"));
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
