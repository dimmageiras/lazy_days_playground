# Vite multi-target config layout

> **Status — pattern doc.** The server slice (shared base + server config + `vite-node --watch` dev script) is in place today. The client slice (`reactRouter()`-driven Vite config, `react-router.config.ts`, the programmatic Vite middleware mount inside Fastify, the `@fastify/static` serve-and-SSR wiring in prod) is the **target layout**, not the current state. Sections that describe the client slice are forward-looking and should be read as "what it will look like when the client lands."

This project ships two runtimes from one repo:

- **Fastify server** — Node process. Run through `vite-node` in dev (loads TypeScript and applies the Vite plugin/transform pipeline on demand; pair with `--watch` for reload) and bundled with Vite SSR in prod, then executed with plain Node.
- **React Router framework-mode client** — Browser bundle plus an SSR bundle, both produced by Vite via the `reactRouter()` Vite plugin. The Fastify server hosts the SSR build at runtime: in dev it proxies through Vite's middleware; in prod it serves the prebuilt assets and lazy-imports the SSR entry.

Both runtimes consume Vite, but their plugin set, externals, output format, and resolve conditions diverge. The convention is **one shared base + one thin Vite config per runtime**, composed via `mergeConfig` from `vite`.

## What each runtime needs from Vite

| Concern              | Server (Fastify, vite-node)                                                                                                                                                                                                                                                                           | Client (RR framework mode)                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Vite plugin set      | Aliases, env loading, optional TS error checker — nothing visual.                                                                                                                                                                                                                                     | `reactRouter()`, Babel (React Compiler), optional in-Vite TS / ESLint reporter (capability — package TBD), dev tools. |
| `resolve.conditions` | `node`.                                                                                                                                                                                                                                                                                               | `browser` for client environment; `node` for SSR environment (managed by RR's plugin).                                |
| `ssr.target`         | Defaults to `"node"` — Vite's default. Restate for clarity or rely on the default.                                                                                                                                                                                                                    | `"node"` for the SSR environment (RR sets this); client bundle is for the browser.                                    |
| Externals            | Vite's SSR build externalises imported packages by default, except linked dependencies (kept bundled for HMR). Override via `ssr.noExternal` (force-bundle) or `ssr.external` / `rollupOptions.external` (force-extend). See the [Vite SSR externals docs](https://vite.dev/guide/ssr#ssr-externals). | RR's plugin decides what to bundle vs externalise per environment.                                                    |
| `build.outDir`       | Single Node entry — one output directory under the project's build root.                                                                                                                                                                                                                              | `client/` (browser assets) and `server/` (SSR entry) under the configured `buildDirectory` — RR's plugin owns layout. |
| Multi-environment    | One environment (the server). No need for the Environments API.                                                                                                                                                                                                                                       | Two environments (`client`, `ssr`) managed internally by RR's plugin.                                                 |

The asymmetry is the whole reason for two configs: the client config is mostly _handing off to_ RR's plugin, while the server config is a small, plain Node SSR build.

## File layout

Three files, related by composition:

- A **shared base** — common aliases, define, envPrefix, env-flag plugins.
- A **client config** — RR framework mode: `reactRouter()` plugin, React tooling.
- A **server config** — Fastify: Node-side resolve, SSR settings, server `outDir`.

The **client config lives at the repo root as `vite.config.ts`** by convention — that is where Vite's default config discovery looks. The `react-router` CLI (`react-router dev`, `react-router build`) does accept `--config` / `-c <path>` and forwards it to Vite as `configFile`, so a non-root location is technically reachable; the project prefers the root anyway to match Vite's discovery default and save one CLI flag per command. The **shared base and the server config live together in a single tooling directory** (location is a project choice) — neither is loaded by a CLI that needs the root: `vite-node` takes an explicit `--config` flag for the server config, and the shared base is imported as a module, never loaded directly.

The asymmetry is a project preference, not a CLI constraint. It is the smallest workable shape; the alternative (a root stub that re-exports the real client config from the tooling directory) keeps all three files together at the cost of an extra indirection file that exists only to satisfy Vite's discovery.

Keep all three out of source globs so application code never imports from them.

The `react-router.config.ts` file (the RR framework config — top-level keys like `appDirectory` and `ssr: true`, plus opt-in flags under the `future.*` namespace, e.g. `future.v8_viteEnvironmentApi: true` to enable RR's internal Environments API integration, which requires Vite 6+) also stays at the repo root where the `react-router` CLI expects it. It is **not** a Vite config; it configures RR itself. The client Vite config picks RR up via the `reactRouter()` plugin, which reads `react-router.config.ts` internally.

## Shape of each file

The blocks below are **outlines**, not runnable snippets — comments stand in for keys a real config would set. `mergeConfig` from `vite` deep-merges; arrays (`plugins`, `resolve.conditions`, `rollupOptions.external`) are concatenated, so items unique to a runtime live in that runtime's file, not in the base.

### Shared base

The base owns everything both runtimes agree on. Keep it small — every key here is a key both runtimes pay for.

```ts
// Outline — not runnable
import { defineConfig } from "vite";

export default defineConfig({
  // resolve.alias for cross-cutting aliases,
  // define for env-flag constants both bundles read,
  // envPrefix, optionally tsconfig-paths resolution
  // (built-in in Vite 8+; pre-8 needs a plugin).
});
```

### Client config

Drives `react-router dev` and `react-router build`. Imports the base, layers RR's plugin and the React-tooling plugins on top, sets the HMR port if needed. Nothing here knows about Fastify.

```ts
// Outline — not runnable
import { defineConfig, mergeConfig } from "vite";

import sharedConfig from "./shared.config";

export default mergeConfig(
  sharedConfig,
  defineConfig({
    plugins: [
      // reactRouter() from @react-router/dev/vite
      // optional: pluginBabel, an in-Vite TS / ESLint reporter
      // (capability — package TBD; or run `tsc -b --watch` as a sidecar),
      // devtools plugins (gated on env). Concrete package choices belong in
      // the ADR or the config file, not in this pattern doc.
    ],
    // server.hmr.clientPort if running behind a reverse proxy
  }),
);
```

### Server config

Drives `vite-node` in dev and `vite build --ssr` in prod. Imports the base, adds Node-specific resolve and SSR settings, externalises runtime dependencies.

```ts
// Outline — not runnable
import { defineConfig, mergeConfig } from "vite";

import sharedConfig from "./shared.config";

export default mergeConfig(
  sharedConfig,
  defineConfig({
    resolve: {
      conditions: ["node"],
    },
    ssr: {
      // target defaults to "node" — restate only for clarity
      noExternal: [
        /* packages shipping ESM-only or untranspiled TS Node can't load */
      ],
    },
    build: {
      ssr: true, // entry passed via CLI: --ssr <server-entry>
      outDir: "/* server out dir */",
      rollupOptions: {
        // Vite's SSR build externalises imported packages by default (except
        // linked deps, which it keeps bundled for HMR). Use `ssr.noExternal` to
        // force-bundle a package and `ssr.external` / `rollupOptions.external`
        // to add to the externalised set. See
        // https://vite.dev/guide/ssr#ssr-externals.
      },
    },
  }),
);
```

## Dev runtime — two Vite instances, one process

In development, two Vite instances are alive at the same time:

1. **`vite-node`** runs the Fastify entry against the server config (passed via its `--config` flag). The server file imports Fastify, registers plugins, starts listening. `vite-node` transforms each TypeScript module on demand using that Vite config — alias resolution, env defines, and TS handling all come from there.
2. **Programmatic Vite dev server** is created inside the Fastify init flow with the client config (passed via the `configFile` option to `createServer()`). The shape is:

   ```ts
   createServer({
     server: { middlewareMode: true },
     appType: "custom",
     configFile: "/* client config path */",
   });
   ```

   Without `appType: "custom"`, Vite still serves an `index.html` fallback for unmatched routes and intercepts requests Fastify expects to handle — see the [Vite SSR dev server setup docs](https://vite.dev/guide/ssr#setting-up-the-dev-server) for the canonical wiring. The dev server exposes a connect-style middleware stack which Fastify mounts via a connect/express adapter plugin (`@fastify/middie` is the connect-shaped one; `@fastify/express` is the Express-shaped one — both work because connect and Express middleware share the `(req, res, next)` shape; the specific package choice belongs to the ADR or PR that wires the client config in). RR exposes its SSR build as a virtual module the dev server can `ssrLoadModule()`; the RR-Fastify request handler then renders against the loaded module.

Two configs, two dev servers, one Node process. The shared base ensures they agree on aliases, env, and any constants they both read.

## Prod runtime — bundle separately, run with Node

Three commands, two Vite builds and one Node start (example):

```
vite build --config /* client config path */
vite build --config /* server config path */ --ssr /* server entry */
node /* server build output */
```

RR's plugin produces a `client/` directory and a `server/` directory under whatever `buildDirectory` is configured in `react-router.config.ts`; the server entry filename defaults to `index.js`. The defaults are `build/client` and `build/server/index.js` — override via `buildDirectory` if a different root is needed.

The server bundle, started with plain Node, serves the RR client output via `@fastify/static`, lazy-imports the RR server entry for SSR, and registers the RR-Fastify request handler against it. Vite is not loaded at runtime in production — both bundles are already JS.

**Output-path collision warning.** The default `outDir` for a Vite SSR build is `dist/`, and the RR-default `build/server/` already exists once RR has built. Pick an `outDir` for the server config that does not nest inside RR's `buildDirectory`, and use a server entry filename that does not collide with RR's `index.js` if the two outputs share a parent.

## Why this layout

- **Each runtime's config reads on its own.** Opening the server config shows only server concerns; no `mode === "client"` branches to filter mentally.
- **RR's framework plugin can own its half completely.** The client config is mostly a `reactRouter()` plugin entry; the server config never sees React tooling.
- **Tooling jumps to the right file.** `vite-node` and `vite build --ssr` each take a `--config` flag; the RR CLI also accepts `--config` but defaults to picking up `vite.config.ts` at the root via Vite's discovery — one file per command, found via the path each runner expects.
- **Externals stay honest.** Any server-side `noExternal` / `external` overrides live in the server config alone; the client config can never accidentally inherit them.
- **Adding a third runtime (CLI tool, worker) is mechanical.** Drop another `<name>.config.ts`, merge from the same base, point the runner at it.

## Alternatives

### Vite Environments API (single config, named environments)

First-class in Vite 6+, stable in Vite 8. One config defines `environments: { client: {}, ssr: {}, server: {} }`, and a single `vite build` builds them all.

Rejected on **lifecycle-isolation** grounds. The RR dev loop and the Fastify dev loop watch different file sets, restart on different signals, and have independent failure modes — a server crash should not bring down client HMR, and a client-config edit should not bounce the API process. Folding both into one `environments` map ties their startup, watch, and restart lifecycles together. Keeping the server in its own file (and its own `vite-node` process) preserves that isolation and leaves RR's internal Environments API usage free to evolve.

### Single `defineConfig(({ mode }) => …)` with mode branching

One file, big ternary on `mode`. Plugin arrays get spliced, externals get conditionally added, the file becomes a config DSL rather than a config. Rejected for the same reason as elsewhere — it scales by adding cleverness instead of files.

### No Vite on the server — a Vite-free alternative

Run the server with `node` directly in dev (Node ≥22 native TS stripping) and compile it with `tsc` in prod. Works, costs nothing, but:

- Server code can't use Vite-resolved aliases without a parallel `tsconfig.paths` mirror.
- Dev-time TS loading is whatever Node's stripper supports — no Vite plugins, no env defines applied to server modules.
- Prod uses two different toolchains (Vite for client, `tsc` for server) instead of one.

Rejected because `vite-node` collapses the toolchain to a single tool and aligns dev-time and build-time TS handling across both runtimes.

**Forward note.** The upstream direction is Vite's own Module Runner (the Environments API). Vitest 4 dropped its `vite-node` dependency in favour of Vite's Module Runner; `vite-node` remains usable as a standalone package today (this project uses it for the dev server). The pattern here (one Vite config per runtime) survives that shift; only the dev-time runner swaps.

## Related

- The decision to take this layout (over Environments API, mode branching, or the plain-Node server) is recorded in [ADR-0001](../adr/0001-vite-multi-target-config.md). This file documents the **pattern**; the ADR records the **decision** and the alternatives weighed.
