# `kill.helper.ts` — last-resort port reclaim

## What this helper does

When a friendlier path (the cooperative HTTP shutdown) has failed or isn't applicable, this helper finds the process currently holding our port and sends it a termination signal. It's the **force fallback** in the port-claim chain:

```
tryListen → cooperative HTTP shutdown → tryListenUntil → killPortOwner → tryListenUntil → abort
                                                          ^^^^^^^^^^^^^
                                                          this helper
```

Two functions live here:

- `findPidOnPort(port, log)` — figure out which OS process is listening on a port.
- `killPortOwner(port, signal, log)` — find that process and signal it.

Only `killPortOwner` is exported; `findPidOnPort` is an internal helper consumed by `killPortOwner`.

## Public surface

```ts
const KillHelper = Object.freeze({
  killPortOwner,
} as const);
```

```ts
killPortOwner(
  port: number,
  signal: Signals,
  log: FastifyBaseLogger,
): Promise<KillPortOwnerResult>
```

The return is a discriminated union — the caller has to handle each branch explicitly:

```ts
type KillPortOwnerResult =
  | { ok: true }
  | { ok: false; reason: "unsupported-platform" | "no-pid" | "kill-threw" };
```

## Platform scope

**This helper only works on Windows.** Non-Windows hosts short-circuit immediately with `{ ok: false, reason: "unsupported-platform" }`. The implementation relies on `netstat -ano` and its column layout — both Windows-specific.

The cross-platform graceful path is the **cooperative HTTP shutdown** (see `shutdown-request.helper.md` and `shutdown.route.md`). The force-kill is only useful on Windows, where dev workflows need a port-reclaim mechanism beyond cooperative shutdown.

## Implementation walkthrough

### `findPidOnPort`

Returns a `Promise<PidLookupResult>`:

```ts
type PidLookupResult =
  | { found: true; pid: number }
  | { found: false; reason: "unsupported-platform" | "no-pid" };
```

The function spawns `netstat -ano` and parses its output. Step by step:

#### 1. Platform gate

```ts
if (process.platform !== "win32") {
  resolve({ found: false, reason: "unsupported-platform" });
  return;
}
```

Bail immediately on non-Windows.

#### 2. Spawn `netstat.exe -ano`

```ts
const buildNetstatBin = () =>
  join(
    process.env.SystemRoot ?? String.raw`C:\Windows`,
    "System32",
    "netstat.exe",
  );

let stdout = "";
const netstat = spawn(buildNetstatBin(), ["-ano"]);

netstat.stdout.on("data", (data: Buffer) => { stdout += data.toString(); });
```

`spawn` returns a `ChildProcess`. We resolve the **absolute path** to `netstat.exe` rather than calling it by bare name. Reason: a bare `spawn("netstat", ...)` resolves the binary against the current `PATH`, which an attacker (or a misconfigured user environment) could shadow with a malicious executable named `netstat`. Resolving via `process.env.SystemRoot` (with a hardcoded `C:\Windows` fallback) anchors the lookup to the actual Windows system directory.

Only stdout is accumulated — netstat's stderr is not needed for the parse path, and we already log the exit code on non-zero close (see step 4 below).

`-ano` on Windows asks netstat for **a**ll connections, **n**umeric (no name lookup), and process IDs (**o**wner). We don't want hostname/service resolution because it would slow netstat down and we only need the IP + port + PID.

#### 3. Spawn-failure path

```ts
netstat.on("error", (error) => {
  log.warn({ err: error, port }, "netstat spawn failed.");
  resolve({ found: false, reason: "no-pid" });
});
```

`"error"` fires if the OS couldn't spawn `netstat` at all (binary missing, EACCES, etc.). We log a warning and return `no-pid`. We collapse spawn-failure into `no-pid` because the caller's only useful next move is the same as if there were genuinely no listener — try the listen path again.

#### 4. Close handler — non-zero exit

```ts
netstat.on("close", (code) => {
  if (code !== 0) {
    log.warn({ code, port }, "netstat exited non-zero.");
    resolve({ found: false, reason: "no-pid" });
    return;
  }
  // ...
});
```

If `netstat` exits non-zero, we log the exit code and return `no-pid`.

#### 5. Parse the LISTENING row

```ts
const isListeningRow = (cols: readonly string[]): cols is ListeningRow =>
  cols.length >= 5 && cols[3] === "LISTENING";

const match = stdout.split("\n").find((row) => {
  const cols = row.trim().split(/\s+/);

  if (!isListeningRow(cols)) {
    return false;
  }

  return cols[1].endsWith(`:${port}`);
});
```

Windows `netstat -ano` LISTENING rows look like this:

```
  TCP    0.0.0.0:5173           0.0.0.0:0              LISTENING       12345
  TCP    [::]:5173              [::]:0                 LISTENING       12345
```

- Split each row on whitespace.
- A LISTENING row has at least 5 columns, with `LISTENING` at index 3 and the PID at the last column.
- We match by checking the local-address column (index 1) ends with `:<port>`. The `endsWith` is intentional — local addresses come in flavors like `0.0.0.0:5173`, `127.0.0.1:5173`, `[::]:5173`, and `[::1]:5173`. All of them end in `:5173`.
- `isListeningRow` is a **type guard**: its return type narrows the parameter to a tuple shape with `cols.length >= 5` and `cols[3] === "LISTENING"`. Inside the matcher we then read `cols[1]` directly, without optional chaining — the guard has already proven the column exists. The narrowed-tuple type is what makes that read safe.

#### 6. Extract the PID

```ts
const pid = match ? Number(match.trim().split(/\s+/).pop()) : Number.NaN;

if (Number.isFinite(pid) && pid > 0) {
  resolve({ found: true, pid });
  return;
}

resolve({ found: false, reason: "no-pid" });
```

Take the last whitespace-separated token of the matching row (that's the PID column for `-ano`), parse it as a number, and only accept it if it's a finite positive integer. Otherwise return `no-pid`.

### `killPortOwner`

```ts
const lookup = await findPidOnPort(port, log);

if (!lookup.found) {
  return { ok: false, reason: lookup.reason };
}

try {
  process.kill(lookup.pid, signal);
  return { ok: true };
} catch {
  return { ok: false, reason: "kill-threw" };
}
```

Two paths:

- If the PID lookup didn't find a listener, propagate the reason (`unsupported-platform` or `no-pid`).
- If we have a PID, call `process.kill(pid, signal)` and surface the outcome.

A few notes about `process.kill`:

- Despite the name, it doesn't always "kill" — it just **sends a signal**. The signal determines behavior. `SIGTERM` asks the target to terminate; the target can intercept it (on POSIX). On Windows, `process.kill(pid, "SIGTERM")` is unconditional — the target dies without running its shutdown handlers.
- It can throw if the PID doesn't exist, the caller lacks permission, or the OS otherwise refuses the request. The catch returns a `kill-threw` reason.

## Edge cases & gotchas

- **The PID is stale by the time we signal it**: between `netstat` returning and `process.kill` running, the process could have exited on its own. `process.kill` throws `ESRCH` for non-existent PIDs, which lands in the `kill-threw` branch. From the bootstrap module's perspective, the next listen attempt simply succeeds because the port is now free.
- **More than one process owns the port** (shouldn't happen for a single TCP port, but a layered scenario like a parent process spawning a child could produce more than one LISTENING row): `Array.find` returns the first match, so we only kill that one. The caller's next listen attempt either succeeds, or escalates again.
- **Windows `SIGTERM` is unconditional**: as noted, the target's `close-with-grace` handler does **not** get to run. That means in-flight requests get dropped abruptly. Prefer the cooperative HTTP path whenever it can apply.
- **No standard input/output buffering limits hit here**: `netstat -ano` output is small (kilobytes), well within Node's default child-process buffer limits.

## How it fits in

`killPortOwner` is the **last** step before abort in the port-claim chain. The sequence in `bootstrapServer`:

1. `tryListen` once. Success → done.
2. `requestCooperativeShutdown` over HTTP. If it 202s and the port frees within `COOPERATIVE_HANDOVER_TIMEOUT_MS` → done.
3. `killPortOwner(port, SIGTERM, app.log)`. If the kill returned `ok: false`, one last `tryListen` attempts the listen anyway (the port may have freed between calls).
4. If still occupied after `FORCE_SHUTDOWN_TIMEOUT_MS`, log an error and throw — the caller decides what to do.

The discriminated-union return is what makes the calling code easy to read — each failure mode gets its own diagnostic log line in the caller, instead of a single generic "kill failed" message.
