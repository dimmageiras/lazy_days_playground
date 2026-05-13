# Plan: Instance Lifecycle Event Bus

> Built on the research outputs of four parallel Opus agents (events module, lifecycle coordination patterns, security threat model, HMR singleton patterns). Decisions below cite the agent that supplied the load-bearing argument; full source list at the end.

## Goal

Build an **in-process, typed, async-aware, hot-reload-safe event bus** that any module in the server can publish to and subscribe to. The first concrete use is coordinating Fastify instance retirement/registration during `vite-node --watch` re-evaluation, but the bus is general — it owes nothing to the bootstrap module.

Two initial events: `retire` (the current Fastify instance should release resources) and `register` (a new instance is now the live one). Both are async — listeners may do I/O and `emit` must await all of them.

## Runtime baseline

- **Node.js**: **v26.x** (Current as of 2026-05-05, expected LTS 2026-10). Bump `package.json` engines to `>=26.0.0`. Justification under "Decisions" below.
- **TypeScript**: strict mode, `verbatimModuleSyntax`, `erasableSyntaxOnly` — all current project settings preserved.
- **Dev runner**: `vite-node --watch` (entry-module re-eval inside the same Node process; **no full restart on save**).
- **Production runner**: assumed to be a full-restart watcher or a built artifact — HMR considerations apply only to the dev path, but the bus must not break under either.

## Constraints

1. **Awaited emit**: `await bus.emit(event, payload)` resolves **only after every subscriber's async work has settled**. Order: serial, FIFO of registration. Listeners must not silently fire-and-forget.
2. **HMR-safe**: surviving `vite-node --watch` re-eval is non-negotiable. Subscribers must not stack across re-evals. The Node process can run for hours through hundreds of saves with no listener accumulation, no closure-capture leaks, no memory growth.
3. **Open emit policy**: any module can `emit`. (Per user decision earlier in the conversation.)
4. **Strict typing**: event names and payloads are inferred from a single `EventMap` source of truth. Misnamed events and wrong payload shapes are compile-time errors.
5. **Robust under hostile/buggy listeners**: one throwing listener does not break the chain, does not crash the process, does not poison subsequent emits.
6. **Boundary clarity**: the bus is **in-process only**. Cross-process coordination remains the cooperative-shutdown HTTP route's job.

## Decisions

Each decision lists the option chosen, the dissent considered, and the reason.

### D1. Foundation: hand-rolled hook registry, not `EventEmitter` or `EventTarget`

`EventEmitter.emit` is synchronous: "any values returned by the called listeners are ignored and discarded" (Node docs, [agent 1]). `EventTarget.dispatchEvent` is also synchronous (agent 1). Neither awaits async listeners. Every async-aware Node lifecycle library reviewed (close-with-grace, lightship, terminus, Avvio's `onClose` chain) hand-rolls its own awaited iteration (agent 2). No npm package combines (a) multi-event + (b) awaited serial + (c) returned disposer + (d) strict-typed event map (agent 2's survey of 7 candidates).

Hand-rolling is ~50 LoC and avoids the runtime dependency. The hand-rolled bus retains AbortSignal-based subscriber cleanup (next decision) so it does not give up the ergonomic win that EventTarget brings.

Node 26 also surfaces `events.on(emitter, name, { signal, close, highWaterMark, lowWaterMark })` (async iterator) and `events.once(emitter, name, { signal })` (Promise). Both are **pull-based** — a single consumer drains events one at a time. Our use case is **push fan-out**: one `emit` notifies every subscriber and awaits them all. Different shape, not applicable.

**Dissent considered**: Agent 1's pick was `EventTarget` for the built-in `{ signal }` listener cleanup. Resolved by porting that semantic into our hand-roll (D3).

### D2. Internal storage: `Map<EventName, Set<Listener>>`

Map over `Record` because object dictionaries are vulnerable to prototype pollution if any event name ever derives from untrusted input (agent 3 — OWASP CWE-1321). `Set` over `Array` for free dedup of the same listener reference. The registry's get-or-create path uses `Map.prototype.getOrInsertComputed(event, () => new Set())` — TC39's Stage-4 Upsert proposal, shipped in V8 14.6 and available in Node 26. One lookup instead of two, no allocation on hits. Falls back to the standard `Map.get`/`Map.set` idiom on any pre-v26 runtime if `engines` is later loosened.

### D3. Subscriber cleanup: `on(event, fn, { signal })` with AbortSignal

The bus's `on` accepts an optional `AbortSignal`. When the signal aborts, the listener is removed atomically. This mirrors `addEventListener(..., { signal })` — the signal option is the stable cleanup pattern on Node's `EventTarget` and the Web spec it derives from. For listening to the abort event itself, `events.addAbortListener(signal, listener)` (available since v20.5.0 / v18.18.0; promoted Experimental → Stable in v24.0.0 / v22.16.0) returns a `Disposable` and is immune to `stopImmediatePropagation()`. If the bus ever needs to react to abort directly (e.g. instrumentation, telemetry), prefer that helper over a bare `signal.addEventListener('abort', …)`. Returned unsubscribe function is offered as well for non-HMR callers.

Subscriber pattern (every module that subscribes uses this shape):

```ts
// module-level — runs once per re-eval, idempotent
const controller = registerController("module:retire-prior");
bus.on("retire", async () => { /* … */ }, { signal: controller.signal });
```

`registerController(key)` is a helper exported from the bus module:

```ts
// pseudocode — final names settled during implementation
const registerController = (key: string): AbortController => {
  const live = liveControllers; // Map<string, AbortController> stashed on globalThis
  live.get(key)?.abort();        // tear down prior eval's listeners under this key
  const controller = new AbortController();
  live.set(key, controller);
  return controller;
};
```

This collapses three behaviours into one primitive:
- HMR cleanup (Agent 4): prior controller aborts on re-eval → all listeners under it auto-removed.
- Test cleanup: tests call `controller.abort()` to detach.
- Owner-isolated reset: any module can dispose its own subset without touching others.

**Dissent considered**: Agent 4 also surfaced `import.meta.hot.dispose`. Rejected — only available under Vite runners and the bus must degrade gracefully under `node --watch`, `tsx --watch`, etc. (agent 4). Note also that `node --watch` spawns a fresh process per reload, so singleton pinning is moot there; only dev runners with in-process re-eval (vite-node, tsx without respawn) need the HMR-safe singleton. AbortSignal has been stable since Node v15.4.0 — well below any conceivable floor.

### D4. Singleton survival: string key + `Object.defineProperty` lock

Both the bus instance and the `liveControllers` map live on `globalThis` under string keys (`"__lifecycleBus"`, `"__lifecycleControllers"`). On first initialization the slot is sealed via `Object.defineProperty(globalThis, KEY, { value, writable: false, configurable: false })`. Subsequent re-evals only read.

Agent 3 flagged two relevant attacks:
- **`Symbol.for` registry collision**: any module calling `Symbol.for("__lifecycleBus")` aliases the same slot via the cross-realm global symbol registry. MDN recommends prefixing keys to dodge collisions; further, the registry is world-readable and confers no isolation — a string slot on `globalThis` paired with a `defineProperty` lock provides equivalent uniqueness without registry semantics. → use a string slot, not `Symbol.for`.
- **`globalThis` slot tampering**: any module could `globalThis.__lifecycleBus = …`. → `Object.defineProperty` with `writable: false, configurable: false` blocks reassignment and deletion.

**Dissent considered**: Agent 4 recommended `globalThis[Symbol.for("…")] ??= createBus()`. Resolved: string key wins on the security axis (agent 3); `Object.defineProperty` lock recovers the identity-preservation guarantee that `Symbol.for` was supplying.

### D5. Error handling: per-listener `try/catch`, collect into `AggregateError`, continue chain

Inside `emit`, each listener invocation is wrapped:

```ts
const errors: unknown[] = [];
for (const listener of [...listeners]) {  // snapshot for re-entrancy
  try { await listener(payload); }
  catch (err) { errors.push(err); }
}
if (errors.length) throw new AggregateError(errors, `bus.emit("${event}") had ${errors.length} listener errors`);
```

This matches the Fastify/Avvio precedent (agent 2) and prevents the cascade Agent 3 warned about — a single throw entering `uncaughtException` would trip every `close-with-grace` handler in the process. The collected `AggregateError` is the caller's responsibility; the bus never silently swallows.

**Node-native alternative considered**: `EventEmitter`'s `captureRejections: true` (with the `Symbol.for('nodejs.rejection')` / `captureRejectionSymbol` handler) routes rejected promises from async listeners to the `'error'` event. Rejected here because `emit` still dispatches synchronously — the rejection is *caught*, not *awaited*. `await bus.emit(...)` would resolve before the failures land. Our bespoke loop awaits each listener and aggregates errors, which is the property the goal demands. The `errorMonitor` symbol exists for non-consuming observation; not needed today, revisit if structured telemetry on listener errors is wanted.

### D6. Listener snapshot before iteration

`[...listeners]` (or `Array.from(set)`) is copied before the await loop. This mirrors Node's own `EventEmitter` semantics — per the v26 events docs, *"any `removeListener()` or `removeAllListeners()` calls after emitting and before the last listener finishes execution will not remove them from `emit()` in progress."* Snapshotting is how Node achieves that in-flight stability; we do the same so that mid-iteration removal via AbortSignal (Azure SDK #13985 hazard) cannot skip siblings either.

### D7. Event-name allow-list at the type and runtime layer

The `EventMap` interface is a literal union. At runtime the bus checks `name in EVENTS` (a frozen constant) before any registry access. Closes the prototype-pollution amplification path (agent 3) and gives clearer error messages than "no such event" with a stringified key.

### D8. Reentrancy guard

`emit` is allowed; re-entrant `emit` of the **same** event during its own dispatch is rejected with a `ReentrancyError`. Different events nest freely. Implementation: a `Set<EventName>` of currently-dispatching events stored on the bus instance.

### D9. Listener cap as a fatal log

`bus.setMaxListeners(n)` defaults to 5. Exceeding it logs once at error level and **drops the new listener** (instead of warning and accepting it like `EventEmitter`). Surfaces accumulation bugs immediately rather than waiting for the default-10 warning (agent 3).

### D10. No `AsyncLocalStorage` integration

`EventEmitterAsyncResource` was considered (agent 1) for async-context propagation. Rejected — the project does not use `AsyncLocalStorage` for request context, and `EventEmitterAsyncResource` adds per-listener async-hook overhead. Revisit if a need appears.

## Architecture

### Module layout

```
app/server/lifecycle/
  lifecycle.bus.ts                    Bus class + factory + globalThis pin
  lifecycle.event.ts                  EventMap + payload types + allow-list constant
  lifecycle.controller.ts             registerController helper (per-key AbortController stash)
  lifecycle.error.ts                  ReentrancyError class (custom error type)
  listeners/
    retire-prior.listener.ts          Closes prior Fastify app — subscribes to "retire"
    register-current.listener.ts      Stashes new {app, handle} pair — subscribes to "register"
    listeners.ts                      Side-effect barrel that imports both listener files
    index.ts                          Re-exports for tests
  index.ts                            Public barrel: bus, registerController, types
```

### Type surface (sketch)

```ts
// lifecycle.event.ts
const EVENTS = Object.freeze({ retire: "retire", register: "register" } as const);
type EventName = (typeof EVENTS)[keyof typeof EVENTS];

interface LifecycleEventMap {
  retire: void;
  register: { app: FastifyInstance; handle: CloseWithGraceReturn };
}

// lifecycle.bus.ts
interface OnOptions { readonly signal?: AbortSignal }
interface LifecycleBus {
  on<K extends EventName>(
    event: K,
    listener: (payload: LifecycleEventMap[K]) => void | Promise<void>,
    options?: OnOptions,
  ): () => void;                             // returned manual unsubscribe
  emit<K extends EventName>(
    event: K,
    payload: LifecycleEventMap[K],
  ): Promise<void>;                          // awaits all listeners; throws AggregateError on any failure
  setMaxListeners(count: number): void;
  listenerCount(event: EventName): number;
}
```

### Singleton pin (one-time initialization)

```ts
// lifecycle.bus.ts (essential pseudocode)
const BUS_KEY = "__lifecycleBus";
const CONTROLLERS_KEY = "__lifecycleControllers";

const ensureSingleton = (key: string, factory: () => unknown): unknown => {
  if (key in globalThis) return (globalThis as Record<string, unknown>)[key];
  const value = factory();
  Object.defineProperty(globalThis, key, {
    value,
    writable: false,
    configurable: false,
    enumerable: false,
  });
  return value;
};

const lifecycleBus = ensureSingleton(BUS_KEY, createBus) as LifecycleBus;
const liveControllers = ensureSingleton(CONTROLLERS_KEY, () => new Map<string, AbortController>()) as Map<string, AbortController>;
```

A typed `declare global` block in `lifecycle.bus.t.ts` augments `globalThis` so the lookup is type-safe inside the lifecycle module. The augmentation is **not** exported — outside callers go through the typed `lifecycleBus`/`registerController` exports.

### Subscriber wiring

Each listener file follows the same shape:

```ts
// listeners/retire-prior.listener.ts
import { lifecycleBus, registerController } from "@server/lifecycle";

const controller = registerController("bootstrap:retire-prior");

const retirePrior = async (): Promise<void> => {
  const prior = globalThis.__priorInstance;
  if (!prior) return;
  prior.handle.uninstall();
  await prior.app.close();
};

lifecycleBus.on("retire", retirePrior, { signal: controller.signal });
```

The `listeners.ts` side-effect barrel imports both listener files; importing the barrel from the entry point is what attaches the listeners on each eval.

### Emission from bootstrap

`setupCloseListeners` becomes a thin orchestrator:

```ts
const setupCloseListeners = async (app: FastifyInstance): Promise<CloseWithGraceReturn> => {
  await lifecycleBus.emit("retire", undefined);
  const handle = closeWithGrace({ delay, logger: app.log }, async (event) => { /* …signal/manual/err handling… */ });
  await lifecycleBus.emit("register", { app, handle });
  return handle;
};
```

The existing `globalThis.__priorInstance` pointer remains — it's the **state** the listeners read/write. The bus is the **trigger**.

## File-level migration steps

1. **Bump `engines.node`** in `package.json` to `>=26.0.0`. Note the LTS-pending status in the PR.
2. **Create `app/server/lifecycle/lifecycle.event.ts`** with `EVENTS`, `EventName`, `LifecycleEventMap`.
3. **Create `app/server/lifecycle/lifecycle.error.ts`** with `ReentrancyError`.
4. **Create `app/server/lifecycle/lifecycle.bus.ts`** implementing the registry, with the `ensureSingleton` helper and `Object.defineProperty` lock. Internal storage `Map<EventName, Set<Listener>>` using `Map.prototype.getOrInsertComputed(event, () => new Set())` (Node 26 / V8 14.6 / TC39 Upsert Stage 4). Unit-testable.
5. **Create `app/server/lifecycle/lifecycle.controller.ts`** exporting `registerController(key)`.
6. **Move the `globalThis` augmentation**. Delete `app/server/types/app/global-this.t.ts`. Replace with `app/server/lifecycle/lifecycle.t.ts` declaring `__lifecycleBus`, `__lifecycleControllers`, and **moving** `__priorInstance` here so the lifecycle module owns its three globals together.
7. **Create the two listener files** under `app/server/lifecycle/listeners/`. The bodies are the current contents of the prior-instance branch inside `setupCloseListeners` — copied verbatim, no logic change.
8. **Create `listeners/listeners.ts`** as the side-effect barrel.
9. **Wire from entry**. Add `import "@server/lifecycle/listeners";` near the top of `app/server/server.ts` so subscriptions are attached before `bootstrapServer` runs.
10. **Slim `setupCloseListeners`** in `app/server/modules/bootstrap/helpers/close.helper.ts` to the orchestrator shape in D5. Remove the inline `prior?.uninstall()` / `await prior.app.close()` block and the inline `globalThis.__priorInstance = …` write.
11. **Verify**: `pnpm dev`, save files repeatedly (>100 saves over a few minutes), watch RSS stays flat and PID stays constant. Ctrl+C still emits exactly one log line. Cross-process handover from a second `pnpm dev` terminal still completes.

## Hardening checklist (gleaned from Agent 3, priority order)

1. ✅ Allow-list event names: `if (!(name in EVENTS)) throw new TypeError(...)` at the top of `on` and `emit`.
2. ✅ `Map`, not `Record`, for the listener registry.
3. ✅ `Object.defineProperty` lock on every `globalThis` slot the lifecycle module owns.
4. ✅ Snapshot listeners (`[...set]`) before the await loop in `emit`.
5. ✅ Per-listener `try/catch` + `AggregateError`. Bus never escapes errors via `uncaughtException`.
6. ✅ `AbortController` per subscriber-owner key, aborted on re-eval. Controllers owned by callers via `registerController`; the bus stores listeners but never the controllers.
7. ✅ `setMaxListeners(5)` and drop-on-exceed instead of warn-on-exceed.
8. ✅ Reentrancy guard: throws `ReentrancyError` on same-event nested emit.
9. ✅ Documented trust model: all listeners share a boundary; the bus is in-process only.
10. ✅ Side-channel acknowledgement: serial async emit leaks per-listener timing to siblings. Acceptable because no listener handles cross-tenant secrets. Re-evaluate if that changes.

## Tests

- **Bus correctness**: register / emit / unsubscribe / signal-abort all behave per contract. Exercise the `Map.prototype.getOrInsertComputed` registry path on Node 26.
- **Awaited serial FIFO**: assert order and that emit's resolution awaits all listeners.
- **Re-eval simulation**: import the bus module identity twice in a single Vitest process; assert identity stable, listener count bounded.
- **AggregateError on throws**: one throwing listener does not prevent the others from running.
- **Re-entrancy**: same-event nested emit throws; different-event nested emit succeeds.
- **Allow-list**: emitting/registering an unknown event throws at runtime.
- **`Object.defineProperty` lock**: attempting `globalThis.__lifecycleBus = poisoned` throws `TypeError` (ESM modules are always strict, so the sloppy-mode silent-fail branch is unreachable in this codebase).
- **Manual smoke** (integration): the dev-loop test from §file-migration step 11.

## Open questions

1. **Does close-with-grace's signal handler also `emit("retire")`?** Today the close-with-grace callback in `setupCloseListeners` calls `await app.close()` directly. With the bus in place, it could `await bus.emit("retire", undefined)` for consistency — then both the HMR path and the signal-shutdown path run the same listeners. Tradeoff: the signal path is followed by `process.exit`, so any post-retire `register` would re-arm doomed state. Recommend: signal handler **does** emit `retire` but **does not** emit `register`.
2. **Should `register` ever fire from outside bootstrap?** The user wants open emit. Useful if e.g. tests want to swap a fake app in. Decision: keep open, document the contract.
3. **Cross-process boundary**. A second Node process running `pnpm dev` has its own `globalThis`, its own bus. The cooperative-shutdown HTTP POST path bridges them today and continues to. The bus does not — and **must not** — try to be cross-process. Document this prominently in the bus module's top-of-file JSDoc.
4. **`AbortSignal` polyfill / older runtimes**. We're targeting Node 26 so this isn't a concern. If `engines` is ever loosened, AbortSignal has been stable since Node v15.4.0 — well below any conceivable floor.
5. **Should listener registration accept a `priority` or only insertion order?** Insertion order is enough for the two events we have. Re-evaluate if a third event with ordering constraints appears.

## Why Node 26 (and the LTS-pending caveat)

Node 26.0.0 (2026-05-05) is **Current**, not yet LTS. It enters LTS October 2026. Three reasons this plan targets 26, grounded in the v26.1.0 events docs and the v26.0.0 release notes:

1. **No semantic change in the events module on v26**. The events docs confirm `EventEmitter` (sync emit, ignored return values), `EventTarget` (sync dispatch; async-listener rejections are surfaced as **uncaught exceptions on `process.nextTick`**, not awaited), `AbortSignal` (`signal` option on `addEventListener`, stable `events.addAbortListener`), `captureRejections`, `EventEmitterAsyncResource`, `events.on` / `events.once`, `setMaxListeners`, `errorMonitor`, and `getEventListeners` / `getMaxListeners` all behave as on recent prior majors. Whatever we ship works identically on v24 and v26.
2. **One concrete v26 win for this code**: V8 14.6 ships TC39's Stage-4 Upsert proposal (`Map.prototype.getOrInsertComputed`), which collapses the registry's get-or-create path to one call with no allocation on hits.
3. **None of v26's breaking removals touch this code**. Legacy `_stream_*` modules, `http.writeHeader()`, `module.register()` deprecation, GCC 13.2 build floor — irrelevant to the bus.

If the project's deployment story can't risk Current — common for hosted environments — the bus can be implemented identically on Node 24 by falling back to the standard `Map.get`/`Map.set` get-or-create idiom (3-line difference). The plan's architecture does not change.

## Sources

### Node.js core
- [Node.js v26 events module docs](https://nodejs.org/api/events.html)
- [Node.js 26.0.0 release post](https://nodejs.org/en/blog/release/v26.0.0)
- [Node.js v26.0.0 release tag](https://github.com/nodejs/node/releases/tag/v26.0.0)
- [Node.js v26.1.0 release tag](https://github.com/nodejs/node/releases/tag/v26.1.0)
- [TC39 proposal-upsert (`getOrInsert` / `getOrInsertComputed`) — Stage 4](https://github.com/tc39/proposal-upsert)
- [Node.js process events docs](https://nodejs.org/api/process.html)
- [Node.js CLI docs — `--watch`, `--watch-kill-signal`](https://nodejs.org/api/cli.html)
- [DefinitelyTyped #55298 — EventEmitter generic typing](https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/55298)

### Lifecycle / shutdown coordinators
- [close-with-grace (mcollina)](https://github.com/mcollina/close-with-grace)
- [fastify-graceful-shutdown (hemerajs)](https://github.com/hemerajs/fastify-graceful-shutdown)
- [lightship (Gajus)](https://github.com/gajus/lightship)
- [terminus (Godaddy)](https://github.com/godaddy/terminus)
- [http-terminator (Gajus)](https://github.com/gajus/http-terminator)
- [NestJS lifecycle events](https://docs.nestjs.com/fundamentals/lifecycle-events)
- [Fastify Hooks reference (onClose, preClose)](https://fastify.dev/docs/latest/Reference/Hooks/)
- [Avvio README — serial onClose chain](https://github.com/fastify/avvio)

### Security
- [OWASP Prototype Pollution Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html)
- [MDN — Prototype pollution](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Prototype_pollution)
- [CWE-1321 — Prototype Pollution](https://cwe.mitre.org/data/definitions/1321.html)
- [MDN — Symbol.for global registry warning](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/for)
- [MDN — globalThis](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis)
- [Node.js Security Best Practices](https://nodejs.org/learn/getting-started/security-best-practices)
- [Azure SDK #13985 — self-removing abort listeners skip siblings](https://github.com/Azure/azure-sdk-for-js/issues/13985)
- [WHATWG DOM #911 — AbortSignal in addEventListener](https://github.com/whatwg/dom/issues/911)
- [Snyk — async functions blocking the event loop](https://snyk.io/blog/nodejs-how-even-quick-async-functions-can-block-the-event-loop-starve-io/)

### HMR / dev runners
- [Vite HMR API](https://vite.dev/guide/api-hmr)
- [vitest-dev/vitest #2334 — vite-node --watch doesn't close prior process/server before re-eval (motivates the bus)](https://github.com/vitest-dev/vitest/issues/2334)
- [vitest-dev/vitest discussion #1738 — shutdown HTTP server before script reload](https://github.com/vitest-dev/vitest/discussions/1738)
- [vitejs/vite #16283 — hot.dispose last-write-wins](https://github.com/vitejs/vite/issues/16283)
- [vitejs/vite #14185 — hot.on/hot.off](https://github.com/vitejs/vite/issues/14185)
- [vitejs/vite #19630 — import.meta.hot in Node SSR](https://github.com/vitejs/vite/issues/19630)
- [bjornlu — Hot Module Replacement is Easy](https://bjornlu.com/blog/hot-module-replacement-is-easy)
- [tsx watch-mode docs](https://github.com/privatenumber/tsx/blob/master/docs/watch-mode.md)
- [nodemon README](https://github.com/remy/nodemon)
- [CSS-Tricks — AbortController for event listener cleanup](https://css-tricks.com/using-abortcontroller-as-an-alternative-for-removing-event-listeners/)
- [Simarpal Singh — globalThis singletons across HMR](https://medium.com/@simarpalsingh13/stop-copy-pasting-globalthis-prisma-hot-reload-in-node-js-vs-next-js-explained-e664ec6ced23)
- [Robin Viktorsson — Singleton design pattern in TS/Node](https://medium.com/@robinviktorsson/a-guide-to-the-singleton-design-pattern-in-typescript-and-node-js-with-practical-examples-a792a5983e5d)

### Project ecosystem
- [Fastify framework](https://fastify.dev/)
- [Vite — Configuring Vite](https://vite.dev/config/)
- [pino — logger](https://github.com/pinojs/pino)
