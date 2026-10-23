import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const DOCS_SERVER = "digitalocean-docs";
const SERVER_PREFIX = "digitalocean-";

/**
 * Single hosted DigitalOcean MCP server key (see plugins/digitalocean/mcp.json
 * and https://docs.digitalocean.com/reference/mcp/configure-mcp/). It fronts
 * every first-party DigitalOcean service and exposes three meta-tools:
 *   - find_tools / retrieve_schema: read-only discovery, always allowed.
 *   - invoke_tool: runs a service tool by its qualified `service/tool` name;
 *     the real target is unwrapped here so per-tool approval tiers still apply.
 */
const DO_MCP_SERVER = "digitalocean";
const DISCOVERY_TOOLS = new Set(["find_tools", "retrieve_schema"]);
const INVOKE_TOOL = "invoke_tool";

/** Only unmapped tool allowed without a policy row (shared region helper in upstream). */
function isRegionListWithoutMap(toolName) {
  return toolName === "region-list";
}

/**
 * The hook fires for every MCP server, so recognize the DigitalOcean MCP server
 * by its mcp.json key. Cursor may surface it bare (`digitalocean`) or
 * plugin-scoped (`plugin-digitalocean-digitalocean`); accept both.
 */
function isRouterServer(mcpServerName) {
  return (
    mcpServerName === DO_MCP_SERVER ||
    mcpServerName === `plugin-${DO_MCP_SERVER}-${DO_MCP_SERVER}` ||
    mcpServerName.endsWith(`-${DO_MCP_SERVER}`)
  );
}

function allowDecision() {
  return { permission: "allow", user_message: "", agent_message: "" };
}

function denyUnmapped(mcpServerName, toolName) {
  if (mcpServerName === DOCS_SERVER) {
    return {
      permission: "deny",
      user_message: `Blocked: ${toolName} is not in the read-only docs tier map.`,
      agent_message: `Refusing ${mcpServerName}/${toolName}: docs connector tools must be listed in approval-tiers-docs.json.`,
    };
  }
  return {
    permission: "deny",
    user_message: `Blocked: ${toolName} is not in the DigitalOcean tier policy map.`,
    agent_message: `Refusing ${mcpServerName}/${toolName}: unmapped tools are denied by plugin hook policy.`,
  };
}

function policyLoadFailDecision(toolName) {
  return {
    permission: "ask",
    tier: 3,
    user_message: "DigitalOcean policy files could not be loaded; treating this MCP call as Tier 3.",
    agent_message:
      `Policy load failed. Do not run ${toolName} until tiers are confirmed with the user.`,
  };
}

/** @typedef {{ permission: 'allow'|'ask'|'deny', user_message: string, agent_message: string, tier?: number }} PolicyDecision */

/**
 * @param {string} [envRoot]
 * @param {string} [libDir]
 */
export function resolvePluginRoot(envRoot, libDir = import.meta.dirname) {
  return envRoot || process.env.CURSOR_PLUGIN_ROOT || join(libDir, "..");
}

/**
 * @param {string} pluginRoot
 * @param {{ readFile?: typeof readFileSync }} deps
 */
export function loadPolicyIndex(pluginRoot, deps = {}) {
  const readFile = deps.readFile ?? readFileSync;
  const policyDir = join(pluginRoot, "policy");
  const byServer = new Map();
  const byTool = new Map();

  if (!existsSync(policyDir)) {
    return { byServer, byTool, loadError: `policy directory missing: ${policyDir}` };
  }

  let loadError = null;
  for (const name of readdirSync(policyDir)) {
    if (!name.startsWith("approval-tiers-") || !name.endsWith(".json")) {
      continue;
    }
    const path = join(policyDir, name);
    try {
      const raw = JSON.parse(readFile(path, "utf8"));
      const server = raw.mcpServer;
      if (!server) continue;
      const toolMap = new Map();
      for (const row of raw.tools ?? []) {
        toolMap.set(row.tool, row);
        byTool.set(`${server}::${row.tool}`, row);
      }
      byServer.set(server, toolMap);
    } catch (err) {
      loadError = `failed to read ${path}: ${err.message}`;
    }
  }

  return { byServer, byTool, loadError };
}

/**
 * Unwrap a DigitalOcean MCP `invoke_tool` call to the concrete service tool it
 * runs. The qualified name uses `service/tool` form (for example
 * `droplets/droplet-delete`); argument/field names are matched defensively
 * because the invoke_tool payload shape is not pinned by a published schema.
 *
 * @param {unknown} toolInput
 * @returns {{ serviceKey: string|null, toolName: string, toolInput: unknown, qualified: string }|null}
 */
export function parseRouterInvocation(toolInput) {
  let obj = toolInput;
  if (typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") {
    return null;
  }
  const qualified =
    obj.tool ??
    obj.name ??
    obj.qualified_name ??
    obj.qualifiedName ??
    obj.toolName ??
    obj.tool_name;
  if (typeof qualified !== "string" || !qualified.trim()) {
    return null;
  }
  const inner = obj.arguments ?? obj.args ?? obj.input ?? obj.parameters ?? {};
  const segments = qualified
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length === 0) {
    return null;
  }
  const toolName = segments[segments.length - 1];
  const serviceKey = segments.length >= 2 ? segments[segments.length - 2] : null;
  return { serviceKey, toolName, toolInput: inner, qualified };
}

function serviceKeyToPolicyServer(serviceKey) {
  if (!serviceKey) return null;
  return serviceKey.startsWith(SERVER_PREFIX) ? serviceKey : `${SERVER_PREFIX}${serviceKey}`;
}

/** Resolve a policy server by a tool name when invoke_tool omits the service segment. */
function resolveServerByToolName(policyIndex, toolName) {
  let found = null;
  for (const key of policyIndex.byTool.keys()) {
    const sep = key.indexOf("::");
    if (sep !== -1 && key.slice(sep + 2) === toolName) {
      const server = key.slice(0, sep);
      if (found && found !== server) return null; // ambiguous across services
      found = server;
    }
  }
  return found;
}

/**
 * @param {unknown} toolInput
 */
export function summarizeTargets(toolInput) {
  let obj = toolInput;
  if (typeof toolInput === "string") {
    try {
      obj = JSON.parse(toolInput);
    } catch {
      return toolInput.slice(0, 200);
    }
  }
  if (!obj || typeof obj !== "object") {
    return "see tool_input";
  }
  const keys = [
    "id",
    "ids",
    "droplet_id",
    "droplet_ids",
    "cluster_id",
    "firewall_id",
    "app_id",
    "domain",
    "name",
    "names",
    "tag",
    "tags",
    "record_id",
    "vpc_uuid",
  ];
  const parts = [];
  for (const key of keys) {
    if (obj[key] !== undefined) {
      parts.push(`${key}=${JSON.stringify(obj[key])}`);
    }
  }
  return parts.length ? parts.join(", ") : "see tool_input";
}

/**
 * @param {{ mcpServerName?: string, toolName: string, toolInput?: unknown, pluginRoot?: string, policyIndex?: ReturnType<typeof loadPolicyIndex> }} input
 * @returns {PolicyDecision}
 */
export function evaluateMcpToolCall(input) {
  let { mcpServerName, toolName, toolInput } = input;
  const pluginRoot = input.pluginRoot ?? resolvePluginRoot();
  const policyIndex = input.policyIndex ?? loadPolicyIndex(pluginRoot);

  // Unknown/other servers are not governed by this plugin.
  if (!mcpServerName) {
    return allowDecision();
  }

  // Single hosted DigitalOcean MCP server: pass discovery through and unwrap
  // invoke_tool to the concrete service tool so the tier maps below still apply.
  if (isRouterServer(mcpServerName)) {
    if (DISCOVERY_TOOLS.has(toolName)) {
      return allowDecision();
    }
    if (toolName !== INVOKE_TOOL) {
      return allowDecision();
    }
    const invocation = parseRouterInvocation(toolInput);
    if (!invocation) {
      return policyLoadFailDecision(INVOKE_TOOL);
    }
    const mapped =
      serviceKeyToPolicyServer(invocation.serviceKey) ??
      resolveServerByToolName(policyIndex, invocation.toolName);
    if (!mapped) {
      if (isRegionListWithoutMap(invocation.toolName)) {
        return allowDecision();
      }
      if (policyIndex.loadError) {
        return policyLoadFailDecision(invocation.toolName);
      }
      return denyUnmapped(DO_MCP_SERVER, invocation.toolName);
    }
    mcpServerName = mapped;
    toolName = invocation.toolName;
    toolInput = invocation.toolInput;
  }

  if (!mcpServerName.startsWith(SERVER_PREFIX)) {
    return allowDecision();
  }

  if (policyIndex.loadError) {
    if (isRegionListWithoutMap(toolName)) {
      return allowDecision();
    }
    return policyLoadFailDecision(toolName);
  }

  const row = policyIndex.byTool.get(`${mcpServerName}::${toolName}`);

  if (!row) {
    if (isRegionListWithoutMap(toolName)) {
      return allowDecision();
    }
    return denyUnmapped(mcpServerName, toolName);
  }

  const tier = row.proposedTier ?? 1;
  const targets = summarizeTargets(toolInput);

  if (tier === 1) {
    return { permission: "allow", user_message: "", agent_message: "", tier };
  }

  const tierLabel = tier === 4 ? "Tier 4 (price first)" : `Tier ${tier}`;
  const msg =
    `DigitalOcean ${tierLabel}: ${mcpServerName}/${toolName} targets ${targets}. ` +
    `Confirm in chat before this MCP call proceeds.`;

  return {
    permission: "ask",
    tier,
    user_message: msg,
    agent_message: msg,
  };
}

/**
 * Normalize a Cursor beforeMCPExecution payload
 * (`mcp_server_name`, `tool_name`, `tool_input`).
 * @param {Record<string, unknown>} body
 */
export function normalizeHookInput(body) {
  const mcpServerName = body.mcp_server_name ?? body.mcpServerName;
  const toolName = String(body.tool_name ?? body.toolName ?? "");
  return {
    mcpServerName: mcpServerName ? String(mcpServerName) : undefined,
    toolName,
    toolInput: body.tool_input ?? body.toolInput,
  };
}

/**
 * Shape a decision as a Cursor beforeMCPExecution response.
 * @param {PolicyDecision} decision
 */
export function formatHookResponse(decision) {
  return {
    continue: true,
    permission: decision.permission,
    user_message: decision.user_message,
    agent_message: decision.agent_message,
  };
}
