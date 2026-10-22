#!/usr/bin/env node
/**
 * Diff plugin approval tiers against upstream mcp-digitalocean annotation tables.
 *
 * Usage:
 *   node scripts/sync-tier-map.mjs [--policy policy/approval-tiers-droplets.json]
 *       [--upstream-url URL] [--fail-on-diff]
 *
 * Default upstream URL is the Droplets annotations test on main.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_POLICY = resolve(__dirname, "../policy/approval-tiers-droplets.json");
const DEFAULT_UPSTREAM =
  "https://raw.githubusercontent.com/digitalocean-labs/mcp-digitalocean/main/pkg/registry/droplet/droplet_annotations_test.go";
const REGION_UPSTREAM =
  "https://raw.githubusercontent.com/digitalocean-labs/mcp-digitalocean/main/pkg/registry/common/region_tools.go";

function parseArgs(argv) {
  const opts = {
    policy: DEFAULT_POLICY,
    upstreamUrl: DEFAULT_UPSTREAM,
    failOnDiff: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--fail-on-diff") opts.failOnDiff = true;
    else if (arg === "--policy") opts.policy = resolve(argv[++i]);
    else if (arg === "--upstream-url") opts.upstreamUrl = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

/** Parse Go expectedAnnotations map rows from droplet_annotations_test.go */
function parseExpectedAnnotations(goSource) {
  const tools = {};
  const rowRe =
    /"([a-z0-9-]+)":\s*\{\s*(true|false),\s*(true|false),\s*(?:true|false),\s*(?:true|false),\s*common\.Op\w+,\s*common\.Risk(\w+)/g;
  let m;
  while ((m = rowRe.exec(goSource))) {
    const name = m[1];
    tools[name] = {
      readOnly: m[2] === "true",
      destructive: m[3] === "true",
      risk: m[4].toLowerCase(),
    };
  }
  if (Object.keys(tools).length === 0) {
    throw new Error("No tools parsed from upstream expectedAnnotations");
  }
  return tools;
}

function regionListInUpstream(regionSource) {
  return /region-list/.test(regionSource) || /"region-list"/.test(regionSource);
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function loadPolicy(path) {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const byTool = new Map();
  for (const row of raw.tools) {
    byTool.set(row.tool, row);
  }
  return { meta: raw, byTool };
}

function compare(policy, upstreamTools, hasRegionList) {
  const issues = [];
  const policyNames = new Set(policy.byTool.keys());
  const upstreamNames = new Set(Object.keys(upstreamTools));

  for (const name of upstreamNames) {
    if (!policyNames.has(name)) {
      issues.push({ kind: "missing-in-policy", tool: name });
    }
  }
  for (const name of policyNames) {
    if (name === "region-list") {
      if (!hasRegionList) {
        issues.push({
          kind: "region-list-missing-upstream",
          tool: name,
          detail: "region-list not found in region_tools.go (check upstream)",
        });
      }
      continue;
    }
    if (!upstreamNames.has(name)) {
      issues.push({ kind: "removed-from-upstream", tool: name });
    }
  }

  for (const [name, up] of Object.entries(upstreamTools)) {
    const row = policy.byTool.get(name);
    if (!row) continue;
    if (row.upstreamReadOnly !== up.readOnly) {
      issues.push({
        kind: "readOnly-mismatch",
        tool: name,
        policy: row.upstreamReadOnly,
        upstream: up.readOnly,
      });
    }
    if (row.upstreamDestructive !== up.destructive) {
      issues.push({
        kind: "destructive-mismatch",
        tool: name,
        policy: row.upstreamDestructive,
        upstream: up.destructive,
      });
    }
    if (row.upstreamRisk !== up.risk) {
      issues.push({
        kind: "risk-mismatch",
        tool: name,
        policy: row.upstreamRisk,
        upstream: up.risk,
      });
    }
  }

  const regionRow = policy.byTool.get("region-list");
  if (regionRow) {
    if (regionRow.upstreamReadOnly !== true || regionRow.upstreamRisk !== "low") {
      issues.push({
        kind: "region-list-policy-hint",
        tool: "region-list",
        detail: "Expected read-only low risk in policy metadata",
      });
    }
  }

  return issues;
}

async function main() {
  const opts = parseArgs(process.argv);
  const policy = loadPolicy(opts.policy);
  const [goSource, regionSource] = await Promise.all([
    fetchText(opts.upstreamUrl),
    fetchText(REGION_UPSTREAM),
  ]);
  const upstreamTools = parseExpectedAnnotations(goSource);
  const hasRegionList = regionListInUpstream(regionSource);
  const issues = compare(policy, upstreamTools, hasRegionList);

  const summary = {
    policyFile: opts.policy,
    upstreamUrl: opts.upstreamUrl,
    upstreamToolCount: Object.keys(upstreamTools).length,
    policyToolCount: policy.byTool.size,
    issueCount: issues.length,
    issues,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (opts.failOnDiff && issues.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
