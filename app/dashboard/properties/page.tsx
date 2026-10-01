import { canInScope, ownershipWhere, type AccountScope } from '@/lib/account-scope';
import { normalizeStoredPhotoUrl } from '@/lib/catcher-domain';
import { getDashboardContext, hasUsedFreePlan } from '@/lib/dashboard-context';
import { getPropertyPlanDefinitions } from '@/lib/property-plans';
import { prisma } from '@/lib/prisma';
import PropertiesPageClient, {
  type Property as DashboardProperty,
} from './properties-page-client';

async function getInitialProperties(scope: AccountScope): Promise<DashboardProperty[]> {
  const properties = await prisma.property.findMany({
    where: { ...ownershipWhere(scope), archivedAt: null },
    include: {
      photos: {
        orderBy: { uploadedAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return properties.map((property) => {
    const photoUrls = property.photos.map((photo) =>
      normalizeStoredPhotoUrl(photo.fileUrl),
    );
    const coverPhoto = property.photoUrl
      ? normalizeStoredPhotoUrl(property.photoUrl)
      : (photoUrls[0] ?? null);
    const orderedPhotoUrls = coverPhoto
      ? Array.from(new Set([coverPhoto, ...photoUrls]))
      : photoUrls;

    return {
      id: property.id,
      name: property.name,
      type: property.type,
      serialNumber: property.serialNumber,
      description: property.description ?? '',
      dateRegistered: property.dateRegistered.toISOString().split('T')[0],
      status: property.status,
      assetTag: property.assetTag ?? '',
      location: property.location ?? '',
      photos: orderedPhotoUrls.map((photoUrl, index) => ({
        id: `${property.id}-${index}`,
        preview: photoUrl,
        uploaded: true,
        url: photoUrl,
      })),
    };
  });
}

export default async function PropertiesPage() {
  const context = await getDashboardContext({ syncLifecycle: true });
  const { scope } = context;

  const [initialProperties, usedFreePlan] = await Promise.all([
    getInitialProperties(scope),
    hasUsedFreePlan(context),
  ]);

  return (
    <PropertiesPageClient
      initialProperties={initialProperties}
      hasUsedFreePlan={usedFreePlan}
      planDefinitions={[...getPropertyPlanDefinitions(context.audience)]}
      account={{
        kind: scope.kind,
        businessName: scope.kind === 'business' ? scope.business.name : null,
        canRegister: canInScope(scope, 'registerProperty') && canInScope(scope, 'purchase'),
        canEdit: canInScope(scope, 'editProperty'),
        canDelete: canInScope(scope, 'deleteProperty'),
        canReportStolen: canInScope(scope, 'reportStolen'),
      }}
    />
  );
}
