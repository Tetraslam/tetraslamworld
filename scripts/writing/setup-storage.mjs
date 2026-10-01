import { spawnSync } from "node:child_process";
const bucket="tetraslam-writing-originals";
function run(bin,args,input){const options={input,encoding:"utf8",timeout:120_000};const r=input!==undefined?spawnSync("bash",["-o","pipefail","-c",'cat | "$@"',"--",bin,...args],options):spawnSync(bin,args,options);if(r.status!==0){let error=r.stderr;const redact=v=>{if(typeof v==="string"){error=error.replaceAll(v,"[redacted]").replaceAll(JSON.stringify(v).slice(1,-1),"[redacted]");}else if(v&&typeof v==="object")Object.values(v).forEach(redact);};if(input){try{redact(JSON.parse(input));}catch{redact(input);}}throw new Error(`${bin} failed (${r.status}): ${error}`);}return r.stdout;}
const existing=JSON.parse(run("tigris",["access-keys","list","--json"])).items.find(key=>key.name==="writing-studio-originals");
if(existing)throw new Error("The writing storage key already exists. Configure from 1Password; do not rotate a live key.");
const credential=JSON.parse(run("tigris",["access-keys","create","writing-studio-originals","--json","--yes"]));
function find(value,names){if(!value||typeof value!=="object")return;for(const [key,v] of Object.entries(value)){if(names.includes(key.toLowerCase().replaceAll("_","").replaceAll("-",""))&&typeof v==="string")return v;}for(const v of Object.values(value)){const result=find(v,names);if(result)return result;}}
const id=find(credential,["accesskeyid","keyid","id"]),secret=find(credential,["secretaccesskey","accesssecret","secretkey","secret"]);
const fields={credential:JSON.stringify(credential),...(id?{access_key_id:id}:{}),...(secret?{secret_access_key:secret}:{}),bucket};
const vault=JSON.stringify({title:"TETRASLAM_WRITING_STORAGE",category:"API_CREDENTIAL",fields:Object.entries(fields).map(([id,value])=>({id,label:id,type:id==="bucket"?"STRING":"CONCEALED",value}))});
run("op",["item","create","-","--category","API Credential","--title","TETRASLAM_WRITING_STORAGE","--vault","Agents","--format","json"],vault);
if(!id||!secret)throw new Error("Credentials saved to 1Password; CLI response needs field mapping before configuration.");
run("tigris",["access-keys","assign",id,"--bucket",bucket,"--role","Editor","--json"]);
for(const [name,value] of Object.entries({WRITING_S3_ACCESS_KEY_ID:id,WRITING_S3_SECRET_ACCESS_KEY:secret,WRITING_S3_BUCKET:bucket,WRITING_S3_ENDPOINT:"https://t3.storage.dev"})){
  for(const target of ["production","preview"]){const args=["env","add",name,target];if(target==="preview")args.push("feat/writing-studio");run("vercel",args,value);}
}
console.log("Private media bucket credentials saved to 1Password and configured in Vercel.");
