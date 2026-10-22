# App spec patterns (MCP-only)

Use with `apps-create-app-from-spec` and `apps-update`.

- Start from DigitalOcean docs via `docs-search` ("App Platform spec reference").
- Name `name`, `region`, and `services` or `static_sites` explicitly.
- Set `instance_size_slug` and `instance_count`; confirm pricing before apply.
- For databases, prefer binding via App Platform rather than echoing credentials.
- Keep secrets in App Platform secret references, not in chat.

Validate deployment health with `apps-get-deployment-status` after changes.
