import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const DOCS_SERVER = "digitalocean-docs";
const SERVER_PREFIX = "digitalocean-";

function looksLikeReadTool(toolName) {
  if (toolName === "region-list" || toolName.startsWith("docs-")) {
    return true;
  }
  if (toolName.endsWith("-list")) {
    return true;
  }
  if (toolName.includes("-get") || toolName.startsWith("get-")) {
    return true;
  }
  return false;
}

/** @typedef {{ permission: 'allow'|'ask'|'deny', user_message: string, agent_message: string, tier?: number }} PolicyDecision */

/**
 * @param {string} [envRoot]
 * @param {string} [libDir]
 */
export function resolvePluginRoot(envRoot, libDir = import.meta.dirname) {
  return (
    envRoot ||
    process.env.CURSOR_PLUGIN_ROOT ||
    process.env.CLAUDE_PLUGIN_ROOT ||
    join(libDir, "..")
  );
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

export function parseClaudePluginMcpTool(toolName) {
  const scoped = toolName.match(
    /^mcp__plugin_digitalocean-internal_(digitalocean-[a-z]+)__(.+)$/
  );
  if (scoped) {
    return { mcpServerName: scoped[1], toolName: scoped[2] };
  }
  const plain = toolName.match(/^(mcp__)?(digitalocean-[a-z]+)__(.+)$/);
  if (plain) {
    return { mcpServerName: plain[2], toolName: plain[3] };
  }
  return null;
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
  const { mcpServerName, toolName, toolInput } = input;
  const pluginRoot = input.pluginRoot ?? resolvePluginRoot();
  const policyIndex =
    input.policyIndex ?? loadPolicyIndex(pluginRoot);

  if (!mcpServerName || !mcpServerName.startsWith(SERVER_PREFIX)) {
    return {
      permission: "allow",
      user_message: "",
      agent_message: "",
    };
  }

  if (policyIndex.loadError) {
    if (looksLikeReadTool(toolName)) {
      return { permission: "allow", user_message: "", agent_message: "" };
    }
    return {
      permission: "ask",
      tier: 3,
      user_message:
        "DigitalOcean policy files could not be loaded; treating this write as Tier 3.",
      agent_message:
        `Policy load failed (${policyIndex.loadError}). ` +
        `Do not run ${toolName} until tiers are confirmed with the user.`,
    };
  }

  const row = policyIndex.byTool.get(`${mcpServerName}::${toolName}`);

  if (!row) {
    if (mcpServerName === DOCS_SERVER) {
      return {
        permission: "deny",
        user_message: `Blocked: ${toolName} is not in the read-only docs tier map.`,
        agent_message:
          `Refusing ${mcpServerName}/${toolName}: docs connector tools must be listed in approval-tiers-docs.json.`,
      };
    }
    if (looksLikeReadTool(toolName)) {
      return { permission: "allow", user_message: "", agent_message: "" };
    }
    return {
      permission: "deny",
      user_message: `Blocked: ${toolName} is not in the DigitalOcean tier policy map.`,
      agent_message:
        `Refusing ${mcpServerName}/${toolName}: unmapped write tools are denied by plugin hook policy.`,
    };
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
 * Normalize Cursor beforeMCPExecution, preToolUse, or Claude PreToolUse payloads.
 * @param {Record<string, unknown>} body
 */
export function normalizeHookInput(body) {
  if (body.mcp_server_name && body.tool_name) {
    return {
      mcpServerName: String(body.mcp_server_name),
      toolName: String(body.tool_name),
      toolInput: body.tool_input,
    };
  }

  const toolName = String(body.tool_name ?? body.toolName ?? "");
  if (toolName.startsWith("mcp__")) {
    const parsed = parseClaudePluginMcpTool(toolName);
    if (parsed) {
      return {
        mcpServerName: parsed.mcpServerName,
        toolName: parsed.toolName,
        toolInput: body.tool_input ?? body.toolInput,
      };
    }
  }

  return {
    mcpServerName: body.mcp_server_name ? String(body.mcp_server_name) : undefined,
    toolName,
    toolInput: body.tool_input ?? body.toolInput,
  };
}

/**
 * @param {PolicyDecision} decision
 */
export function formatHookResponse(decision) {
  const permission = decision.permission;
  return {
    permission,
    user_message: decision.user_message,
    agent_message: decision.agent_message,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: permission,
      permissionDecisionReason: decision.user_message,
    },
  };
}
