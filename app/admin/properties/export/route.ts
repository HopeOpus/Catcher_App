import { assertAdminAccess } from "@/lib/admin-access";
import { buildCsv, createCsvDownloadResponse } from "@/lib/admin-csv";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await assertAdminAccess();

  const properties = await prisma.property.findMany({
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
      coverages: {
        orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
        take: 1,
      },
      _count: {
        select: {
          photos: true,
          stolenReports: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const csv = buildCsv(
    properties.map((property) => {
      const latestCoverage = property.coverages[0] ?? null;

      return {
        id: property.id,
        name: property.name,
        type: property.type,
        status: property.status,
        serial_number: property.serialNumber,
        owner_name: property.user.name,
        owner_email: property.user.email,
        plan_name: latestCoverage?.planName ?? "",
        plan_status: latestCoverage?.status ?? "",
        archived_at: property.archivedAt?.toISOString() ?? "",
        archive_reason: property.archiveReason ?? "",
        photo_count: property._count.photos,
        stolen_report_count: property._count.stolenReports,
        date_registered: property.dateRegistered.toISOString(),
        created_at: property.createdAt.toISOString(),
      };
    }),
  );

  return createCsvDownloadResponse("admin-properties.csv", csv);
}
