type CoverageLike = {
  id: string;
  planCode: string;
  planName: string;
  priceNgnKobo: number;
  status: string;
  startsAt: Date;
  expiresAt: Date | null;
  graceEndsAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
};

export type CoverageDisplayState = {
  label: string;
  tone: "green" | "blue" | "amber" | "red" | "slate";
  isActive: boolean;
  isScheduled: boolean;
  isInGrace: boolean;
  isArchived: boolean;
  isExpired: boolean;
};

function sortCoveragesByRecency(coverages: CoverageLike[]) {
  return [...coverages].sort((left, right) => {
    const startsAtDifference = right.startsAt.getTime() - left.startsAt.getTime();

    if (startsAtDifference !== 0) {
      return startsAtDifference;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}

export function getCurrentAndUpcomingCoverage(
  coverages: CoverageLike[],
  now: Date = new Date(),
) {
  const orderedCoverages = sortCoveragesByRecency(coverages);
  const upcomingCoverage =
    orderedCoverages.find(
      (coverage) =>
        coverage.status === "scheduled" || coverage.startsAt.getTime() > now.getTime(),
    ) ?? null;
  const currentCoverage =
    orderedCoverages.find((coverage) => {
      if (
        coverage.archivedAt ||
        coverage.status === "archived" ||
        coverage.status === "cancelled"
      ) {
        return false;
      }

      return coverage.startsAt.getTime() <= now.getTime();
    }) ??
    orderedCoverages.find(
      (coverage) => coverage.archivedAt !== null || coverage.status === "archived",
    ) ??
    upcomingCoverage ??
    orderedCoverages[0] ??
    null;

  return {
    currentCoverage,
    upcomingCoverage:
      upcomingCoverage && currentCoverage?.id !== upcomingCoverage.id
        ? upcomingCoverage
        : null,
  };
}

export function getCoverageDisplayState(options: {
  coverage: CoverageLike | null;
  propertyArchivedAt: Date | null;
  now?: Date;
}): CoverageDisplayState {
  const { coverage, propertyArchivedAt, now = new Date() } = options;

  if (!coverage) {
    return {
      label: propertyArchivedAt ? "Archived" : "No active plan",
      tone: propertyArchivedAt ? "slate" : "red",
      isActive: false,
      isScheduled: false,
      isInGrace: false,
      isArchived: Boolean(propertyArchivedAt),
      isExpired: !propertyArchivedAt,
    };
  }

  if (propertyArchivedAt || coverage.archivedAt || coverage.status === "archived") {
    return {
      label: "Archived",
      tone: "slate",
      isActive: false,
      isScheduled: false,
      isInGrace: false,
      isArchived: true,
      isExpired: false,
    };
  }

  if (coverage.status === "scheduled" || coverage.startsAt.getTime() > now.getTime()) {
    return {
      label: "Scheduled",
      tone: "blue",
      isActive: false,
      isScheduled: true,
      isInGrace: false,
      isArchived: false,
      isExpired: false,
    };
  }

  if (coverage.expiresAt && coverage.expiresAt.getTime() <= now.getTime()) {
    if (coverage.graceEndsAt && coverage.graceEndsAt.getTime() > now.getTime()) {
      return {
        label: "Grace period",
        tone: "amber",
        isActive: false,
        isScheduled: false,
        isInGrace: true,
        isArchived: false,
        isExpired: false,
      };
    }

    return {
      label: "Expired",
      tone: "red",
      isActive: false,
      isScheduled: false,
      isInGrace: false,
      isArchived: false,
      isExpired: true,
    };
  }

  return {
    label: "Active",
    tone: "green",
    isActive: true,
    isScheduled: false,
    isInGrace: false,
    isArchived: false,
    isExpired: false,
  };
}
