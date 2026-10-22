#!/usr/bin/env node
/**
 * Generate approval-tiers-*.json for accounts, networking, databases, apps,
 * insights, and docs from upstream.
 * Droplets is hand-maintained; this script does not overwrite it.
 * Accounts `key-create` Tier 3 override is re-applied after generation.
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultProposedTier,
  tierActionFor,
} from "../plugins/digitalocean-internal/lib/tier-map-defaults.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POLICY_DIR = resolve(__dirname, "../plugins/digitalocean-internal/policy");
const UPSTREAM_COMMIT = "8ce21db";
const BASE =
  `https://raw.githubusercontent.com/digitalocean-labs/mcp-digitalocean/${UPSTREAM_COMMIT}`;

const ENDPOINTS = [
  {
    file: "approval-tiers-accounts.json",
    endpoint: "accounts",
    mcpServer: "digitalocean-accounts",
    annotationSource: "pkg/registry/account/account_annotations_test.go",
  },
  {
    file: "approval-tiers-networking.json",
    endpoint: "networking",
    mcpServer: "digitalocean-networking",
    annotationSource: "pkg/registry/networking/networking_annotations_test.go",
  },
  {
    file: "approval-tiers-databases.json",
    endpoint: "databases",
    mcpServer: "digitalocean-databases",
    annotationSource: "pkg/registry/dbaas/dbaas_annotations_test.go",
  },
  {
    file: "approval-tiers-apps.json",
    endpoint: "apps",
    mcpServer: "digitalocean-apps",
    annotationSource: "pkg/registry/apps/apps_annotations_test.go",
  },
  {
    file: "approval-tiers-insights.json",
    endpoint: "insights",
    mcpServer: "digitalocean-insights",
    annotationSource: "pkg/registry/insights/insights_annotations_test.go",
  },
  {
    file: "approval-tiers-docs.json",
    endpoint: "docs",
    mcpServer: "digitalocean-docs",
    annotationSource: "pkg/registry/docs/docs_annotations_test.go",
  },
];

function parseExpectedAnnotations(goSource) {
  const tools = {};
  const rowRe =
    /"([a-z0-9-]+)":\s*\{\s*(true|false),\s*(true|false),\s*(?:true|false),\s*(?:true|false),\s*common\.Op(\w+),\s*common\.Risk(\w+)/g;
  let m;
  while ((m = rowRe.exec(goSource))) {
    tools[m[1]] = {
      readOnly: m[2] === "true",
      destructive: m[3] === "true",
      operation: m[4].toLowerCase(),
      risk: m[5].toLowerCase(),
    };
  }
  if (Object.keys(tools).length === 0) {
    throw new Error("No tools parsed from upstream expectedAnnotations");
  }
  return tools;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function buildPolicy(def, upstreamTools) {
  const tools = Object.entries(upstreamTools)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, meta]) => {
      const proposedTier = defaultProposedTier(name, meta);
      return {
        tool: name,
        endpoint: def.mcpServer,
        upstreamReadOnly: meta.readOnly,
        upstreamDestructive: meta.destructive,
        upstreamRisk: meta.risk,
        proposedTier,
        tierAction: tierActionFor(proposedTier),
        notes: "",
      };
    });

  return {
    version: "1.0.0",
    upstreamRepository: "digitalocean-labs/mcp-digitalocean",
    upstreamCommit: UPSTREAM_COMMIT,
    upstreamAnnotationSource: def.annotationSource,
    endpoint: def.endpoint,
    mcpServer: def.mcpServer,
    tools,
  };
}

async function main() {
  for (const def of ENDPOINTS) {
    const url = `${BASE}/${def.annotationSource}`;
    const goSource = await fetchText(url);
    const upstreamTools = parseExpectedAnnotations(goSource);
    const policy = buildPolicy(def, upstreamTools);
    const outPath = resolve(POLICY_DIR, def.file);
    if (def.file === "approval-tiers-accounts.json") {
      const keyCreate = policy.tools.find((t) => t.tool === "key-create");
      if (keyCreate) {
        keyCreate.proposedTier = 3;
        keyCreate.tierAction = "Named high-risk";
        keyCreate.notes =
          "Stricter than upstream: new SSH key grants access to account Droplets";
      }
    }
    writeFileSync(outPath, `${JSON.stringify(policy, null, 2)}\n`);
    console.log(`Wrote ${outPath} (${policy.tools.length} tools)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
