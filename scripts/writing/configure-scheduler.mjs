import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

function run(bin, args, input) {
  const options = { input, encoding: "utf8", timeout: 120000 };
  const r =
    input === undefined
      ? spawnSync(bin, args, options)
      : spawnSync(
          "bash",
          ["-o", "pipefail", "-c", 'cat | "$@"', "--", bin, ...args],
          options,
        );
  if (r.status !== 0)
    throw new Error(`${bin} failed; no secret values logged.`);
  return r.stdout;
}
const item = JSON.parse(
  run("opa", [
    "item",
    "get",
    "TETRASLAM_WRITING_GITHUB",
    "--vault",
    "Agents",
    "--format",
    "json",
  ]),
);
let field = item.fields.find((f) => f.label === "scheduler_secret");
if (!field) {
  field = {
    id: "scheduler_secret",
    label: "scheduler_secret",
    type: "CONCEALED",
    value: randomBytes(32).toString("hex"),
  };
  item.fields.push(field);
  const saved = JSON.parse(
    run(
      "op",
      ["item", "edit", item.id, "--vault", "Agents", "--format", "json", "-"],
      JSON.stringify(item),
    ),
  );
  if (
    !saved.fields.some(
      (f) => f.label === field.label && f.value === field.value,
    )
  )
    throw new Error("Secret was not verified in the vault.");
}
for (const target of ["production", "preview"]) {
  const args = ["env", "add", "WRITING_SCHEDULER_SECRET", target];
  if (target === "preview") args.push("feat/writing-studio");
  try {
    run("vercel", args, field.value);
  } catch {
    args[1] = "update";
    args.push("--yes");
    run("vercel", args, field.value);
  }
}
run(
  "mise",
  [
    "exec",
    "node@lts",
    "--",
    "corepack",
    "pnpm",
    "exec",
    "convex",
    "env",
    "set",
    "WRITING_SCHEDULER_SECRET",
  ],
  field.value,
);
if (process.argv.includes("--activate"))
  run(
    "mise",
    [
      "exec",
      "node@lts",
      "--",
      "corepack",
      "pnpm",
      "exec",
      "convex",
      "env",
      "set",
      "WRITING_PUBLICATION_ENDPOINT",
    ],
    "https://www.tetraslam.world/api/writing/scheduled",
  );
console.log(
  `Scheduler credentials configured; ${process.argv.includes("--activate") ? "production worker enabled" : "worker remains inactive until cutover"}.`,
);
