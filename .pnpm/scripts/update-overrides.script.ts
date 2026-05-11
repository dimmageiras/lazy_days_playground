import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { run as runNCU } from "npm-check-updates";
import { parseDocument } from "yaml";

const isObject = (item: unknown): item is Record<PropertyKey, unknown> => {
  return typeof item === "object" && item != null && !Array.isArray(item);
};

const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

const pnpmWorkspacePath = path.resolve(process.cwd(), "pnpm-workspace.yaml");
const raw = await fs.readFile(pnpmWorkspacePath, "utf8");
const workspaceDoc = parseDocument(raw);
const workspaceJs: unknown = workspaceDoc.toJS();
const overrides = isObject(workspaceJs) ? workspaceJs.overrides : undefined;

if (!isObject(overrides) || Object.keys(overrides).length === 0) {
  console.info("No overrides block found in pnpm-workspace.yaml.");
  process.exit(0);
}

const pinnedVersionOverrides = Object.fromEntries(
  Object.entries(overrides).filter(([, value]) => isString(value)),
);

if (Object.keys(pinnedVersionOverrides).length === 0) {
  console.info("No string-based overrides found; skipping.");
  process.exit(0);
}

try {
  const ncuResult = await runNCU({
    jsonUpgraded: true,
    packageData: JSON.stringify({ dependencies: pinnedVersionOverrides }),
    packageManager: "pnpm",
    pre: true,
    silent: true,
    target: "greatest",
    upgrade: true,
  });

  if (!isObject(ncuResult)) {
    throw new Error(
      `runNCU returned a non-plain-object value (got ${typeof ncuResult}); expected a map of package names to upgraded versions.`,
    );
  }

  let updatedOverrideCount = 0;

  for (const [packageName, nextVersion] of Object.entries(ncuResult)) {
    const currentPinnedVersion = Reflect.get(overrides, packageName);

    if (currentPinnedVersion !== nextVersion) {
      workspaceDoc.setIn(["overrides", packageName], nextVersion);
      updatedOverrideCount += 1;
      console.info(`${packageName}: ${currentPinnedVersion} -> ${nextVersion}`);
    }
  }

  if (updatedOverrideCount === 0) {
    console.info("Overrides are already up to date for supported entries.");
  } else {
    await fs.writeFile(pnpmWorkspacePath, workspaceDoc.toString(), "utf8");
    console.info(
      `Updated ${updatedOverrideCount} override${updatedOverrideCount === 1 ? "" : "s"} in pnpm-workspace.yaml.`,
    );
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`update-overrides failed: ${message}`);
  process.exit(1);
}

process.exit(0);
