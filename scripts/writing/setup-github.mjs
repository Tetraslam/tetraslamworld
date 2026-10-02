// Local-only registration. Credentials stay in memory, 1Password, Vercel, or an
// encrypted recovery envelope. Never log a key or put one in a process argument.

import { spawnSync } from "node:child_process";
import {
  createCipheriv,
  createDecipheriv,
  createSign,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";

const root = "http://127.0.0.1:8931";
const directory = resolve("../tetraslam-writing/.runtime");
const cache = resolve(directory, "app-registration.enc");
let state = process.env.WRITING_SETUP_STATE || randomBytes(24).toString("hex"),
  app,
  itemId,
  busy = false;
function command(bin, args, input) {
  const options = { input, encoding: "utf8", timeout: 120_000 };
  // These CLIs detect a real pipe; Node's direct child stdin is a socket.
  const result =
    input !== undefined
      ? spawnSync(
          "bash",
          ["-o", "pipefail", "-c", 'cat | "$@"', "--", bin, ...args],
          options,
        )
      : spawnSync(bin, args, options);
  if (result.status !== 0)
    throw new Error(
      `${bin} failed (${result.status}). Credentials were not logged.`,
    );
  return result.stdout;
}
function encryptionKey(salt) {
  return Buffer.from(
    hkdfSync(
      "sha256",
      Buffer.from(
        command("opa", [
          "read",
          "op://Agents/TETRASLAM_WRITING_STORAGE/secret_access_key",
        ]).trim(),
      ),
      salt,
      Buffer.from("writing-registration-recovery-v1"),
      32,
    ),
  );
}
async function checkpoint() {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const iv = randomBytes(12),
    salt = randomBytes(16),
    cipher = createCipheriv("aes-256-gcm", encryptionKey(salt), iv);
  const bytes = Buffer.concat([
    cipher.update(JSON.stringify({ state, app, itemId })),
    cipher.final(),
  ]);
  await writeFile(
    cache,
    JSON.stringify({
      iv: iv.toString("base64"),
      salt: salt.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      data: bytes.toString("base64"),
    }),
    { mode: 0o600 },
  );
}
try {
  const data = JSON.parse(await readFile(cache, "utf8"));
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(Buffer.from(data.salt, "base64")),
    Buffer.from(data.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(data.tag, "base64"));
  const saved = JSON.parse(
    Buffer.concat([
      decipher.update(Buffer.from(data.data, "base64")),
      decipher.final(),
    ]).toString(),
  );
  ({ state, app, itemId } = saved);
  console.log("Recovered pending registration from encrypted storage.");
} catch (error) {
  if (error.code !== "ENOENT")
    throw new Error(
      "Could not decrypt pending registration; the envelope was preserved.",
    );
}
function saveVault(fields) {
  const item = JSON.stringify({
    title: "TETRASLAM_WRITING_GITHUB",
    category: "API_CREDENTIAL",
    fields: Object.entries(fields).map(([id, value]) => ({
      id,
      label: id,
      type:
        id.includes("key") || id.includes("secret") ? "CONCEALED" : "STRING",
      value: String(value),
    })),
  });
  const args = itemId
    ? ["item", "edit", itemId, "--vault", "Agents", "--format", "json", "-"]
    : ["item", "create", "-", "--vault", "Agents", "--format", "json"];
  const saved = JSON.parse(command("op", args, item));
  for (const [name, value] of Object.entries(fields))
    if (
      !saved.fields.some((f) => f.label === name && f.value === String(value))
    )
      throw new Error("1Password did not confirm all credential fields.");
  itemId = saved.id;
}
function jwt(id, pem) {
  const encode = (v) => Buffer.from(JSON.stringify(v)).toString("base64url"),
    now = Math.floor(Date.now() / 1000);
  const payload = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iat: now - 60, exp: now + 540, iss: String(id) })}`;
  return `${payload}.${createSign("RSA-SHA256").update(payload).sign(pem, "base64url")}`;
}
async function appRequest(path, init = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${jwt(app.id, app.pem)}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}.`);
  return response.json();
}
function setEnv(key, value) {
  for (const target of ["production", "preview"]) {
    const args = ["env", "add", key, target];
    if (target === "preview") args.push("feat/writing-studio");
    try {
      command("vercel", args, String(value));
    } catch {
      args[1] = "update";
      args.push("--yes");
      command("vercel", args, String(value));
    }
  }
}
function manifest() {
  return {
    name: "Tetraslam Writing Studio",
    url: "https://tetraslam.world",
    redirect_url: `${root}/callback`,
    setup_url: `${root}/installed?state=${state}`,
    hook_attributes: {
      url: "https://www.tetraslam.world/api/writing/webhook",
      active: true,
    },
    public: false,
    default_permissions: { contents: "write", metadata: "read" },
    default_events: ["push"],
  };
}
const escapeHtml = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
createServer(async (req, res) => {
  const url = new URL(req.url, root);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const page = (body) =>
    res.end(
      `<!doctype html><title>Writing studio setup</title><body style="font:18px system-ui;max-width:660px;margin:70px auto;padding:24px">${body}</body>`,
    );
  const install = () =>
    page(
      `<h1>Credentials saved</h1><p><a href="https://github.com/apps/${encodeURIComponent(app.slug)}/installations/new">Install on tetraslam-writing</a>. Choose only that repository.</p>`,
    );
  if (req.method === "GET" && url.pathname === "/recover")
    return page(
      `<h1>Finish the existing app</h1><p>From your GitHub App settings, copy its App ID and generate a private key. Select that downloaded PEM below; it stays on this machine and is stored in 1Password.</p><form id="form"><label>App ID <input name="appId" required inputmode="numeric"></label><p><input name="keyFile" type="file" accept=".pem" required></p><button>Save credentials</button></form><p id="status"></p><script>document.getElementById('form').onsubmit=async e=>{e.preventDefault();document.getElementById('status').textContent='saving securely…';const f=e.target;const response=await fetch('/recover?state=${state}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:f.elements.namedItem('appId').value,pem:await f.elements.namedItem('keyFile').files[0].text()})});document.open();document.write(await response.text());document.close();};</script>`,
    );
  if (url.pathname === "/")
    return app
      ? install()
      : page(
          `<h1>Connect your writing repository</h1><form method="post" action="https://github.com/settings/apps/new?state=${state}"><input type="hidden" name="manifest" value="${escapeHtml(JSON.stringify(manifest()))}"><button>Create GitHub App</button></form><p><a href="/recover">Finish an existing app instead</a></p>`,
        );
  // Existing apps retain their original setup URL. Installation callbacks are
  // instead verified against the registered app and owner through GitHub's API.
  if (
    url.pathname !== "/installed" &&
    url.searchParams.get("state") !== state
  ) {
    res.statusCode = 403;
    return page("Invalid setup state.");
  }
  if (busy) {
    res.statusCode = 409;
    return page("Setup is already processing.");
  }
  busy = true;
  try {
    if (url.pathname === "/recover" && req.method === "POST") {
      if (req.headers.origin !== root) throw new Error("Invalid origin.");
      let text = "";
      for await (const chunk of req) {
        text += chunk;
        if (text.length > 32_000) throw new Error("Key file is too large.");
      }
      const candidate = JSON.parse(text);
      if (!/^\d+$/.test(candidate.id) || typeof candidate.pem !== "string")
        throw new Error("Invalid app credentials.");
      app = { id: candidate.id, pem: candidate.pem };
      const info = await appRequest("/app");
      if (
        info.owner.login !== "Tetraslam" ||
        info.slug !== "tetraslam-writing-studio"
      )
        throw new Error("This key does not belong to the writing app.");
      app = {
        ...info,
        pem: candidate.pem,
        webhook_secret: randomBytes(32).toString("hex"),
      };
      await checkpoint();
      await appRequest("/app/hook/config", {
        method: "PATCH",
        body: JSON.stringify({
          url: "https://www.tetraslam.world/api/writing/webhook",
          content_type: "json",
          secret: app.webhook_secret,
        }),
      });
    } else if (url.pathname === "/callback") {
      const response = await fetch(
        `https://api.github.com/app-manifests/${encodeURIComponent(url.searchParams.get("code") || "")}/conversions`,
        { method: "POST", headers: { Accept: "application/vnd.github+json" } },
      );
      if (!response.ok)
        throw new Error(`GitHub registration returned ${response.status}.`);
      app = await response.json();
      await checkpoint();
    } else if (url.pathname !== "/resume" && url.pathname !== "/installed") {
      res.statusCode = 404;
      return page("Not found.");
    }
    if (!app?.pem) throw new Error("No pending app credentials.");
    const fields = {
      app_id: app.id,
      app_slug: app.slug,
      private_key: app.pem,
      webhook_secret: app.webhook_secret,
    };
    if (url.pathname === "/installed") {
      const id = url.searchParams.get("installation_id");
      if (!id || !/^\d+$/.test(id)) throw new Error("Missing installation ID.");
      const installation = await appRequest(`/app/installations/${id}`);
      if (installation.account.login !== "Tetraslam")
        throw new Error("Wrong account.");
      fields.installation_id = id;
      saveVault(fields);
      await checkpoint();
      for (const [key, value] of Object.entries({
        WRITING_GITHUB_APP_ID: app.id,
        WRITING_GITHUB_INSTALLATION_ID: id,
        WRITING_GITHUB_PRIVATE_KEY: app.pem,
        WRITING_WEBHOOK_SECRET: app.webhook_secret,
        WRITING_REPOSITORY: "Tetraslam/tetraslam-writing",
      }))
        setEnv(key, value);
      await rm(cache);
      console.log(
        "GitHub app connected; credentials verified in 1Password and configured in Vercel.",
      );
      return page("<h1>Connected</h1><p>You can close this tab.</p>");
    }
    saveVault(fields);
    await checkpoint();
    console.log("App credentials verified in 1Password.");
    return install();
  } catch (error) {
    res.statusCode = 500;
    console.log("Setup paused:", error.message);
    return page(
      `<h1>Setup paused</h1><p>${escapeHtml(error.message)}</p><p><a href="/resume?state=${state}">Retry saving the preserved registration</a></p>`,
    );
  } finally {
    busy = false;
  }
}).listen(8931, "127.0.0.1", () => console.log(`Setup: ${root}`));
