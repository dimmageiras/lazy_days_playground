# Stress-testing the suite

The suite runs under randomised order and a reused, non-isolated worker context ([ADR-0005](../adr/0005-test-runner-worker-model.md)). Most flakes and cross-test pollution surface only on a particular interleaving, so a single green run proves little. To flush them out, repeat the suite many times under a fresh shuffle each run and stop on the first failure or probe signal.

Both loops below drive **`pnpm test:pollution`**, which runs each project as its own process ([ADR-0023](../adr/0023-test-project-process-isolation.md)) with the pollution probe and `--bail` enabled, and repeats it. They are identical except for how much they print — pick by whether you are watching or leaving it unattended.

> Run from the repo root, in PowerShell. `test:pollution` writes each project's full output to a log file rather than the terminal (the probe is file-based), so both loops preserve a per-run copy under `logs/runs/` for inspection.

## With per-run output

Prints the pass counts every run; on the first failing run it dumps the failing lines and any probe markers to the terminal, then stops. Use this when watching interactively.

```powershell
$runs = 50
New-Item -ItemType Directory -Force -Path logs/runs | Out-Null
for ($i = 1; $i -le $runs; $i++) {
  pnpm test:pollution *> $null
  $ec = $LASTEXITCODE

  Copy-Item logs/unit-tests/pollution-probe.server.log "logs/runs/run-$i.server.log" -ErrorAction SilentlyContinue
  Copy-Item logs/unit-tests/pollution-probe.shared.log "logs/runs/run-$i.shared.log" -ErrorAction SilentlyContinue

  $logs = @("logs/runs/run-$i.server.log", "logs/runs/run-$i.shared.log")
  $markers = @(Select-String -Path $logs -Pattern '\[LEAK\]|\[RISK\]|\[WARN\]' -ErrorAction SilentlyContinue)
  $summary = (Select-String -Path $logs -Pattern '^\s+Tests\s' -ErrorAction SilentlyContinue |
    ForEach-Object { $_.Line.Trim() }) -join '  |  '

  if ($ec -ne 0 -or $markers.Count -gt 0) {
    Write-Host "===== FAILED ON RUN $i (exit=$ec, markers=$($markers.Count)) =====" -ForegroundColor Red
    Select-String -Path $logs -Pattern 'FAIL|failed|AssertionError|\[LEAK\]|\[RISK\]|\[WARN\]' -ErrorAction SilentlyContinue |
      ForEach-Object { Write-Host "  $(Split-Path $_.Path -Leaf): $($_.Line.Trim())" -ForegroundColor Yellow }
    Write-Host "Full logs: logs/runs/run-$i.server.log , logs/runs/run-$i.shared.log"
    break
  }

  Write-Host "run $i / $runs clean  |  $summary" -ForegroundColor Green
}
```

## Without per-run output

One line per run and the failure banner on the first bad run — nothing else on the terminal. Use this when leaving it unattended; open the per-run logs afterwards.

```powershell
$runs = 50
New-Item -ItemType Directory -Force -Path logs/runs | Out-Null
for ($i = 1; $i -le $runs; $i++) {
  pnpm test:pollution *> $null
  $ec = $LASTEXITCODE

  Copy-Item logs/unit-tests/pollution-probe.server.log "logs/runs/run-$i.server.log" -ErrorAction SilentlyContinue
  Copy-Item logs/unit-tests/pollution-probe.shared.log "logs/runs/run-$i.shared.log" -ErrorAction SilentlyContinue

  $markers = (Select-String -Path "logs/runs/run-$i.*.log" -Pattern '\[LEAK\]|\[RISK\]|\[WARN\]' -ErrorAction SilentlyContinue).Count
  if ($ec -ne 0 -or $markers -gt 0) {
    Write-Host "===== FAILED ON RUN $i (exit=$ec, probe markers=$markers) ====="
    break
  }
  Write-Host "run $i / $runs clean"
}
```

## Reading the results

- **Per-run logs** land in `logs/runs/run-<n>.server.log` and `logs/runs/run-<n>.shared.log` — the full vitest + probe output for that run.
- **A failing run** trips a non-zero exit code (vitest stops early on `--bail`).
- **A `[LEAK]` / `[RISK]` / `[WARN]` line** is a probe signal. The probe is diagnostic — it does **not** fail the exit code — so both loops scan for markers separately. Marker meanings are in the [testing README](./README.md#debug-and-diagnostics).
- **Why `pnpm test:pollution` and not a single runner invocation over both projects:** running the projects co-resident in one process makes shared module mocks unreliable under `isolate: false` — see [ADR-0023](../adr/0023-test-project-process-isolation.md).

## Watching a single run live

For one run streamed straight to the terminal (no probe, no `--bail`), use `pnpm test` — it does not redirect to files, so vitest reports inline.
