import { z } from "zod";
import { assetIds, emptyWritingIndex, parsePost, postSchema, postSummary, serializePost, type WritingAsset, type WritingEntry, type WritingIndex, type WritingPost, WRITING_LIMITS, writingId } from "../../../shared/writing";
import { digest, type GitSnapshot, type WritingGit, WritingError } from "./git";

const indexPath="writing/index.json";
const draftPath=(id:string)=>`writing/drafts/${writingId.parse(id)}.md`;
const statePath=(id:string)=>`writing/state/${writingId.parse(id)}.json`;
const releasePath=(id:string,revision:string)=>`writing/releases/${id}/${revision}.md`;
const json=(value:unknown)=>JSON.stringify(value,null,2)+"\n";
export const operationSchema=z.object({id:writingId,operationId:z.string().uuid(),expectedRevision:z.string().nullable()});
type Operation=z.infer<typeof operationSchema>;
type Receipt={operationId:string;hash:string;revision:string;commit?:string};
type State={receipts:Receipt[]};
type Loaded={snapshot:GitSnapshot;index:WritingIndex};
export class WritingService {
  constructor(readonly git:WritingGit,private clock:()=>Date=()=>new Date()){}
  async load():Promise<Loaded>{
    const snapshot=await this.git.snapshot();const raw=await this.git.read(indexPath,snapshot.head);
    const index:WritingIndex=raw?JSON.parse(raw):emptyWritingIndex();
    if(index.schema!==1||!index.entries||!index.assets)throw new WritingError("INVALID_INDEX","Unsupported writing index.",503);
    return {snapshot,index};
  }
  async readDraft(id:string){
    const {snapshot,index}=await this.load();const source=await this.git.read(draftPath(id),snapshot.head);
    if(!source)throw new WritingError("NOT_FOUND","That draft does not exist.",404);
    return {post:parsePost(source),revision:digest(source),entry:index.entries[id],head:snapshot.head};
  }
  async list(query=""){
    const {snapshot,index}=await this.load();const entries=Object.values(index.entries).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    if(!query.trim())return entries;
    const needle=query.trim().toLocaleLowerCase();const matches:WritingEntry[]=[];
    // Read in small batches; a search never starts thousands of API requests.
    for(let offset=0;offset<entries.length;offset+=8){
      await Promise.all(entries.slice(offset,offset+8).map(async entry=>{
        if(JSON.stringify(entry.draft).toLocaleLowerCase().includes(needle)){matches.push(entry);return;}
        const source=await this.git.read(draftPath(entry.id),snapshot.head);
        if(source?.toLocaleLowerCase().includes(needle))matches.push(entry);
      }));
    }
    return matches.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  }
  async save(input:Operation & {post:WritingPost}){
    operationSchema.parse(input);const post=postSchema.parse(input.post);
    if(post.id!==input.id)throw new WritingError("INVALID_ID","Post identity cannot change.");
    const source=serializePost(post),revision=digest(source),hash=digest(json({action:"save",id:input.id,post}));
    return this.write(input,hash,async ({snapshot,index},state)=>{
      const current=await this.git.read(draftPath(input.id),snapshot.head);
      if((current?digest(current):null)!==input.expectedRevision)throw new WritingError("CONFLICT","This draft changed in another session. Your local copy is retained.",409);
      const old=index.entries[input.id];
      if(old && parsePost(current||"").commentKey!==post.commentKey)throw new WritingError("IMMUTABLE_IDENTITY","The comment identity cannot change.");
      if(!old&&Object.keys(index.entries).length>=WRITING_LIMITS.posts)throw new WritingError("LIMIT","The writing collection is full.");
      const updatedAt=this.clock().toISOString();
      index.entries[input.id]={...old,id:input.id,draft:postSummary(post),draftRevision:revision,updatedAt,published:old?.published??null,schedule:old?.schedule??null,aliases:old?.aliases??[]};
      state.receipts.push({operationId:input.operationId,hash,revision});
      return {files:{[draftPath(input.id)]:source},revision,message:`Draft: ${input.id}`,updatedAt};
    });
  }
  private async write(input:Operation,hash:string,run:(loaded:Loaded,state:State)=>Promise<{files:Record<string,string|null>;revision:string;message:string;updatedAt?:string}>){
    for(let attempt=0;attempt<4;attempt++){
      const loaded=await this.load();const stateRaw=await this.git.read(statePath(input.id),loaded.snapshot.head);
      const state:State=stateRaw?JSON.parse(stateRaw):{receipts:[]};
      const receipt=state.receipts.find(row=>row.operationId===input.operationId);
      if(receipt){if(receipt.hash!==hash)throw new WritingError("INVALID_RETRY","This operation ID belongs to different content.",409);return {revision:receipt.revision,currentRevision:loaded.index.entries[input.id]?.draftRevision,head:loaded.snapshot.head,replayed:true};}
      const result=await run(loaded,state);
      if(!state.receipts.some(row=>row.operationId===input.operationId))state.receipts.push({operationId:input.operationId,hash,revision:result.revision});
      state.receipts=state.receipts.slice(-32);
      try {
        const head=await this.git.commit(loaded.snapshot,{...result.files,[indexPath]:json(loaded.index),[statePath(input.id)]:json(state)},result.message);
        return {revision:result.revision,currentRevision:loaded.index.entries[input.id]?.draftRevision,head,replayed:false};
      }catch(error){if(error instanceof WritingError&&error.code==="GIT_CONFLICT"&&attempt<3)continue;throw error;}
    }
    throw new WritingError("CONFLICT","The repository changed repeatedly. Your draft is retained.",409);
  }
  private validateRelease(post:WritingPost,index:WritingIndex,id:string){
    if(post.kind==="essay"&&!post.title.trim())throw new WritingError("TITLE_REQUIRED","Give this essay a title, or make it a short note.");
    if(!post.body.trim())throw new WritingError("EMPTY_POST","Add something to the post before publishing.");
    for(const other of Object.values(index.entries))if(other.id!==id&&(other.published?.meta.slug===post.slug||other.aliases.includes(post.slug)))throw new WritingError("SLUG_TAKEN","Another post already uses this address.",409);
    const assets=assetIds(post);
    if(assets.length>WRITING_LIMITS.assets)throw new WritingError("LIMIT","A post can contain up to 300 assets.");
    for(const asset of assets)if(!index.assets[asset]?.backup?.assetId)throw new WritingError("MEDIA_NOT_READY","An original media file is still uploading or awaiting its backup.");
    return assets;
  }
  async publish(input:Operation & {expectedPublication:string|null;at?:string}){
    operationSchema.parse(input);const hash=digest(json({action:"publish",...input,operationId:undefined}));
    return this.write(input,hash,async ({snapshot,index})=>{
      const entry=index.entries[input.id];if(!entry)throw new WritingError("NOT_FOUND","Draft not found.",404);
      const source=await this.git.read(draftPath(input.id),snapshot.head);if(!source)throw new WritingError("NOT_FOUND","Draft not found.",404);
      const revision=digest(source);
      if(revision!==input.expectedRevision||(entry.published?.revision??null)!==input.expectedPublication)throw new WritingError("CONFLICT","The draft or published version changed. Review the latest version before publishing.",409);
      const post=parsePost(source);
      post.date ||= entry.firstPublishedAt || input.at || this.clock().toISOString();
      const release=serializePost(post),releaseRevision=digest(release),assets=this.validateRelease(post,index,input.id),path=releasePath(input.id,releaseRevision);
      if(input.at){
        const at=new Date(input.at);if(!Number.isFinite(at.getTime())||at.getTime()<=this.clock().getTime())throw new WritingError("INVALID_DATE","Choose a future publication time.");
        entry.schedule={id:input.operationId,at:at.toISOString(),revision:releaseRevision,path,expectedPublication:input.expectedPublication};
      }else{
        const oldSlug=entry.published?.meta.slug;
        if(oldSlug&&oldSlug!==post.slug)entry.aliases=[...new Set([...entry.aliases,oldSlug])];
        entry.firstPublishedAt ||= post.date;
        entry.published={revision:releaseRevision,path,meta:postSummary(post),releasedAt:this.clock().toISOString(),assets};entry.schedule=null;
      }
      return {files:{[path]:release},revision:releaseRevision,message:`${input.at?"Schedule":"Publish"}: ${input.id}`};
    });
  }
  async unpublish(input:Operation & {expectedPublication:string|null}){
    const hash=digest(json({action:"unpublish",...input,operationId:undefined}));
    return this.write(operationSchema.parse(input),hash,async({index})=>{
      const entry=index.entries[input.id];if(!entry)throw new WritingError("NOT_FOUND","Post not found.",404);
      if((entry.published?.revision??null)!==input.expectedPublication)throw new WritingError("CONFLICT","The published post changed. Reload before unpublishing.",409);
      if(entry.published)entry.aliases=[...new Set([...entry.aliases,entry.published.meta.slug])];
      entry.published=null;entry.schedule=null;
      return {files:{},revision:entry.draftRevision,message:`Unpublish: ${input.id}`};
    });
  }
  async cancelSchedule(input:Operation & {scheduleId:string}){
    return this.write(operationSchema.parse(input),digest(json({action:"cancel",...input,operationId:undefined})),async({index})=>{
      const entry=index.entries[input.id];if(!entry)throw new WritingError("NOT_FOUND","Post not found.",404);
      if(entry.schedule?.id!==input.scheduleId)throw new WritingError("CONFLICT","The scheduled publication changed.",409);
      entry.schedule=null;return {files:{},revision:entry.draftRevision,message:`Cancel schedule: ${input.id}`};
    });
  }
  async publishDue(){
    const initial=await this.load();if(!initial.index.migration.verified)return {published:0,waitingForMigration:true};
    let published=0;
    for(const original of Object.values(initial.index.entries)){
      const planned=original.schedule;if(!planned||Date.parse(planned.at)>this.clock().getTime())continue;
      for(let attempt=0;attempt<4;attempt++){
        const loaded=await this.load(),entry=loaded.index.entries[original.id];
        if(entry?.schedule?.id!==planned.id)break;
        if((entry.published?.revision??null)!==planned.expectedPublication)break;
        const source=await this.git.read(planned.path,loaded.snapshot.head);
        if(!source||digest(source)!==planned.revision)throw new WritingError("INVALID_SNAPSHOT","Scheduled snapshot is missing or changed.",503);
        const post=parsePost(source),assets=this.validateRelease(post,loaded.index,entry.id);
        const oldSlug=entry.published?.meta.slug;if(oldSlug&&oldSlug!==post.slug)entry.aliases=[...new Set([...entry.aliases,oldSlug])];
        entry.firstPublishedAt ||= post.date;
        entry.published={revision:planned.revision,path:planned.path,meta:postSummary(post),releasedAt:this.clock().toISOString(),assets};entry.schedule=null;
        try{await this.git.commit(loaded.snapshot,{[indexPath]:json(loaded.index)},`Scheduled publication: ${entry.id}`);published++;break;}catch(error){if(error instanceof WritingError&&error.code==="GIT_CONFLICT"&&attempt<3)continue;throw error;}
      }
    }
    return {published};
  }
  async history(id:string){writingId.parse(id);return this.git.history(draftPath(id));}
  async revision(id:string,commit:string){
    writingId.parse(id);if(!/^[a-f0-9]{40}$/.test(commit))throw new WritingError("INVALID_REVISION","Invalid history revision.");
    const raw=await this.git.read(draftPath(id),commit);if(!raw)throw new WritingError("NOT_FOUND","Revision not found.",404);return {post:parsePost(raw),revision:digest(raw)};
  }
  async registerAsset(asset:WritingAsset){
    if(!/^[a-f0-9]{64}$/.test(asset.id)||asset.id!==asset.sha256||asset.backup.digest!==`sha256:${asset.sha256}`)throw new WritingError("INVALID_ASSET","Media verification failed.");
    for(let n=0;n<4;n++){
      const loaded=await this.load();if(loaded.index.assets[asset.id])return loaded.index.assets[asset.id];
      loaded.index.assets[asset.id]=asset;
      try{await this.git.commit(loaded.snapshot,{[indexPath]:json(loaded.index)},`Backed-up original: ${asset.id}`);return asset;}catch(error){if(error instanceof WritingError&&error.code==="GIT_CONFLICT"&&n<3)continue;throw error;}
    }
    throw new WritingError("CONFLICT","Please retry registering this upload.",409);
  }
}
