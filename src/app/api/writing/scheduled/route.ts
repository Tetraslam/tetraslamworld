import { timingSafeEqual } from "node:crypto";
import { invalidateWriting,writingResponse,writingService } from "@/lib/writing/server";
export const maxDuration=300;
export async function POST(request:Request){
  const secret=process.env.WRITING_SCHEDULER_SECRET;
  const actual=Buffer.from(request.headers.get("authorization")||""),expected=Buffer.from(`Bearer ${secret}`);
  if(!secret||actual.length!==expected.length||!timingSafeEqual(actual,expected))return new Response("Unauthorized",{status:403});
  return writingResponse(async()=>{const result=await writingService.publishDue();if(result.published)invalidateWriting();return result;});
}
