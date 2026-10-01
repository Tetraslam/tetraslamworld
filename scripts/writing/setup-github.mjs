// One-time local GitHub App registration. Credentials travel only in memory and
// stdin to 1Password/Vercel; this server never prints or writes them to disk.
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

const port = 8931;
const state = process.env.WRITING_SETUP_STATE || randomBytes(24).toString("hex");
const root = `http://127.0.0.1:${port}`;
let app;
let itemId;
let busy = false;
function command(bin, args, input) {
  const result = input !== undefined
    ? spawnSync("bash", ["-o", "pipefail", "-c", 'cat | "$@"', "--", bin, ...args], { input, encoding: "utf8", timeout: 120_000 })
    : spawnSync(bin, args, { input, encoding: "utf8", timeout: 120_000 });
  if (result.status !== 0) throw new Error(`${bin} failed (exit ${result.status}); credentials were not logged.`);
  return result.stdout;
}
function saveVault(fields) {
  const item = JSON.stringify({ title: "TETRASLAM_WRITING_GITHUB", category: "API_CREDENTIAL", fields: Object.entries(fields).map(([id, value]) => ({ id, label:id, type:id.includes("key") || id.includes("secret") ? "CONCEALED" : "STRING", value:String(value) })) });
  const result = itemId
    ? command("op", ["item", "edit", itemId, "--vault", "Agents", "--format", "json", "-"], item)
    : command("op", ["item", "create", "-", "--category", "API Credential", "--title", "TETRASLAM_WRITING_GITHUB", "--vault", "Agents", "--format", "json"], item);
  itemId = JSON.parse(result).id;
}
function setEnv(key, value) {
  for (const target of ["production", "preview"]) {
    const args=["env","add",key,target];
    if(target==="preview")args.push("feat/writing-studio");
    command("vercel", args, String(value));
  }
}
const manifest = {
  name: "Tetraslam Writing Studio",
  url: "https://tetraslam.world",
  redirect_url: `${root}/callback`,
  setup_url: `${root}/installed?state=${state}`,
  hook_attributes: { url:"https://www.tetraslam.world/api/writing/webhook", active:true },
  public:false,
  default_permissions:{contents:"write",metadata:"read"},
  default_events:["push"],
};
createServer(async (req,res)=>{
  const url=new URL(req.url,root);
  res.setHeader("Cache-Control","no-store");
  res.setHeader("Content-Type","text/html; charset=utf-8");
  const page=body=>res.end(`<!doctype html><title>Writing studio setup</title><body style="font:18px system-ui;max-width:640px;margin:80px auto;padding:24px">${body}</body>`);
  if(url.pathname==="/") {
    const data=JSON.stringify(manifest).replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;");
    return page(`<h1>Connect your private writing repo</h1><p>Create the private app, then install it on <strong>tetraslam-writing only</strong>.</p><form method="post" action="https://github.com/settings/apps/new?state=${state}"><input type="hidden" name="manifest" value="${data}"><button style="padding:12px 20px">Create GitHub App</button></form>`);
  }
  if(url.searchParams.get("state")!==state){res.statusCode=403;return page("Invalid setup state.");}
  if(busy){res.statusCode=409;return page("Setup is already processing. Please wait.");}
  busy=true;
  try {
    if(url.pathname==="/callback") {
      const code=url.searchParams.get("code");
      if(!code)throw new Error("Missing registration code.");
      const response=await fetch(`https://api.github.com/app-manifests/${encodeURIComponent(code)}/conversions`,{method:"POST",headers:{Accept:"application/vnd.github+json"}});
      if(!response.ok)throw new Error(`GitHub registration failed (${response.status}).`);
      app=await response.json();
      saveVault({app_id:app.id,private_key:app.pem,webhook_secret:app.webhook_secret});
      console.log("App registered; credentials saved to 1Password. Waiting for installation.");
      return page(`<h1>App registered</h1><p>Credentials are in 1Password.</p><p><a href="https://github.com/apps/${encodeURIComponent(app.slug)}/installations/new">Install on tetraslam-writing</a>. Choose only that repository.</p>`);
    }
    if(url.pathname==="/installed" && app) {
      const installation=url.searchParams.get("installation_id");
      if(!installation || !/^\d+$/.test(installation))throw new Error("Missing installation ID.");
      saveVault({app_id:app.id,installation_id:installation,private_key:app.pem,webhook_secret:app.webhook_secret});
      for(const [key,value] of Object.entries({WRITING_GITHUB_APP_ID:app.id,WRITING_GITHUB_INSTALLATION_ID:installation,WRITING_GITHUB_PRIVATE_KEY:app.pem,WRITING_WEBHOOK_SECRET:app.webhook_secret,WRITING_REPOSITORY:"Tetraslam/tetraslam-writing"}))setEnv(key,value);
      console.log("GitHub App installed. Writing credentials configured in Vercel and 1Password.");
      return page("<h1>Connected</h1><p>The writing app is configured. You can close this tab.</p>");
    }
    res.statusCode=404;page("Not found.");
  }catch(error){res.statusCode=500;page(`<h1>Setup paused</h1><p>${String(error.message).replaceAll("<","&lt;")}</p><p>Tell the agent; saved credentials remain in 1Password.</p>`);console.log("Setup needs attention:",error.message);}
  finally{busy=false;}
}).listen(port,"127.0.0.1",()=>console.log(`GitHub App setup: ${root}`));
