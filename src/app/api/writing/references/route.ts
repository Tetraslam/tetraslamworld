import { fetchQuery } from "convex/nextjs";
import {
  writingAdmin,
  writingResponse,
  writingService,
} from "@/lib/writing/server";
import { api } from "../../../../../convex/_generated/api";
import { tasteKey } from "../../../../../shared/taste";
export async function GET() {
  return writingResponse(async () => {
    await writingAdmin();
    const [taste, work, travel, writing] = await Promise.all([
      fetchQuery(api.taste.list, {}),
      fetchQuery(api.work.list, {}),
      fetchQuery(api.travel.list, {}),
      writingService.load(),
    ]);
    return {
      items: [
        ...taste.map((item) => ({
          label: `taste / ${item.title}`,
          href: `/taste/${tasteKey(item)}`,
        })),
        ...work.map((item) => ({
          label: `work / ${item.title}`,
          href: `/work#${item._id}`,
        })),
        ...travel.map((item) => ({
          label: `travel / ${item.location}`,
          href: `/travel?place=${item._id}`,
        })),
        ...Object.values(writing.index.entries).flatMap((item) =>
          item.published
            ? [
                {
                  label: `writing / ${item.published.meta.title || item.published.meta.slug}`,
                  href: `/blog/${item.published.meta.slug}`,
                },
              ]
            : [],
        ),
      ],
    };
  });
}
