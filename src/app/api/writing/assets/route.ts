import {
  writingAdmin,
  writingResponse,
  writingService,
} from "@/lib/writing/server";
export async function GET() {
  return writingResponse(async () => {
    await writingAdmin();
    return {
      assets: Object.values((await writingService.load()).index.assets).map(
        ({ id, filename, contentType, size }) => ({
          id,
          filename,
          contentType,
          size,
        }),
      ),
    };
  });
}
