import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(scriptDir, "..");
const repoRoot = resolve(frontendDir, "..");

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
