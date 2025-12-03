import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const storageId = searchParams.get("id");

	if (!storageId) {
		return NextResponse.json({ error: "Missing storage ID" }, { status: 400 });
	}

	try {
		const url = await convex.query(api.files.getUrl, {
			storageId: storageId as Id<"_storage">,
		});

		return NextResponse.json({ url });
	} catch (error) {
		console.error("Error getting storage URL:", error);
		return NextResponse.json({ error: "Failed to get URL" }, { status: 500 });
	}
}
