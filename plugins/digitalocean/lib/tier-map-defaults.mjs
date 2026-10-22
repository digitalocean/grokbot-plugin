/**
 * Default proposedTier from upstream annotation rows (new endpoint maps).
 * Droplets keeps hand-tuned overrides in approval-tiers-droplets.json.
 */

const TIER_ACTION = {
  1: "Runs freely",
  2: "Confirm",
  3: "Named high-risk",
  4: "Price first",
};

/** Billable or recurring-cost writes (Tier 4). */
const TIER_4_TOOLS = new Set([
  "db-cluster-create",
  "db-cluster-resize",
  "apps-create-app-from-spec",
  "lb-create",
  "reserved-ip-reserve",
  "partner-attachment-create",
  "byoip-prefix-create",
]);

const TIER_4_PREFIXES = ["enable-backups", "snapshot-", "image-create", "image-action"];

export function tierActionFor(tier) {
  return TIER_ACTION[tier] ?? "Confirm";
}

export function defaultProposedTier(toolName, meta) {
  if (meta.readOnly) {
    return 1;
  }
  if (meta.destructive || meta.risk === "high") {
    return 3;
  }
  if (TIER_4_TOOLS.has(toolName)) {
    return 4;
  }
  for (const prefix of TIER_4_PREFIXES) {
    if (toolName.startsWith(prefix)) {
      return 4;
    }
  }
  if (toolName === "droplet-create" || toolName === "resize-droplet") {
    return 4;
  }
  if (meta.risk === "medium" && meta.operation === "create") {
    return 2;
  }
  return 2;
}
