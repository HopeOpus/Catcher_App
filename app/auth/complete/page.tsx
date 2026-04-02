import { redirect } from "next/navigation";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AuthCompletePage() {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    redirect("/auth/signin");
  }

  await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

  const userRecord = await prisma.user.findUnique({
    where: { id: authenticatedUser.userId },
    select: {
      role: true,
    },
  });

  redirect(userRecord?.role === "Admin" ? "/admin" : "/dashboard");
}
