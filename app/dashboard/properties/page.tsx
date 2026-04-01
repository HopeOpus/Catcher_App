import { redirect } from 'next/navigation';
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from '@/lib/authenticated-user';
import { syncPropertyLifecycle } from '@/lib/property-lifecycle';
import { normalizeStoredPhotoUrl } from '@/lib/catcher-domain';
import { prisma } from '@/lib/prisma';
import PropertiesPageClient, {
  type Property as DashboardProperty,
} from './properties-page-client';

async function getInitialProperties(userId: string): Promise<DashboardProperty[]> {
  const properties = await prisma.property.findMany({
    where: { userId, archivedAt: null },
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
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    redirect('/auth/signin');
  }

  await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
  await syncPropertyLifecycle(prisma, {
    userId: authenticatedUser.userId,
  });

  const [initialProperties, freePlanUsageCount] = await Promise.all([
    getInitialProperties(authenticatedUser.userId),
    prisma.propertyCoverage.count({
      where: {
        userId: authenticatedUser.userId,
        planCode: 'free',
      },
    }),
  ]);

  return (
    <PropertiesPageClient
      initialProperties={initialProperties}
      hasUsedFreePlan={freePlanUsageCount > 0}
    />
  );
}
