---
name: digitalocean
description: >-
  DigitalOcean product guidance: pick the right service and skill, confirm which
  team is active, and pull current docs before acting. Use when the user says
  "on DigitalOcean", "my DO account", "which DigitalOcean product", or asks
  what to use on DigitalOcean without naming a service.
---
# DigitalOcean root router

Route DigitalOcean work to the right skill and MCP connector. Do not call write
tools from this skill.

## Before any infrastructure change

1. Load the **digitalocean-safety** policy (approval tiers and global rules).
1. State which **DigitalOcean team** the OAuth grant targets. If unclear, use
   `account-get-information` on **digitalocean-accounts** after the user connects
   that connector.
1. Prefer **read-only** calls first to establish current state.

## Choose a skill

| User intent                | Skill                     | MCP connectors                               |
| -------------------------- | ------------------------- | -------------------------------------------- |
| Connect, auth, 401/403/429 | digitalocean-connect      | All (connection only)                        |
| Cost, balance, invoices    | digitalocean-costs        | digitalocean-droplets, digitalocean-accounts |
| Droplets, VMs, snapshots   | digitalocean-droplets     | digitalocean-droplets                        |
| App Platform, deploy, logs | digitalocean-app-platform | digitalocean-apps, digitalocean-docs         |
| Managed databases          | digitalocean-databases    | digitalocean-databases                       |
| DNS, firewalls, LB, VPC    | digitalocean-networking   | digitalocean-networking                      |
| Uptime, alerts, metrics    | digitalocean-monitoring   | digitalocean-insights                        |
| Incidents, outages, errors | digitalocean-troubleshoot | Multiple (read-first)                        |
| Inventory, cleanup ideas   | digitalocean-inventory    | Multiple (read-first)                        |
| Product/docs questions     | digitalocean (this skill) | digitalocean-docs                            |

## Docs

For product selection or unfamiliar APIs, search **digitalocean-docs** with
`docs-search` before proposing changes.

## Connectors at install vs lazy

- **Connect at install:** digitalocean-droplets, digitalocean-apps,
  digitalocean-accounts.
- **Connect on first use:** digitalocean-databases, digitalocean-networking,
  digitalocean-insights.
- **digitalocean-docs** needs no sign-in.

If a connector is disabled or unsigned, hand off to **digitalocean-connect**.
