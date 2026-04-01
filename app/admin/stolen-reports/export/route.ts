import { assertAdminAccess } from "@/lib/admin-access";
import { buildCsv, createCsvDownloadResponse } from "@/lib/admin-csv";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await assertAdminAccess();

  const reports = await prisma.stolenReport.findMany({
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
      property: {
        select: {
          archivedAt: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const csv = buildCsv(
    reports.map((report) => ({
      id: report.id,
      property_name: report.propertyName,
      serial_number: report.serialNumber,
      location: report.location,
      status: report.status,
      owner_name: report.user.name,
      owner_email: report.user.email,
      property_record_name: report.property.name,
      property_archived: report.property.archivedAt ? "Yes" : "No",
      evidence_count: report.evidenceUrls.length,
      date_reported: report.dateReported.toISOString(),
      created_at: report.createdAt.toISOString(),
    })),
  );

  return createCsvDownloadResponse("admin-stolen-reports.csv", csv);
}
