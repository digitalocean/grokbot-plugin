#!/usr/bin/env node
/**
 * Copy canonical skills/ trees into the shippable plugin (no .. symlinks).
 *
 * Usage: node scripts/sync-plugin-skills.mjs [--check]
 *   --check  Exit 1 if plugin skills differ from skills/ (for CI).
 */

import { cpSync, existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CANONICAL = join(ROOT, "skills");
const PLUGIN_SKILLS = join(ROOT, "plugins/digitalocean/skills");

function shaDir(relPath) {
  const full = join(relPath);
  if (!existsSync(full)) return null;
  const hash = createHash("sha256");
  const walk = (dir, prefix = "") => {
    for (const name of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    )) {
      const p = join(dir, name.name);
      const rel = prefix ? `${prefix}/${name.name}` : name.name;
      if (name.isDirectory()) {
        walk(p, rel);
      } else if (name.isFile()) {
        hash.update(rel);
        hash.update(readFileSync(p));
      }
    }
  };
  walk(full);
  return hash.digest("hex");
}

function syncOne(skillName) {
  const src = join(CANONICAL, skillName);
  const dest = join(PLUGIN_SKILLS, skillName);
  if (!existsSync(join(src, "SKILL.md"))) {
    throw new Error(`Missing canonical skill: ${src}`);
  }
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const skillNames = readdirSync(CANONICAL, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(CANONICAL, d.name, "SKILL.md")))
    .map((d) => d.name)
    .sort();

  if (checkOnly) {
    const mismatches = [];
    for (const name of skillNames) {
      const a = shaDir(join(CANONICAL, name));
      const b = shaDir(join(PLUGIN_SKILLS, name));
      if (a !== b) mismatches.push(name);
    }
    const extra = readdirSync(PLUGIN_SKILLS, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((n) => !skillNames.includes(n));
    if (mismatches.length || extra.length) {
      console.error(
        JSON.stringify({ mismatches, extraInPlugin: extra }, null, 2)
      );
      process.exit(1);
    }
    console.log(`OK: ${skillNames.length} plugin skills match canonical skills/`);
    return;
  }

  rmSync(PLUGIN_SKILLS, { recursive: true, force: true });
  for (const name of skillNames) {
    syncOne(name);
  }
  console.log(`Synced ${skillNames.length} skills to ${PLUGIN_SKILLS}`);
}

main();
