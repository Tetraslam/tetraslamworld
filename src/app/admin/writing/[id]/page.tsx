import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { WritingStudio } from "@/components/writing/studio";
import { writingId } from "../../../../../shared/writing";
export default async function DraftPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string; new?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (id === "new")
    redirect(
      `/admin/writing/${randomUUID()}?new=${query.kind === "note" ? "note" : "essay"}`,
    );
  if (!writingId.safeParse(id).success) notFound();
  return (
    <WritingStudio
      id={id}
      newKind={
        query.new === "note"
          ? "note"
          : query.new === "essay"
            ? "essay"
            : undefined
      }
    />
  );
}
