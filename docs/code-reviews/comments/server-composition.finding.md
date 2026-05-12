# Code Review Findings: Server Composition

## Summary

- Total findings: 7
- Blockers: 1
- Warnings: 2
- Nits: 2
- Info: 2

Overall verdict: The wiring layer is small, focused, and reads as composition-only — one statement per responsibility (instance, options, factory call, business route, plugin register, listen). Plugin order is sound: `setupCloseListeners` runs inside the factory before `createShutdownRoute` is constructed, the shutdown route is registered before `claimPort()` triggers `app.listen`, and `closeListeners` is threaded through the plugin options correctly. The main concerns are a hardcoded shutdown secret committed to source (blocker), a fixed-host literal (`127.0.0.1`) being routed through the options bag instead of imported as a shared constant per the composition rule, and an unstructured logger config that will leak verbose Pino output unconditionally in any environment that runs this entry. The placeholder `/` route is acceptable for a scaffold but should be tracked as wiring-only.

## Findings

### [blocker] Shutdown token is a plaintext literal committed to the repo

**File:** `app/server/constants/server.constant.ts:1-6`
**Skill / criterion:** `code-review-and-quality` → Security; review focus → Security / "Routes that handle secrets … process-level effects".

`SHUTDOWN_TOKEN: "dev-shutdown-token"` is a process-killing credential stored verbatim in version control. The shutdown route (`shutdown.route.ts:37-50`) calls `closeListeners.close()` on any request that produces this string from a loopback IP — anyone with read access to the repo (or to a built bundle) can stop the running server. The accompanying `TO-DO` acknowledges the gap but leaves the secret in place. The constant file is also imported at the wiring layer with no environment guard, so the same literal is the production value if/when this entry script ships beyond local dev.

**Suggested fix:**

```ts
// server.constant.ts — read from env at module load, fail closed if absent
const shutdownToken = process.env.SHUTDOWN_TOKEN;

if (!shutdownToken) {
  throw new Error("SHUTDOWN_TOKEN env var is required");
}

const SERVER_SETTINGS = Object.freeze({
  PORT: Number(process.env.PORT ?? 5173),
  SHUTDOWN_TOKEN: shutdownToken,
} as const);
```

The `HOST_LOOPBACK` field should be dropped from this bag entirely (see next finding).

---

### [warning] `HOST_LOOPBACK` is a fixed host literal routed through the options bag

**File:** `app/server/constants/server.constant.ts:3` and `app/server/server.ts:6,12-16`
**Skill / criterion:** Review focus → Composition discipline: "True-constant values (protocols, methods, path literals, status codes, fixed host literals) are direct-imported at use sites, **not** routed through the options bag".

`"127.0.0.1"` is the IPv4 loopback — it does not vary by environment, deployment, or secret. The shared module already exposes `HOSTS.LOOPBACK_IPV6` and `HOSTS.BIND_ALL` from `app/shared/constants/network.constant.ts` and `shutdown.route.ts` already direct-imports `LOOPBACK_IPV6` from there. The IPv4 sibling belongs in the same shared bag and should be consumed at the use site (the shutdown route and the shutdown-request helper), not threaded through `BootstrapConfigOptions`. Threading it through the bag makes the factory signature look env-shaped (`hostLoopback: string`) when in practice every caller passes the same literal.

**Suggested fix:**

```ts
// app/shared/constants/network.constant.ts
const HOSTS = Object.freeze({
  BIND_ALL: "0.0.0.0",
  LOOPBACK_IPV4: "127.0.0.1",
  LOOPBACK_IPV6: "::1",
} as const);
```

```ts
// shutdown.route.ts — import LOOPBACK_IPV4 directly, drop hostLoopback from config
const { LOOPBACK_IPV4, LOOPBACK_IPV6 } = HOSTS;
// ...
if (request.ip !== LOOPBACK_IPV4 && request.ip !== LOOPBACK_IPV6) { ... }
```

```ts
// server.ts — options bag shrinks to env-varying values only
const bootstrapConfigOptions = {
  port: PORT,
  shutdownToken: SHUTDOWN_TOKEN,
};
```

The bootstrap module + shutdown-request helper changes are out of scope for this review, but list them as the dependent edits in the same PR.

---

### [warning] `logger: true` is unconditional and unstructured at instance creation

**File:** `app/server/server.ts:10`
**Skill / criterion:** `fastify-best-practices` → logging configured at instance creation; review focus → Fastify idioms / "Logging is configured at instance creation, not patched onto the instance later".

The instance creation is in the right place, but `logger: true` ships the default Pino transport with no level, redaction, or pretty-print gating. In dev under `vite-node` this floods stdout with JSON request/response lines; in any non-dev run it would emit the same verbose stream with no field redaction (the shutdown token would be visible in `x-shutdown-token` header logging if Fastify's default request log shape ever included headers). A structured config — even a minimal one — keeps logging environment-aware from day one and matches the Fastify-idiomatic pattern.

**Suggested fix:**

```ts
const isDev = process.env.NODE_ENV !== "production";

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? (isDev ? "info" : "warn"),
    redact: {
      paths: ['req.headers["x-shutdown-token"]'],
      censor: "[REDACTED]",
    },
    ...(isDev && {
      transport: { target: "pino-pretty", options: { translateTime: "HH:MM:ss.l" } },
    }),
  },
});
```

`pino-pretty` is a devDependency add — flag in the PR.

---

### [nit] `app.get("/", …)` placeholder mixes business logic into the wiring layer

**File:** `app/server/server.ts:22`
**Skill / criterion:** Review focus → Composition discipline / "The entry contains _wiring only_ — no business logic, no helpers defined inline".

Inline `async () => ({ hello: "world" })` is a route handler defined at the wiring layer. It is one line today, but the rule's whole point is to prevent the entry from accreting handlers. Either move it into a `routes/` plugin and `app.register(rootRoute)` from the entry, or delete it until there is a real root handler to add. The composition layer should only call factories and `register` — never define inline business code.

**Suggested fix:**

```ts
// app/server/routes/root.route.ts
import type { FastifyPluginAsync } from "fastify";

const rootRoute: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({ hello: "world" }));
};

export { rootRoute };
```

```ts
// server.ts
await app.register(rootRoute);
await app.register(...shutdownRouteWithListeners);
await claimPort();
```

---

### [nit] Two-line destructure of a one-property namespace adds noise

**File:** `app/server/server.ts:8`
**Skill / criterion:** Review focus → Readability / "One responsibility per top-level statement".

`const { bootstrapServer } = BootstrapModule;` only exists because the module re-exports a single function under a namespace. The namespace adds an indirection with no payoff at the wiring layer. Either named-export `bootstrapServer` directly from `bootstrap.module.ts` (the module-level edit is out of scope but worth filing), or import the namespace and use `BootstrapModule.bootstrapServer(...)` at the call site to keep the entry's import list one line shorter.

**Suggested fix:**

```ts
// preferred — once the bootstrap module exports the function by name
import { bootstrapServer } from "./modules/bootstrap/bootstrap.module";
```

---

### [info] `PORT: 5173` collides with the Vite dev-server default

**File:** `app/server/constants/server.constant.ts:4`
**Skill / criterion:** `code-review-and-quality` → Correctness; review focus → Security / "doesn't widen the bind host beyond what's necessary".

The bootstrap factory's whole port-claim dance (cooperative shutdown, then SIGTERM) is well-suited to handing the port over from a previous server instance, but `5173` is also Vite's published default dev port. If a dev concurrently runs `vite` (frontend) and `vite-node ./app/server/server.ts` (backend), the backend will SIGTERM the Vite process. Whether intentional or not, this is worth a comment in `server.constant.ts` explaining the choice, or a different default port for the backend.

No fix mandated — flag the intent in a comment or move the default to something less collision-prone (`5174`, `3000`).

---

### [info] Spread `app.register(...shutdownRouteWithListeners)` is correct but unusual

**File:** `app/server/server.ts:24`
**Skill / criterion:** Review focus → Fastify idioms / "`app.register(plugin, options)` is used".

`shutdownRouteWithListeners` is typed as `readonly [FastifyPluginAsync<…>, ShutdownRouteOptions]`, so spreading into `register` matches the `(plugin, options)` signature exactly and is type-safe. It is, however, an unusual idiom — readers expecting the canonical `app.register(plugin, options)` shape may pause. If the tuple shape is load-bearing for testing or for passing the pair around as one value, the spread is fine; otherwise consider returning two named fields and registering with the canonical form.

```ts
// Alternative — returns named fields
const { claimPort, shutdownRoute, shutdownRouteOptions } = bootstrapServer({ app, options });
await app.register(shutdownRoute, shutdownRouteOptions);
```

No required action — recording the trade-off so future edits don't accidentally break the tuple contract.

---

## Strengths observed

- Plugin order is correct: `setupCloseListeners` is called inside the factory before the shutdown route is constructed; the shutdown route is registered before `claimPort()` triggers `app.listen`, so the route is live before the listener accepts traffic.
- Top-level awaits (`await app.register(...)`, `await claimPort()`) are properly awaited at module scope with `"type": "module"`; no dangling promises.
- The entry is appropriately small and reads top-to-bottom as composition only — import, destructure, build options, call factory, register, claim port.
- `closeListeners` is threaded from `setupCloseListeners(app)` into the shutdown route's options bag rather than reached for via module-level state, so the lifecycle dependency is explicit.

## Out of scope

- `shutdown.route.ts` and `shutdown-request.helper.ts` are owned by the bootstrap module review — flagged here only because the `HOST_LOOPBACK` finding requires coordinated edits in those files.
- `app/shared/constants/network.constant.ts` (adding `LOOPBACK_IPV4`) is shared-utilities scope.
- `bootstrap.module.ts` export style (namespace vs named export) is bootstrap-module scope.
