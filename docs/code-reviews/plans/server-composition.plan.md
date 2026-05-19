# Code Review Plan: Server Composition

## Scope

The thin layer that **wires the runtime together**: creates the Fastify instance, hands it to the bootstrap factory, declares the application's own routes, registers the shutdown handoff plugin, and triggers the port claim. This area owns the _composition_, not the _behaviour_ — the bootstrap module owns the latter.

Lives in the server's top-level files: the entry script and any sibling constants used at the wiring layer.

## Files currently in scope

- `app/server/server.ts` (entry point)
- `app/server/constants/**` (any constant used only at the wiring layer, not shared across modules)

## Required skills

| Skill                     | Why                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `code-review-and-quality` | Multi-axis baseline (correctness, security, performance, readability, edge cases)                                        |
| `fastify-best-practices`  | The entry creates the Fastify instance and registers plugins; Fastify-idiomatic patterns apply                           |
| `node`                    | Top-level await, ESM resolution, Node 24+ idioms (no Vite/RR runtime; vite-node transforms but doesn't change semantics) |

## Review focus

### Correctness

- Plugin registration order is sound — anything that depends on the process-level graceful-shutdown listeners runs after the bootstrap module has installed them
- Top-level await flows are awaited (no dangling promises at module scope)
- Business routes are registered against the same Fastify instance that the bootstrap factory received

### Composition discipline

- The entry contains _wiring only_ — no business logic, no helpers defined inline
- Config-shaped values (port, secrets, env-varying) flow through the options bag passed to the factory
- True-constant values (protocols, methods, path literals, status codes, fixed host literals) are direct-imported at use sites, **not** routed through the options bag

### Security

- Routes that handle secrets or process-level effects (e.g. the shutdown handoff plugin) are registered explicitly and visibly — not implicitly auto-attached
- The entry doesn't widen the bind host beyond what's necessary for the deployment context

### Fastify idioms

- `app.register(plugin, options)` is used for any plugin that needs encapsulation
- Logging is configured at instance creation, not patched onto the instance later
- The listen orchestrator runs **after** plugins are registered so the shutdown route is live before the listener accepts traffic

### Performance

- No synchronous I/O during startup beyond what Fastify and the factory require
- The wiring layer doesn't introduce unnecessary intermediate variables or transformations of the config bag

### Readability

- One responsibility per top-level statement: import, destructure constants, build options, call factory, register routes, claim port
- Variable names lift from the domain (the Fastify instance, the listen orchestrator, the registered route plugin and its options) — not from the factory's current return shape

## When to run this plan

A PR that touches the entry script, modifies plugin registration order, changes how the bootstrap factory is invoked, or adjusts the wiring-level constants.

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings as PR comments via the `gh` CLI (see the code-review project rule for the exact API call).
