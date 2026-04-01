import { assertAdminAccess } from "@/lib/admin-access";
import { buildCsv, createCsvDownloadResponse } from "@/lib/admin-csv";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await assertAdminAccess();

  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          properties: true,
          stolenReports: true,
          propertyCoverages: true,
        },
      },
    },
    orderBy: [{ role: "desc" }, { createdAt: "desc" }],
  });

  const csv = buildCsv(
    users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone_number: user.phoneNumber ?? "",
      next_of_kin_email: user.nextOfKinEmail ?? "",
      next_of_kin_phone: user.nextOfKinPhone ?? "",
      properties: user._count.properties,
      stolen_reports: user._count.stolenReports,
      subscriptions: user._count.propertyCoverages,
      created_at: user.createdAt.toISOString(),
    })),
  );

  return createCsvDownloadResponse("admin-users.csv", csv);
}
