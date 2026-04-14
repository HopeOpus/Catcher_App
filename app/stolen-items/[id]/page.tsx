import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LegacyStolenItemDetailsRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/search-registry/${encodeURIComponent(id)}`);
}
