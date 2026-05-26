# 0001. Vite multi-target config layout

- **Status:** Proposed
- **Date:** 2026-05-25

## Context

The project ships two runtimes from one repo: a Fastify API server (run through `vite-node` in dev, bundled with Vite SSR in prod) and a planned React Router framework-mode client (browser bundle plus SSR bundle, both produced by Vite via the `reactRouter()` plugin). Both runtimes consume Vite, but their concerns diverge — different plugin sets, different `resolve.conditions`, different externals strategy, different output layouts, and (for the client) RR's plugin internally manages two Vite environments. Folding both into a single config file would collapse two unrelated concern surfaces into a config DSL of `mode`-branched ternaries.

The decision shapes how new contributors find configuration, how dev lifecycles fail-isolate from each other, and how the layout absorbs the upcoming Vite Module Runner shift.

## Decision

The project uses **one shared Vite base plus one thin Vite config per runtime**, composed via `mergeConfig` from `vite`.

- A shared base owns the keys both runtimes pay for (aliases, env defines, env-prefix).
- A server config layers Node-side resolve, SSR settings, and the server output directory on top of the base; it drives `vite-node` in dev and `vite build --ssr` in prod.
- A client config layers `reactRouter()`, React tooling, and any HMR settings on top of the base; it drives `react-router dev` and `react-router build`.

The client config lives at the repo root as `vite.config.ts` because Vite's default config discovery looks there. The `react-router` CLI does accept `--config <path>` and forwards it to Vite as `configFile`, so a non-root location is technically reachable — the root placement is a project preference (match Vite's discovery default, save a CLI flag) rather than a hard CLI constraint. The shared base and the server config live together in a tooling directory and are reached via explicit `--config` flags or direct imports.

## Alternatives considered

### Vite Environments API (single config, named environments)

First-class in Vite 6+, stable in Vite 8. One config defines all environments and a single `vite build` builds them. Rejected on lifecycle-isolation grounds: the client dev loop and the server dev loop watch different file sets, restart on different signals, and have independent failure modes. Folding both under one `environments` map ties their startup, watch, and restart lifecycles together — a server crash should not bring down client HMR, and a client-config edit should not bounce the API process.

### Single `defineConfig(({ mode }) => …)` with mode branching

One file, big ternary on `mode`. Plugin arrays get spliced, externals get conditionally added, the file becomes a config DSL rather than a config. Rejected because it scales by adding cleverness instead of files, and because the two runtimes' divergence is structural, not modal.

### No Vite on the server (plain Node plus `tsc`)

Run the server with Node directly in dev (via native TypeScript stripping) and compile it with `tsc` in prod. Rejected because server code would lose Vite-resolved aliases without a parallel `tsconfig.paths` mirror, dev-time TS loading would be whatever Node's stripper supports (no Vite plugins, no env defines applied to server modules), and the prod toolchain would split (Vite for client, `tsc` for server). `vite-node` collapses the dev-time toolchain to a single tool and aligns dev-time and build-time TS handling across both runtimes.

## Consequences

- The project maintains a shared Vite base and a server Vite config today; a root-level client Vite config joins them when the React Router client lands. Each file reads on its own — opening the server config shows only server concerns, and opening the client config shows only client concerns.
- Two Vite instances are alive in dev (one driven by `vite-node` against the server config; one programmatic dev server created inside the Fastify init flow with the client config). They share aliases and env via the shared base.
- TypeScript handling is uniform across both runtimes — same loader, same plugin pipeline, same resolution rules.
- Adding a third runtime (CLI tool, worker) is mechanical: drop another `<name>.config.ts`, merge from the same base, point the runner at it.
- Externals stay honest. Server-side `noExternal` / `external` overrides live only in the server config; the client config cannot accidentally inherit them.
- If Vite's Module Runner (the Environments API runtime) supplants `vite-node` upstream, only the dev-time runner swaps — the one-config-per-runtime layout survives the shift.
