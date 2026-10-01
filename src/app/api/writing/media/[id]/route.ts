import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";
import { writingService } from "@/lib/writing/server";
import { originalUrl } from "@/lib/writing/storage";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;if(!/^[a-f0-9]{64}$/.test(id))return new Response("Not found",{status:404});
  const {index}=await writingService.load();const asset=index.assets[id];
  const released=index.migration.verified&&process.env.WRITING_SOURCE==="git"&&Object.values(index.entries).some(entry=>entry.published?.assets.includes(id));
  if(!asset||(!released&&!isAdminUser((await auth()).userId)))return new Response("Not found",{status:404,headers:{"Cache-Control":"no-store"}});
  return new Response(null,{status:307,headers:{Location:await originalUrl(asset),"Cache-Control":released?"public, max-age=60":"private, no-store"}});
}
