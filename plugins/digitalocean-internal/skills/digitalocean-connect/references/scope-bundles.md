# Suggested OAuth / PAT scope bundles

Use when the user opts into a scoped token or custom OAuth scopes. Scopes cannot
be edited after token creation.

## Read-only inventory and troubleshooting

- `api:read` (Read Only preset), or granular read scopes for droplet, app,
  database, domain, billing as needed.

## Droplet operations

- `droplet:read`, `droplet:create`, `droplet:update`, `droplet:delete` as required
  by the task.

## App Platform

- App read/write scopes per DigitalOcean scope reference for apps and deployments.

## Billing / costs skill

- `billing:read` plus read access to sizes (`droplet:read` for `size-list`).

Always confirm the token's **team** matches the resources being changed.
