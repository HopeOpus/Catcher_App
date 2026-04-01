import type {
  Prisma,
  PrismaClient,
  PropertyCoverage,
  PropertyCoverageStatus,
  Property,
} from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

type PropertyWithCoverages = Property & {
  coverages: PropertyCoverage[];
};

type SyncPropertyLifecycleOptions = {
  userId?: string;
  propertyId?: string;
  now?: Date;
};

const COVERAGE_ARCHIVE_REASON = "coverage_expired_after_grace";

function getDesiredCoverageState(
  coverage: Pick<
    PropertyCoverage,
    "status" | "startsAt" | "expiresAt" | "graceEndsAt" | "archivedAt"
  >,
  now: Date,
): {
  status: PropertyCoverageStatus;
  archivedAt: Date | null;
} {
  if (coverage.status === "cancelled") {
    return {
      status: "cancelled",
      archivedAt: coverage.archivedAt,
    };
  }

  if (coverage.startsAt.getTime() > now.getTime()) {
    return {
      status: "scheduled",
      archivedAt: null,
    };
  }

  if (!coverage.expiresAt || coverage.expiresAt.getTime() > now.getTime()) {
    return {
      status: "active",
      archivedAt: null,
    };
  }

  if (coverage.graceEndsAt && coverage.graceEndsAt.getTime() > now.getTime()) {
    return {
      status: "grace",
      archivedAt: null,
    };
  }

  return {
    status: "archived",
    archivedAt: coverage.graceEndsAt ?? now,
  };
}

function shouldPropertyRemainLive(coverages: PropertyCoverage[], now: Date): boolean {
  return coverages.some((coverage) => {
    const desired = getDesiredCoverageState(coverage, now);

    return (
      desired.status === "active" ||
      desired.status === "grace" ||
      desired.status === "scheduled"
    );
  });
}

async function syncSinglePropertyLifecycle(
  db: DbClient,
  property: PropertyWithCoverages,
  now: Date,
) {
  let coverageUpdates = 0;
  let propertyUpdates = 0;

  for (const coverage of property.coverages) {
    const desiredState = getDesiredCoverageState(coverage, now);
    const statusChanged = coverage.status !== desiredState.status;
    const archivedAtChanged =
      (coverage.archivedAt?.toISOString() ?? null) !==
      (desiredState.archivedAt?.toISOString() ?? null);

    if (!statusChanged && !archivedAtChanged) {
      continue;
    }

    await db.propertyCoverage.update({
      where: { id: coverage.id },
      data: {
        status: desiredState.status,
        archivedAt: desiredState.archivedAt,
      },
    });

    coverage.status = desiredState.status;
    coverage.archivedAt = desiredState.archivedAt;
    coverageUpdates += 1;
  }

  const shouldArchiveProperty =
    property.coverages.length > 0 && !shouldPropertyRemainLive(property.coverages, now);
  const desiredArchivedAt = shouldArchiveProperty
    ? property.archivedAt ?? now
    : null;
  const desiredArchiveReason = shouldArchiveProperty
    ? property.archiveReason ?? COVERAGE_ARCHIVE_REASON
    : null;
  const desiredRestorable = shouldArchiveProperty;
  const propertyArchivedAtChanged =
    (property.archivedAt?.toISOString() ?? null) !==
    (desiredArchivedAt?.toISOString() ?? null);
  const archiveReasonChanged = property.archiveReason !== desiredArchiveReason;
  const restorableChanged = property.restorable !== desiredRestorable;

  if (propertyArchivedAtChanged || archiveReasonChanged || restorableChanged) {
    await db.property.update({
      where: { id: property.id },
      data: {
        archivedAt: desiredArchivedAt,
        archiveReason: desiredArchiveReason,
        restorable: desiredRestorable,
      },
    });
    propertyUpdates += 1;
  }

  return {
    coverageUpdates,
    propertyUpdates,
  };
}

export async function syncPropertyLifecycle(
  db: DbClient,
  options: SyncPropertyLifecycleOptions = {},
) {
  const now = options.now ?? new Date();
  const properties = await db.property.findMany({
    where: {
      ...(options.userId ? { userId: options.userId } : {}),
      ...(options.propertyId ? { id: options.propertyId } : {}),
    },
    include: {
      coverages: {
        orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  let propertyUpdates = 0;
  let coverageUpdates = 0;

  for (const property of properties) {
    const summary = await syncSinglePropertyLifecycle(db, property, now);
    propertyUpdates += summary.propertyUpdates;
    coverageUpdates += summary.coverageUpdates;
  }

  return {
    inspectedProperties: properties.length,
    propertyUpdates,
    coverageUpdates,
  };
}
