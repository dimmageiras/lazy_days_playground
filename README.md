# Lazy Days Playground

A learning playground for a Fastify server that handles single-instance handoff between successive dev runs — when a second `pnpm dev` starts, it asks the running instance to shut down gracefully over a loopback HTTP route, then takes the port. Falls back to a signal-based force-kill if the cooperative request fails.

## Quick start

1. Install dependencies: `pnpm install`
2. Start the dev server: `pnpm dev`

The server boots on a known port and exposes a minimal HTTP surface (a root route plus the internal shutdown route used for the handoff).

## Commands

| Command          | Description                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `pnpm dev`       | Run the server through `vite-node` in watch mode                                              |
| `pnpm typecheck` | Run `tsc -b` across the project references                                                    |
| `pnpm test`      | Run the vitest suite once                                                                     |
| `pnpm test:cov`  | Run the vitest suite with coverage instrumentation (output under `logs/unit-tests-coverage/`) |
| `pnpm lint`      | Run ESLint with the project rule set                                                          |
| `pnpm lint:fix`  | Run ESLint with `--fix`                                                                       |

## Architecture

The server's runtime concerns are split into a few areas:

- **Composition** — the entry script wires a Fastify instance, configures logging, and hands the app to the bootstrap module.
- **Bootstrap module** — encapsulates the single-instance handoff: close-with-grace signal handlers, the cooperative-shutdown HTTP route, the cooperative-shutdown request client, the port-claim helper (with bounded retry while the previous instance is shutting down), OS-level port-owner discovery + kill, and the orchestrator that sequences them.
- **Shared utilities** — cross-cutting constants (network primitives, timing) and pure helpers reused across modules.

For details on conventions and how changes are reviewed, see [`docs/`](./docs/) (operational reference and review workflow) and [`CLAUDE.md`](./CLAUDE.md) (project rules governing contribution).

## Tech stack

- Node.js (see `engines` in `package.json` for the minimum)
- TypeScript run directly in dev (no separate build step) — see the `dev` script in [`package.json`](./package.json) for the current transformer
- Fastify for HTTP, with `close-with-grace` for shutdown signal handling and `axios` for the cooperative-shutdown client
- pnpm for package management (v11, settings in [`pnpm-workspace.yaml`](./pnpm-workspace.yaml))
- Vitest for tests and ESLint (with SonarJS + Security plugins) for linting — see the Commands table above

## Documentation

- [`docs/`](./docs/) — operational reference (area index)
- [`CLAUDE.md`](./CLAUDE.md) — entry point for the project rules that govern contributions
