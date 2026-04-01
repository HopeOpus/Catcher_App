import { notFound, redirect } from "next/navigation";
import { DatabaseBrowserClient } from "@/components/database-browser-client";
import { getDatabaseBrowserAccess } from "@/lib/database-browser-access";

export default async function DatabaseBrowserPage() {
  const access = await getDatabaseBrowserAccess();

  if (!access.ok) {
    if (access.status === 401) {
      redirect("/auth/signin");
    }

    notFound();
  }

  return <DatabaseBrowserClient />;
}
