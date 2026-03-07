import { execFileSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(scriptDir, "..");
const repoRoot = resolve(frontendDir, "..");
const DEV_PORT = "3000";

const killExistingDevListeners = () => {
  try {
    const output = execFileSync("lsof", ["-ti", `tcp:${DEV_PORT}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();

    if (!output) {
      return;
    }

    output
      .split("\n")
      .map((pid) => Number.parseInt(pid, 10))
      .filter((pid) => Number.isFinite(pid) && pid !== process.pid)
      .forEach((pid) => {
        try {
          process.kill(pid, "SIGTERM");
        } catch {
          // Ignore stale PIDs.
        }
      });
  } catch {
    // Ignore if lsof is unavailable or there are no listeners.
  }
};

killExistingDevListeners();

for (const dir of [join(frontendDir, ".next"), join(repoRoot, ".next")]) {
  rmSync(dir, { recursive: true, force: true });
}

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const args = [nextBin, "dev", ...process.argv.slice(2)];

const child = spawn(process.execPath, args, {
  cwd: frontendDir,
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
