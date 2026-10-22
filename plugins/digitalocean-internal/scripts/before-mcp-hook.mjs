#!/usr/bin/env node
/**
 * beforeMCPExecution / PreToolUse hook: enforce DigitalOcean approval tiers.
 * Reads JSON from stdin; writes JSON to stdout. Exit 2 on deny.
 */

import {
  evaluateMcpToolCall,
  formatHookResponse,
  normalizeHookInput,
} from "../lib/mcp-tier-policy.mjs";

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (!text) return {};
  return JSON.parse(text);
}

async function main() {
  const body = await readStdin();
  const normalized = normalizeHookInput(body);
  const decision = evaluateMcpToolCall(normalized);
  const out = formatHookResponse(decision);
  process.stdout.write(`${JSON.stringify(out)}\n`);
  if (decision.permission === "deny") {
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
