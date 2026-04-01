import type {
  PropertyPlanCodeValue,
  PropertyStatusValue,
  PropertyTypeValue,
} from "@/lib/catcher-domain";
import type { CoverageDisplayState } from "@/lib/property-coverage";

export type ManagedPropertyCoverage = {
  id: string;
  planCode: PropertyPlanCodeValue;
  planName: string;
  priceNgnKobo: number;
  status: string;
  startsAt: string;
  expiresAt: string | null;
  graceEndsAt: string | null;
  archivedAt: string | null;
};

export type ManagedPropertyBillingItem = {
  propertyId: string;
  propertyName: string;
  propertyType: PropertyTypeValue;
  propertyStatus: PropertyStatusValue;
  serialNumber: string;
  dateRegistered: string;
  photoUrl: string | null;
  archivedAt: string | null;
  archiveReason: string | null;
  restorable: boolean;
  hasAnyCoverage: boolean;
  hasPendingCheckout: boolean;
  currentCoverage: ManagedPropertyCoverage | null;
  upcomingCoverage: ManagedPropertyCoverage | null;
  displayState: CoverageDisplayState;
};

export type PropertyPlanDashboardSummary = {
  totalProperties: number;
  activePlans: number;
  graceWindow: number;
  scheduledRenewals: number;
  archivedProperties: number;
};
