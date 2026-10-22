---
name: digitalocean-connect
description: >-
  Connect DigitalOcean MCP endpoints, choose OAuth or a scoped token, and fix
  401, 403, and 429 errors. Use for "connect DigitalOcean", "DO auth error",
  "token", or "permission denied".
---
# Connect DigitalOcean MCP endpoints

This plugin uses **per-service** hosted MCP endpoints (not the router at
`mcp.digitalocean.com`), so each connector exposes named tools for approvals.

## Default auth (v1)

- **OAuth** on first use — one grant **per connector** (grants are not shared).
- **No shared scoped token by default.** Optional later: a single PAT as
  `Authorization: Bearer` for every endpoint (document tradeoffs if the user asks).

## Which connectors to connect when

| Connector               | URL                                           | When to connect        |
| ----------------------- | --------------------------------------------- | ---------------------- |
| digitalocean-droplets   | `https://droplets.mcp.digitalocean.com/mcp`   | At install             |
| digitalocean-apps       | `https://apps.mcp.digitalocean.com/mcp`       | At install             |
| digitalocean-accounts   | `https://accounts.mcp.digitalocean.com/mcp`   | At install             |
| digitalocean-databases  | `https://databases.mcp.digitalocean.com/mcp`  | First database task    |
| digitalocean-networking | `https://networking.mcp.digitalocean.com/mcp` | First DNS/network task |
| digitalocean-insights   | `https://insights.mcp.digitalocean.com/mcp`   | First monitoring task  |
| digitalocean-docs       | `https://docs.mcp.digitalocean.com/mcp`       | No sign-in             |

In Cursor: **Customize → MCP** — enable each server and complete OAuth when prompted.

## Lazy-connect workflow

1. Tell the user which connector the task needs and why.
1. Ask them to enable/sign in to that MCP server in Customize.
1. Retry the read-only smoke call (`droplet-list`, `apps-list`, etc.) before writes.

## Errors

| Symptom | Likely cause                  | What to do                                                           |
| ------- | ----------------------------- | -------------------------------------------------------------------- |
| 401     | Missing or expired OAuth      | Re-authenticate that connector only                                  |
| 403     | Insufficient scopes           | Recommend scope bundles for the skill; offer PAT with correct scopes |
| 429     | Rate limit (5000/hr, 250/min) | Back off; honor `Retry-After`; reduce polling                        |

**App Platform + private GitHub** is separate from MCP OAuth. A signed-in
**digitalocean-apps** connector does not install the DigitalOcean GitHub app or grant
repo access. If `apps-create-app-from-spec` / `apps-update` return
`GitHub user not authenticated`, use **digitalocean-app-platform** (user steps at
[Create an app](https://cloud.digitalocean.com/apps/new)), then retry the deploy call.

Public OAuth clients use **1-hour** access tokens and **single-use** refresh tokens.
Persist the latest refresh token if configuring a custom client (not default here).

## Scoped token (optional, not default)

If the user supplies a PAT:

- Recommend **Read Only** (`api:read`) for inventory and troubleshooting.
- Require explicit opt-in before **write** scopes.
- Never echo the token in chat.

See `skills/digitalocean-connect/references/scope-bundles.md` for suggested scope sets per skill.
