import type { Prisma } from "@prisma/client";
import {
  getStolenReportStatusLabel,
  normalizeStoredPhotoUrl,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  STOLEN_REPORT_STATUSES,
} from "@/lib/catcher-domain";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import { prisma } from "@/lib/prisma";
import type {
  PublicRegistryItem,
  PublicRegistrySearchResult,
  PublicRegistrySearchState,
} from "@/lib/public-registry";

type RegistryPropertyRecord = Prisma.PropertyGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        email: true;
        phoneNumber: true;
        profileImageUrl: true;
      };
    };
    photos: {
      select: {
        fileUrl: true;
      };
    };
    stolenReports: {
      select: {
        id: true;
        status: true;
        location: true;
        description: true;
        dateReported: true;
      };
    };
    _count: {
      select: {
        stolenReports: true;
      };
    };
  };
}>;

function normalizeSearchTerm(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function collapseSearchTerm(value: string) {
  return normalizeSearchTerm(value).replace(/[^a-z0-9]/g, "");
}

function matchPropertyStatusFromQuery(query: string) {
  const normalizedQuery = normalizeSearchTerm(query);

  return (
    PROPERTY_STATUSES.find(
      (status) => normalizeSearchTerm(status) === normalizedQuery,
    ) ?? null
  );
}

function matchPropertyTypeFromQuery(query: string) {
  const normalizedQuery = normalizeSearchTerm(query);

  return (
    PROPERTY_TYPES.find((type) => normalizeSearchTerm(type) === normalizedQuery) ??
    null
  );
}

function matchStolenReportStatusFromQuery(query: string) {
  const normalizedQuery = normalizeSearchTerm(query);
  const collapsedQuery = collapseSearchTerm(query);

  return (
    STOLEN_REPORT_STATUSES.find((status) => {
      const label = getStolenReportStatusLabel(status);

      return (
        normalizeSearchTerm(status) === normalizedQuery ||
        normalizeSearchTerm(label) === normalizedQuery ||
        collapseSearchTerm(status) === collapsedQuery ||
        collapseSearchTerm(label) === collapsedQuery
      );
    }) ?? null
  );
}

function buildPublicRegistryWhere(
  state: PublicRegistrySearchState,
): Prisma.PropertyWhereInput {
  const query = state.q.trim();
  const normalizedQuery = normalizeSearchTerm(query);
  const andConditions: Prisma.PropertyWhereInput[] = [];

  if (state.propertyType !== "all") {
    andConditions.push({
      type: state.propertyType,
    });
  }

  if (state.status === "reported-stolen") {
    andConditions.push({
      stolenReports: {
        some: {},
      },
    });
  }

  if (state.status === "not-reported-stolen") {
    andConditions.push({
      stolenReports: {
        none: {},
      },
    });
  }

  if (query.length > 0) {
    const orConditions: Prisma.PropertyWhereInput[] = [
      {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        serialNumber: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        user: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        user: {
          email: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        user: {
          phoneNumber: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        stolenReports: {
          some: {
            location: {
              contains: query,
              mode: "insensitive",
            },
          },
        },
      },
      {
        stolenReports: {
          some: {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
        },
      },
    ];

    const matchedPropertyType = matchPropertyTypeFromQuery(query);

    if (matchedPropertyType) {
      orConditions.push({
        type: matchedPropertyType,
      });
    }

    const matchedPropertyStatus = matchPropertyStatusFromQuery(query);

    if (matchedPropertyStatus) {
      orConditions.push({
        status: matchedPropertyStatus,
      });
    }

    const matchedStolenReportStatus = matchStolenReportStatusFromQuery(query);

    if (matchedStolenReportStatus) {
      orConditions.push({
        stolenReports: {
          some: {
            status: matchedStolenReportStatus,
          },
        },
      });
    }

    if (
      normalizedQuery.includes("reported stolen") ||
      normalizedQuery.includes("stolen report")
    ) {
      orConditions.push({
        stolenReports: {
          some: {},
        },
      });
    }

    if (
      normalizedQuery.includes("not reported stolen") ||
      normalizedQuery.includes("not stolen")
    ) {
      orConditions.push({
        stolenReports: {
          none: {},
        },
      });
    }

    andConditions.push({
      OR: orConditions,
    });
  }

  return {
    archivedAt: null,
    ...(andConditions.length > 0 ? { AND: andConditions } : {}),
  };
}

function buildPublicRegistryOrderBy(
  state: PublicRegistrySearchState,
): Prisma.PropertyOrderByWithRelationInput[] {
  switch (state.sort) {
    case "name-asc":
      return [
        {
          name: "asc",
        },
        {
          createdAt: "desc",
        },
      ];
    case "reported-stolen":
      return [
        {
          stolenReports: {
            _count: "desc",
          },
        },
        {
          dateRegistered: "desc",
        },
        {
          createdAt: "desc",
        },
      ];
    case "newest":
    default:
      return [
        {
          dateRegistered: "desc",
        },
        {
          createdAt: "desc",
        },
      ];
  }
}

function mapRegistryProperty(property: RegistryPropertyRecord): PublicRegistryItem {
  const latestStolenReport = property.stolenReports[0] ?? null;
  const coverPhotoUrl = property.photoUrl
    ? normalizeStoredPhotoUrl(property.photoUrl)
    : property.photos[0]?.fileUrl
      ? normalizeStoredPhotoUrl(property.photos[0].fileUrl)
      : null;

  return {
    id: property.id,
    propertyName: property.name,
    propertyType: property.type,
    propertyStatus: property.status,
    serialNumber: property.serialNumber,
    propertyDescription: property.description ?? "",
    dateRegistered: property.dateRegistered.toISOString(),
    propertyImageUrl: coverPhotoUrl,
    ownerName: property.user.name,
    ownerEmail: property.user.email,
    ownerPhone: property.user.phoneNumber ?? null,
    ownerImageUrl: property.user.profileImageUrl
      ? normalizeStoredPhotoUrl(property.user.profileImageUrl)
      : null,
    isReportedStolen: property._count.stolenReports > 0,
    latestReportStatus: latestStolenReport
      ? getStolenReportStatusLabel(latestStolenReport.status)
      : null,
    latestReportLocation: latestStolenReport?.location ?? "",
    latestReportDescription: latestStolenReport?.description ?? "",
    latestReportDate: latestStolenReport
      ? latestStolenReport.dateReported.toISOString()
      : null,
    stolenReportCount: property._count.stolenReports,
  };
}

export async function getPublicRegistrySearchResult(
  state: PublicRegistrySearchState,
): Promise<PublicRegistrySearchResult> {
  await syncPropertyLifecycle(prisma);

  const where = buildPublicRegistryWhere(state);
  const totalCount = await prisma.property.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / state.pageSize));
  const page = totalCount === 0 ? 1 : Math.min(state.page, totalPages);
  const skip = (page - 1) * state.pageSize;
  const properties =
    totalCount === 0
      ? []
      : await prisma.property.findMany({
          where,
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phoneNumber: true,
                profileImageUrl: true,
              },
            },
            photos: {
              select: {
                fileUrl: true,
              },
              orderBy: {
                uploadedAt: "asc",
              },
              take: 1,
            },
            stolenReports: {
              select: {
                id: true,
                status: true,
                location: true,
                description: true,
                dateReported: true,
              },
              orderBy: [{ dateReported: "desc" }, { createdAt: "desc" }],
              take: 1,
            },
            _count: {
              select: {
                stolenReports: true,
              },
            },
          },
          orderBy: buildPublicRegistryOrderBy(state),
          skip,
          take: state.pageSize,
        });

  const items = properties.map(mapRegistryProperty);
  const rangeStart = totalCount === 0 ? 0 : skip + 1;
  const rangeEnd = totalCount === 0 ? 0 : skip + items.length;

  return {
    items,
    totalCount,
    totalPages,
    page,
    pageSize: state.pageSize,
    rangeStart,
    rangeEnd,
    state: {
      ...state,
      page,
    },
  };
}
