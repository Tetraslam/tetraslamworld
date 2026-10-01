import { z } from "zod";
import { completeUpload,prepareUpload,uploadSchema } from "@/lib/writing/storage";
import { writingAdmin,writingBody,writingResponse,writingService } from "@/lib/writing/server";
export const maxDuration=300;
export async function POST(request:Request){return writingResponse(async()=>{
  await writingAdmin(request);const {uploadId,...body}=await writingBody(request);
  const intent=uploadSchema.parse(body);
  return uploadId?completeUpload(writingService,{...intent,uploadId:z.string().uuid().parse(uploadId)}):prepareUpload(intent);
});}
