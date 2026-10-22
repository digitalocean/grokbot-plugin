---
name: digitalocean-inventory
description: >-
  Inventory what runs where and what it costs on DigitalOcean, and suggest
  cleanups for approval. Use for "what do I have on DO", "list my resources",
  "unused droplets", or cleanup recommendations.
---

# Inventory and cleanup recommendations

Read-only by default. Load **digitalocean-safety**.

## Data sources

- **digitalocean-droplets:** `droplet-list`, images, snapshots
- **digitalocean-apps:** `apps-list`, `apps-get-info`
- **digitalocean-databases:** `db-cluster-list`
- **digitalocean-networking:** domains, firewalls, load balancers, reserved IPs
- **digitalocean-accounts:** balance and billing context via **digitalocean-costs**

Connect lazy connectors when a slice of inventory is missing.

## Cleanup rules

- **Recommend only** — never batch-delete from a report.
- Each deletion requires its own Tier 3 approval in the owning skill.
- Flag unattached volumes, old snapshots, idle Droplets, and unused reserved IPs
  with estimated monthly cost when possible.

## Output

Produce a concise table: resource type, name, ID, region, monthly estimate (if known),
and suggested action (keep / review / candidate for delete).
