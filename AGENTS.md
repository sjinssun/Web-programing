## Development Approach

Use an iterative and incremental development approach.

- Implement the smallest working version first.
- Prefer vertical slices that can be run and tested end-to-end.
- Do not implement speculative features or unnecessary abstractions.
- After each increment, verify that the existing behavior still works.
- Expand functionality only after the current increment is stable.
- Keep each change small enough to review and revert easily.
- Preserve existing interfaces unless a change is necessary.
- When requirements are unclear, choose the simplest implementation that leaves room for extension.
- Avoid large rewrites unless explicitly requested.

### Implementation Order

For new features:

1. Build a minimal prototype.
2. Verify the main user flow.
3. Add tests for the working behavior.
4. Refactor only where needed.
5. Add the next smallest increment.
6. Repeat.

Do not attempt to complete the entire planned system in a single change unless explicitly requested.

### Project Extension Reference

- Create and maintain a single project extension reference file at `docs/PROJECT_EXTENSION.md`.
- After every implementation, update this file with the information needed to extend the project, including relevant endpoints, class names, module or file locations, and key integration points.
- Keep the reference concise, current, and organized so future implementations can quickly identify the existing extension surfaces.
