import {
  canInScope,
  ownershipWhere,
  type AccountScope,
} from "@/lib/account-scope";
import {
  normalizeStoredPhotoUrl,
  type PropertyPlanCodeValue,
} from "@/lib/catcher-domain";
import { getDashboardContext, hasUsedFreePlan } from "@/lib/dashboard-context";
import {
  getCoverageDisplayState,
  getCurrentAndUpcomingCoverage,
} from "@/lib/property-coverage";
import { getPropertyPlanDefinitions } from "@/lib/property-plans";
import { prisma } from "@/lib/prisma";
import { SUPPORT_EMAIL } from "@/lib/support";
import type {
  ManagedPropertyBillingItem,
  ManagedPropertyCoverage,
  PropertyPlanDashboardSummary,
} from "./property-plan-types";
import SubscriptionsPageClient from "./subscriptions-page-client";

function serializeCoverage(
  coverage:
    | {
        id: string;
        planCode: string;
        planName: string;
        priceNgnKobo: number;
        status: string;
        startsAt: Date;
        expiresAt: Date | null;
        graceEndsAt: Date | null;
        archivedAt: Date | null;
      }
    | null,
): ManagedPropertyCoverage | null {
  if (!coverage) {
    return null;
  }

  return {
    id: coverage.id,
    planCode: coverage.planCode as PropertyPlanCodeValue,
    planName: coverage.planName,
    priceNgnKobo: coverage.priceNgnKobo,
    status: coverage.status,
    startsAt: coverage.startsAt.toISOString(),
    expiresAt: coverage.expiresAt?.toISOString() ?? null,
    graceEndsAt: coverage.graceEndsAt?.toISOString() ?? null,
    archivedAt: coverage.archivedAt?.toISOString() ?? null,
  };
}

async function getManagedPropertyBillingItems(
  scope: AccountScope,
): Promise<ManagedPropertyBillingItem[]> {
  const properties = await prisma.property.findMany({
    where: ownershipWhere(scope),
    include: {
      photos: {
        orderBy: { uploadedAt: "asc" },
        take: 1,
      },
      coverages: {
        orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      },
      checkoutSessions: {
        where: {
          status: {
            in: ["draft", "pendingPayment", "pendingVerification"],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return properties
    .map((property) => {
      const { currentCoverage, upcomingCoverage } = getCurrentAndUpcomingCoverage(
        property.coverages,
      );
      const displayState = getCoverageDisplayState({
        coverage: currentCoverage,
        propertyArchivedAt: property.archivedAt,
      });
      const photoUrl = property.photoUrl
        ? normalizeStoredPhotoUrl(property.photoUrl)
        : property.photos[0]
          ? normalizeStoredPhotoUrl(property.photos[0].fileUrl)
          : null;

      return {
        propertyId: property.id,
        propertyName: property.name,
        propertyType: property.type,
        propertyStatus: property.status,
        serialNumber: property.serialNumber,
        dateRegistered: property.dateRegistered.toISOString(),
        photoUrl,
        archivedAt: property.archivedAt?.toISOString() ?? null,
        archiveReason: property.archiveReason,
        restorable: property.restorable,
        hasAnyCoverage: property.coverages.length > 0,
        hasPendingCheckout: property.checkoutSessions.length > 0,
        currentCoverage: serializeCoverage(currentCoverage),
        upcomingCoverage: serializeCoverage(upcomingCoverage),
        displayState,
      };
    })
    .sort((left, right) => {
      const archivedDifference =
        Number(Boolean(left.archivedAt)) - Number(Boolean(right.archivedAt));

      if (archivedDifference !== 0) {
        return archivedDifference;
      }

      return (
        new Date(right.dateRegistered).getTime() -
        new Date(left.dateRegistered).getTime()
      );
    });
}

function buildDashboardSummary(
  properties: ManagedPropertyBillingItem[],
): PropertyPlanDashboardSummary {
  return {
    totalProperties: properties.length,
    activePlans: properties.filter(
      (property) => property.displayState.isActive || property.displayState.isInGrace,
    ).length,
    graceWindow: properties.filter((property) => property.displayState.isInGrace)
      .length,
    scheduledRenewals: properties.filter(
      (property) =>
        property.displayState.isScheduled || property.upcomingCoverage !== null,
    ).length,
    archivedProperties: properties.filter((property) => property.displayState.isArchived)
      .length,
  };
}

export default async function SubscriptionsPage() {
  const context = await getDashboardContext({ syncLifecycle: true });
  const { scope } = context;

  const [properties, usedFreePlan] = await Promise.all([
    getManagedPropertyBillingItems(scope),
    hasUsedFreePlan(context),
  ]);

  return (
    <SubscriptionsPageClient
      supportEmail={SUPPORT_EMAIL}
      properties={properties}
      summary={buildDashboardSummary(properties)}
      hasUsedFreePlan={usedFreePlan}
      planDefinitions={[...getPropertyPlanDefinitions(context.audience)]}
      canPurchase={canInScope(scope, "purchase")}
      businessName={scope.kind === "business" ? scope.business.name : null}
    />
  );
}


// This file is the main entry point for the subscriptions page in the dashboard. It fetches all necessary data for the user's properties and their coverage, then renders the SubscriptionsPageClient component with that data. It also handles authentication and redirects to the sign-in page if the user is not authenticated.
