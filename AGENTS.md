# Project Decisions

- Community moderation UI uses one normalized role/member model before rendering because the Find-am API returns several nested response shapes.
- Shared moderation panels receive an explicit viewer level; backend authorization remains the final permission boundary.
- Role revocation sends identifiers in both the DELETE query and JSON body for compatibility with the external community service.