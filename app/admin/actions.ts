'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AuditLogEntityType, Prisma, UserRole } from '@prisma/client';
import {
  isPropertyStatus,
  isPropertyType,
  isStolenReportStatus,
} from '@/lib/catcher-domain';
import { assertAdminAccess, type AdminAppUser } from '@/lib/admin-access';
import {
  createAdminNote,
  deleteAdminNote as deletePersistedAdminNote,
  updateAdminNote,
} from '@/lib/admin-notes';
import { safeRecordAuditLog } from '@/lib/audit-log';
import {
  uploadImageToCloudinary,
  validateImageUploadFile,
} from '@/lib/cloudinary';
import { safeCreateNotification } from '@/lib/notifications';
import { finalizePaystackCheckoutByReference } from '@/lib/property-checkout';
import { prisma } from '@/lib/prisma';
import { adjustWalletCreditsByAdmin } from '@/lib/wallet';

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function getNullableStringValue(formData: FormData, key: string) {
  const value = getStringValue(formData, key);
  return value.length > 0 ? value : null;
}

function getFileValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function parseSelectedIds(formData: FormData, key = 'selected_ids') {
  const rawValue = getStringValue(formData, key);

  if (!rawValue) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return Array.from(
      new Set(
        parsed.filter((value): value is string => typeof value === 'string' && value.trim().length > 0),
      ),
    );
  } catch {
    return [];
  }
}

function isAdminNoteTargetType(value: string): value is 'User' | 'Property' | 'StolenReport' {
  return value === 'User' || value === 'Property' || value === 'StolenReport';
}

function getRedirectTarget(formData: FormData, fallbackPath: string) {
  const redirectTo = getStringValue(formData, 'redirect_to');
  return redirectTo.startsWith('/admin') ? redirectTo : fallbackPath;
}

function redirectWithResult(
  path: string,
  options: {
    tone: 'success' | 'error';
    message: string;
  },
): never {
  const url = new URL(path, 'http://localhost');
  url.searchParams.set('status', options.tone);
  url.searchParams.set('message', options.message);
  redirect(`${url.pathname}${url.search}`);
}

function revalidateAdminPanel() {
  [
    '/admin',
    '/admin/users',
    '/admin/properties',
    '/admin/stolen-reports',
    '/admin/catalog',
    '/admin/payments',
    '/admin/wallet',
    '/admin/audit-logs',
    '/dashboard',
    '/dashboard/properties',
    '/dashboard/stolen-reports',
    '/dashboard/subscriptions',
    '/stolen-items',
    '/search-registry',
  ].forEach((path) => revalidatePath(path));
}

function isUserRole(value: string): value is UserRole {
  return value === 'User' || value === 'Admin';
}

function getAdminActorLabel(adminUser: AdminAppUser) {
  return adminUser.name.trim() || adminUser.email.trim() || adminUser.userId;
}

async function recordAdminAudit(
  adminUser: AdminAppUser,
  input: {
    action: string;
    entityType: AuditLogEntityType;
    entityId: string;
    entityLabel?: string | null;
    summary: string;
    targetUserId?: string | null;
    propertyId?: string | null;
    stolenReportId?: string | null;
    coverageId?: string | null;
    catalogItemId?: string | null;
    details?: Prisma.InputJsonValue | null;
  },
) {
  await safeRecordAuditLog({
    actorUserId: adminUser.userId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    entityLabel: input.entityLabel ?? null,
    summary: input.summary,
    targetUserId: input.targetUserId ?? null,
    propertyId: input.propertyId ?? null,
    stolenReportId: input.stolenReportId ?? null,
    coverageId: input.coverageId ?? null,
    catalogItemId: input.catalogItemId ?? null,
    details: input.details,
  });
}

async function resolveCatalogImageUrl(
  formData: FormData,
  uploadKey: string,
) {
  const imageFile = getFileValue(formData, 'image_file');

  if (imageFile) {
    const validationError = validateImageUploadFile(imageFile);

    if (validationError) {
      throw new Error(validationError);
    }

    const uploadedImage = await uploadImageToCloudinary(imageFile, uploadKey);
    return uploadedImage.url;
  }

  return getNullableStringValue(formData, 'image_url');
}

export async function updateUserRoleAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/users');

  try {
    const adminUser = await assertAdminAccess();
    const userId = getStringValue(formData, 'user_id');
    const role = getStringValue(formData, 'role');

    if (!userId || !isUserRole(role)) {
      throw new Error('Select a valid user and role.');
    }

    if (userId === adminUser.userId && role !== 'Admin') {
      throw new Error('You cannot remove your own admin access from this panel.');
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!existingUser) {
      throw new Error('User not found.');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    await recordAdminAudit(adminUser, {
      action: 'user.role.updated',
      entityType: 'User',
      entityId: existingUser.id,
      entityLabel: existingUser.email,
      targetUserId: existingUser.id,
      summary: `${getAdminActorLabel(adminUser)} changed ${existingUser.email} from ${existingUser.role} to ${role}.`,
      details: {
        previousRole: existingUser.role,
        nextRole: role,
        targetEmail: existingUser.email,
        targetName: existingUser.name,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to update the user role.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'User role updated successfully.',
  });
}

export async function updatePropertyAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/properties');

  try {
    const adminUser = await assertAdminAccess();

    const propertyId = getStringValue(formData, 'property_id');
    const name = getStringValue(formData, 'name');
    const type = getStringValue(formData, 'type');
    const status = getStringValue(formData, 'status');
    const description = getNullableStringValue(formData, 'description');

    if (!propertyId || !name || !isPropertyType(type) || !isPropertyStatus(status)) {
      throw new Error('Property name, type, and status are required.');
    }

    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        description: true,
        userId: true,
      },
    });

    if (!existingProperty) {
      throw new Error('Property not found.');
    }

    await prisma.property.update({
      where: { id: propertyId },
      data: {
        name,
        type,
        status,
        description,
      },
    });

    await recordAdminAudit(adminUser, {
      action: 'property.updated',
      entityType: 'Property',
      entityId: existingProperty.id,
      entityLabel: name,
      targetUserId: existingProperty.userId,
      propertyId: existingProperty.id,
      summary: `${getAdminActorLabel(adminUser)} updated property ${existingProperty.name}.`,
      details: {
        previous: {
          name: existingProperty.name,
          type: existingProperty.type,
          status: existingProperty.status,
          description: existingProperty.description,
        },
        next: {
          name,
          type,
          status,
          description,
        },
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to update the property.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Property updated successfully.',
  });
}

export async function archivePropertyAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/properties');

  try {
    const adminUser = await assertAdminAccess();

    const propertyId = getStringValue(formData, 'property_id');
    const archiveReason =
      getNullableStringValue(formData, 'archive_reason') ?? 'Archived by admin';

    if (!propertyId) {
      throw new Error('Property ID is required.');
    }

    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        userId: true,
        archivedAt: true,
        archiveReason: true,
      },
    });

    if (!existingProperty) {
      throw new Error('Property not found.');
    }

    await prisma.property.update({
      where: { id: propertyId },
      data: {
        archivedAt: new Date(),
        archiveReason,
        restorable: true,
      },
    });

    await prisma.propertyCoverage.updateMany({
      where: {
        propertyId,
        status: {
          in: ['active', 'grace', 'scheduled'],
        },
      },
      data: {
        status: 'archived',
        archivedAt: new Date(),
      },
    });

    await recordAdminAudit(adminUser, {
      action: 'property.archived',
      entityType: 'Property',
      entityId: existingProperty.id,
      entityLabel: existingProperty.name,
      targetUserId: existingProperty.userId,
      propertyId: existingProperty.id,
      summary: `${getAdminActorLabel(adminUser)} archived property ${existingProperty.name}.`,
      details: {
        previousArchivedAt: existingProperty.archivedAt?.toISOString() ?? null,
        previousArchiveReason: existingProperty.archiveReason,
        archiveReason,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to archive the property.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Property archived successfully.',
  });
}

export async function restorePropertyAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/properties');

  try {
    const adminUser = await assertAdminAccess();
    const propertyId = getStringValue(formData, 'property_id');

    if (!propertyId) {
      throw new Error('Property ID is required.');
    }

    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        userId: true,
        archivedAt: true,
        archiveReason: true,
      },
    });

    if (!existingProperty) {
      throw new Error('Property not found.');
    }

    await prisma.property.update({
      where: { id: propertyId },
      data: {
        archivedAt: null,
        archiveReason: null,
        restorable: false,
      },
    });

    await prisma.propertyCoverage.updateMany({
      where: {
        propertyId,
        status: 'archived',
      },
      data: {
        status: 'active',
        archivedAt: null,
      },
    });

    await recordAdminAudit(adminUser, {
      action: 'property.restored',
      entityType: 'Property',
      entityId: existingProperty.id,
      entityLabel: existingProperty.name,
      targetUserId: existingProperty.userId,
      propertyId: existingProperty.id,
      summary: `${getAdminActorLabel(adminUser)} restored property ${existingProperty.name}.`,
      details: {
        previousArchivedAt: existingProperty.archivedAt?.toISOString() ?? null,
        previousArchiveReason: existingProperty.archiveReason,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to restore the property.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Property restored successfully.',
  });
}

export async function deletePropertyAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/properties');

  try {
    const adminUser = await assertAdminAccess();
    const propertyId = getStringValue(formData, 'property_id');

    if (!propertyId) {
      throw new Error('Property ID is required.');
    }

    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        userId: true,
        serialNumber: true,
      },
    });

    if (!existingProperty) {
      throw new Error('Property not found.');
    }

    await prisma.property.delete({
      where: { id: propertyId },
    });

    await recordAdminAudit(adminUser, {
      action: 'property.deleted',
      entityType: 'Property',
      entityId: existingProperty.id,
      entityLabel: existingProperty.name,
      targetUserId: existingProperty.userId,
      summary: `${getAdminActorLabel(adminUser)} deleted property ${existingProperty.name}.`,
      details: {
        serialNumber: existingProperty.serialNumber,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to delete the property.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Property deleted successfully.',
  });
}

export async function updateStolenReportAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/stolen-reports');

  try {
    const adminUser = await assertAdminAccess();

    const reportId = getStringValue(formData, 'report_id');
    const location = getStringValue(formData, 'location');
    const description = getNullableStringValue(formData, 'description');
    const status = getStringValue(formData, 'status');

    if (!reportId || !location || !isStolenReportStatus(status)) {
      throw new Error('Location and a valid report status are required.');
    }

    const existingReport = await prisma.stolenReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        propertyId: true,
        propertyName: true,
        userId: true,
        status: true,
        location: true,
        description: true,
      },
    });

    if (!existingReport) {
      throw new Error('Stolen report not found.');
    }

    await prisma.stolenReport.update({
      where: { id: reportId },
      data: {
        location,
        description,
        status,
      },
    });

    await recordAdminAudit(adminUser, {
      action: 'stolen_report.updated',
      entityType: 'StolenReport',
      entityId: existingReport.id,
      entityLabel: existingReport.propertyName,
      targetUserId: existingReport.userId,
      propertyId: existingReport.propertyId,
      stolenReportId: existingReport.id,
      summary: `${getAdminActorLabel(adminUser)} updated stolen report for ${existingReport.propertyName}.`,
      details: {
        previous: {
          location: existingReport.location,
          description: existingReport.description,
          status: existingReport.status,
        },
        next: {
          location,
          description,
          status,
        },
      },
    });

    await safeCreateNotification({
      userId: existingReport.userId,
      type: 'StolenReportUpdated',
      title: `${existingReport.propertyName} report updated`,
      message: `Your stolen report was updated to ${status}. Review the latest report details in your dashboard.`,
      linkPath: '/dashboard/stolen-reports',
      propertyId: existingReport.propertyId,
      stolenReportId: existingReport.id,
      payload: {
        previousStatus: existingReport.status,
        nextStatus: status,
        location,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to update the stolen report.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Stolen report updated successfully.',
  });
}

export async function deleteStolenReportAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/stolen-reports');

  try {
    const adminUser = await assertAdminAccess();
    const reportId = getStringValue(formData, 'report_id');

    if (!reportId) {
      throw new Error('Report ID is required.');
    }

    const existingReport = await prisma.stolenReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        propertyId: true,
        propertyName: true,
        userId: true,
        serialNumber: true,
      },
    });

    if (!existingReport) {
      throw new Error('Stolen report not found.');
    }

    await prisma.stolenReport.delete({
      where: { id: reportId },
    });

    await recordAdminAudit(adminUser, {
      action: 'stolen_report.deleted',
      entityType: 'StolenReport',
      entityId: existingReport.id,
      entityLabel: existingReport.propertyName,
      targetUserId: existingReport.userId,
      propertyId: existingReport.propertyId,
      summary: `${getAdminActorLabel(adminUser)} deleted stolen report for ${existingReport.propertyName}.`,
      details: {
        serialNumber: existingReport.serialNumber,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to delete the stolen report.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Stolen report deleted successfully.',
  });
}

export async function createCatalogItemAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/catalog');

  try {
    const adminUser = await assertAdminAccess();
    const catalogItemId = randomUUID();
    const name = getStringValue(formData, 'name');
    const type = getStringValue(formData, 'type');
    const description = getNullableStringValue(formData, 'description');
    const imageUrl = await resolveCatalogImageUrl(
      formData,
      `catalog_${catalogItemId}`,
    );

    if (!name || !isPropertyType(type)) {
      throw new Error('Catalog name and a valid property type are required.');
    }

    await prisma.preRegisteredProperty.create({
      data: {
        id: catalogItemId,
        name,
        type,
        description,
        imageUrl,
      },
    });

    await recordAdminAudit(adminUser, {
      action: 'catalog_item.created',
      entityType: 'CatalogItem',
      entityId: catalogItemId,
      entityLabel: name,
      catalogItemId,
      summary: `${getAdminActorLabel(adminUser)} created catalog item ${name}.`,
      details: {
        type,
        description,
        imageUrl,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to create the catalog item.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Catalog item created successfully.',
  });
}

export async function updateCatalogItemAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/catalog');

  try {
    const adminUser = await assertAdminAccess();
    const catalogItemId = getStringValue(formData, 'catalog_item_id');
    const name = getStringValue(formData, 'name');
    const type = getStringValue(formData, 'type');
    const description = getNullableStringValue(formData, 'description');

    if (!catalogItemId || !name || !isPropertyType(type)) {
      throw new Error('Catalog name and a valid property type are required.');
    }

    const existingCatalogItem = await prisma.preRegisteredProperty.findUnique({
      where: { id: catalogItemId },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        imageUrl: true,
      },
    });

    if (!existingCatalogItem) {
      throw new Error('Catalog item not found.');
    }

    const imageUrl = await resolveCatalogImageUrl(
      formData,
      `catalog_${catalogItemId}`,
    );

    await prisma.preRegisteredProperty.update({
      where: { id: catalogItemId },
      data: {
        name,
        type,
        description,
        imageUrl,
      },
    });

    await recordAdminAudit(adminUser, {
      action: 'catalog_item.updated',
      entityType: 'CatalogItem',
      entityId: existingCatalogItem.id,
      entityLabel: name,
      catalogItemId: existingCatalogItem.id,
      summary: `${getAdminActorLabel(adminUser)} updated catalog item ${existingCatalogItem.name}.`,
      details: {
        previous: {
          name: existingCatalogItem.name,
          type: existingCatalogItem.type,
          description: existingCatalogItem.description,
          imageUrl: existingCatalogItem.imageUrl,
        },
        next: {
          name,
          type,
          description,
          imageUrl,
        },
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to update the catalog item.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Catalog item updated successfully.',
  });
}

export async function deleteCatalogItemAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/catalog');

  try {
    const adminUser = await assertAdminAccess();
    const catalogItemId = getStringValue(formData, 'catalog_item_id');

    if (!catalogItemId) {
      throw new Error('Catalog item ID is required.');
    }

    const existingCatalogItem = await prisma.preRegisteredProperty.findUnique({
      where: { id: catalogItemId },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    if (!existingCatalogItem) {
      throw new Error('Catalog item not found.');
    }

    await prisma.preRegisteredProperty.delete({
      where: { id: catalogItemId },
    });

    await recordAdminAudit(adminUser, {
      action: 'catalog_item.deleted',
      entityType: 'CatalogItem',
      entityId: existingCatalogItem.id,
      entityLabel: existingCatalogItem.name,
      catalogItemId: existingCatalogItem.id,
      summary: `${getAdminActorLabel(adminUser)} deleted catalog item ${existingCatalogItem.name}.`,
      details: {
        type: existingCatalogItem.type,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to delete the catalog item.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Catalog item deleted successfully.',
  });
}

export async function bulkUpdateUserRoleAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/users');

  try {
    const adminUser = await assertAdminAccess();
    const userIds = parseSelectedIds(formData);
    const role = getStringValue(formData, 'role');

    if (userIds.length === 0 || !isUserRole(role)) {
      throw new Error('Select at least one user and a valid role.');
    }

    if (role !== 'Admin' && userIds.includes(adminUser.userId)) {
      throw new Error('You cannot remove your own admin access in a bulk action.');
    }

    const existingUsers = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (existingUsers.length === 0) {
      throw new Error('No matching users were found for the selected bulk action.');
    }

    await prisma.user.updateMany({
      where: {
        id: {
          in: existingUsers.map((user) => user.id),
        },
      },
      data: {
        role,
      },
    });

    for (const user of existingUsers) {
      await recordAdminAudit(adminUser, {
        action: 'user.role.bulk_updated',
        entityType: 'User',
        entityId: user.id,
        entityLabel: user.email,
        targetUserId: user.id,
        summary: `${getAdminActorLabel(adminUser)} changed ${user.email} from ${user.role} to ${role} in a bulk action.`,
        details: {
          previousRole: user.role,
          nextRole: role,
          targetEmail: user.email,
          targetName: user.name,
          bulkAction: true,
        },
      });
    }

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to update the selected user roles.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Selected user roles updated successfully.',
  });
}

export async function bulkArchivePropertiesAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/properties');

  try {
    const adminUser = await assertAdminAccess();
    const propertyIds = parseSelectedIds(formData);
    const archiveReason =
      getNullableStringValue(formData, 'archive_reason') ?? 'Archived by admin bulk action';

    if (propertyIds.length === 0) {
      throw new Error('Select at least one property to archive.');
    }

    const existingProperties = await prisma.property.findMany({
      where: {
        id: {
          in: propertyIds,
        },
      },
      select: {
        id: true,
        name: true,
        userId: true,
        archivedAt: true,
        archiveReason: true,
      },
    });

    if (existingProperties.length === 0) {
      throw new Error('No matching properties were found for the selected bulk action.');
    }

    const archivedAt = new Date();

    await prisma.property.updateMany({
      where: {
        id: {
          in: existingProperties.map((property) => property.id),
        },
      },
      data: {
        archivedAt,
        archiveReason,
        restorable: true,
      },
    });

    await prisma.propertyCoverage.updateMany({
      where: {
        propertyId: {
          in: existingProperties.map((property) => property.id),
        },
        status: {
          in: ['active', 'grace', 'scheduled'],
        },
      },
      data: {
        status: 'archived',
        archivedAt,
      },
    });

    for (const property of existingProperties) {
      await recordAdminAudit(adminUser, {
        action: 'property.bulk_archived',
        entityType: 'Property',
        entityId: property.id,
        entityLabel: property.name,
        targetUserId: property.userId,
        propertyId: property.id,
        summary: `${getAdminActorLabel(adminUser)} archived property ${property.name} in a bulk action.`,
        details: {
          previousArchivedAt: property.archivedAt?.toISOString() ?? null,
          previousArchiveReason: property.archiveReason,
          archiveReason,
          bulkAction: true,
        },
      });
    }

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to archive the selected properties.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Selected properties archived successfully.',
  });
}

export async function bulkRestorePropertiesAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/properties');

  try {
    const adminUser = await assertAdminAccess();
    const propertyIds = parseSelectedIds(formData);

    if (propertyIds.length === 0) {
      throw new Error('Select at least one property to restore.');
    }

    const existingProperties = await prisma.property.findMany({
      where: {
        id: {
          in: propertyIds,
        },
      },
      select: {
        id: true,
        name: true,
        userId: true,
        archivedAt: true,
        archiveReason: true,
      },
    });

    if (existingProperties.length === 0) {
      throw new Error('No matching properties were found for the selected bulk action.');
    }

    await prisma.property.updateMany({
      where: {
        id: {
          in: existingProperties.map((property) => property.id),
        },
      },
      data: {
        archivedAt: null,
        archiveReason: null,
        restorable: false,
      },
    });

    await prisma.propertyCoverage.updateMany({
      where: {
        propertyId: {
          in: existingProperties.map((property) => property.id),
        },
        status: 'archived',
      },
      data: {
        status: 'active',
        archivedAt: null,
      },
    });

    for (const property of existingProperties) {
      await recordAdminAudit(adminUser, {
        action: 'property.bulk_restored',
        entityType: 'Property',
        entityId: property.id,
        entityLabel: property.name,
        targetUserId: property.userId,
        propertyId: property.id,
        summary: `${getAdminActorLabel(adminUser)} restored property ${property.name} in a bulk action.`,
        details: {
          previousArchivedAt: property.archivedAt?.toISOString() ?? null,
          previousArchiveReason: property.archiveReason,
          bulkAction: true,
        },
      });
    }

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to restore the selected properties.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Selected properties restored successfully.',
  });
}

export async function bulkUpdateStolenReportStatusAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/stolen-reports');

  try {
    const adminUser = await assertAdminAccess();
    const reportIds = parseSelectedIds(formData);
    const status = getStringValue(formData, 'status');

    if (reportIds.length === 0 || !isStolenReportStatus(status)) {
      throw new Error('Select at least one report and a valid status.');
    }

    const existingReports = await prisma.stolenReport.findMany({
      where: {
        id: {
          in: reportIds,
        },
      },
      select: {
        id: true,
        propertyId: true,
        propertyName: true,
        userId: true,
        status: true,
        location: true,
      },
    });

    if (existingReports.length === 0) {
      throw new Error('No matching reports were found for the selected bulk action.');
    }

    await prisma.stolenReport.updateMany({
      where: {
        id: {
          in: existingReports.map((report) => report.id),
        },
      },
      data: {
        status,
      },
    });

    for (const report of existingReports) {
      await recordAdminAudit(adminUser, {
        action: 'stolen_report.bulk_status_updated',
        entityType: 'StolenReport',
        entityId: report.id,
        entityLabel: report.propertyName,
        targetUserId: report.userId,
        propertyId: report.propertyId,
        stolenReportId: report.id,
        summary: `${getAdminActorLabel(adminUser)} changed ${report.propertyName} to ${status} in a bulk action.`,
        details: {
          previousStatus: report.status,
          nextStatus: status,
          location: report.location,
          bulkAction: true,
        },
      });

      await safeCreateNotification({
        userId: report.userId,
        type: 'StolenReportUpdated',
        title: `${report.propertyName} report updated`,
        message: `Your stolen report was updated to ${status}. Review the latest report details in your dashboard.`,
        linkPath: '/dashboard/stolen-reports',
        propertyId: report.propertyId,
        stolenReportId: report.id,
        payload: {
          previousStatus: report.status,
          nextStatus: status,
          bulkAction: true,
        },
      });
    }

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to update the selected stolen reports.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Selected stolen reports updated successfully.',
  });
}

export async function createAdminNoteAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin');

  try {
    const adminUser = await assertAdminAccess();
    const targetType = getStringValue(formData, 'target_type');
    const targetId = getStringValue(formData, 'target_id');
    const targetLabel = getNullableStringValue(formData, 'target_label');
    const body = getStringValue(formData, 'body');
    const isPinned = getStringValue(formData, 'is_pinned') === 'true';
    const targetUserId = getNullableStringValue(formData, 'target_user_id');
    const propertyId = getNullableStringValue(formData, 'property_id');
    const stolenReportId = getNullableStringValue(formData, 'stolen_report_id');

    if (!isAdminNoteTargetType(targetType) || !targetId || !body) {
      throw new Error('A valid note target and note body are required.');
    }

    const note = await createAdminNote({
      authorUserId: adminUser.userId,
      targetType,
      targetId,
      body,
      isPinned,
      targetUserId,
      propertyId,
      stolenReportId,
    });

    await recordAdminAudit(adminUser, {
      action: 'admin_note.created',
      entityType: targetType as AuditLogEntityType,
      entityId: targetId,
      entityLabel: targetLabel ?? targetId,
      targetUserId,
      propertyId,
      stolenReportId,
      summary: `${getAdminActorLabel(adminUser)} added an admin note to ${targetLabel ?? targetId}.`,
      details: {
        noteId: note.id,
        body,
        isPinned,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message: error instanceof Error ? error.message : 'Failed to save the admin note.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Admin note saved successfully.',
  });
}

export async function toggleAdminNotePinnedAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin');

  try {
    const adminUser = await assertAdminAccess();
    const noteId = getStringValue(formData, 'note_id');
    const isPinned = getStringValue(formData, 'is_pinned') === 'true';

    if (!noteId) {
      throw new Error('Admin note ID is required.');
    }

    const existingNote = await prisma.adminNote.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        targetType: true,
        targetId: true,
        targetUserId: true,
        propertyId: true,
        stolenReportId: true,
      },
    });

    if (!existingNote) {
      throw new Error('Admin note not found.');
    }

    await updateAdminNote(noteId, { isPinned });

    await recordAdminAudit(adminUser, {
      action: isPinned ? 'admin_note.pinned' : 'admin_note.unpinned',
      entityType: existingNote.targetType as AuditLogEntityType,
      entityId: existingNote.targetId,
      entityLabel: existingNote.targetId,
      targetUserId: existingNote.targetUserId,
      propertyId: existingNote.propertyId,
      stolenReportId: existingNote.stolenReportId,
      summary: `${getAdminActorLabel(adminUser)} ${isPinned ? 'pinned' : 'unpinned'} an admin note.`,
      details: {
        noteId: existingNote.id,
        isPinned,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to update the admin note.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Admin note updated successfully.',
  });
}

export async function deleteAdminNoteAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin');

  try {
    const adminUser = await assertAdminAccess();
    const noteId = getStringValue(formData, 'note_id');

    if (!noteId) {
      throw new Error('Admin note ID is required.');
    }

    const existingNote = await prisma.adminNote.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        targetType: true,
        targetId: true,
        targetUserId: true,
        propertyId: true,
        stolenReportId: true,
      },
    });

    if (!existingNote) {
      throw new Error('Admin note not found.');
    }

    await deletePersistedAdminNote(noteId);

    await recordAdminAudit(adminUser, {
      action: 'admin_note.deleted',
      entityType: existingNote.targetType as AuditLogEntityType,
      entityId: existingNote.targetId,
      entityLabel: existingNote.targetId,
      targetUserId: existingNote.targetUserId,
      propertyId: existingNote.propertyId,
      stolenReportId: existingNote.stolenReportId,
      summary: `${getAdminActorLabel(adminUser)} deleted an admin note.`,
      details: {
        noteId: existingNote.id,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to delete the admin note.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Admin note deleted successfully.',
  });
}

export async function retryPaymentVerificationAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/payments');

  try {
    const adminUser = await assertAdminAccess();
    const paymentEventId = getStringValue(formData, 'payment_event_id');
    const reference = getStringValue(formData, 'reference');

    if (!reference) {
      throw new Error('A payment reference is required to retry verification.');
    }

    const completionResult = await finalizePaystackCheckoutByReference(reference, {
      source: 'verify',
      providerEventType: 'admin.retry',
    });

    await recordAdminAudit(adminUser, {
      action: 'payment_event.retry_verification',
      entityType: 'PaymentEvent',
      entityId: paymentEventId || reference,
      entityLabel: reference,
      summary: `${getAdminActorLabel(adminUser)} retried verification for payment reference ${reference}.`,
      details: {
        outcome: completionResult.outcome,
        message:
          "message" in completionResult ? completionResult.message ?? null : null,
        checkoutSessionId: completionResult.checkoutSessionId ?? null,
        propertyId:
          "propertyId" in completionResult ? completionResult.propertyId ?? null : null,
        coverageId:
          "coverageId" in completionResult ? completionResult.coverageId ?? null : null,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to retry payment verification.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Payment verification retry completed.',
  });
}

export async function updatePaymentReviewAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/payments');

  try {
    const adminUser = await assertAdminAccess();
    const paymentEventId = getStringValue(formData, 'payment_event_id');
    const reviewStatus = getStringValue(formData, 'review_status');
    const reviewNote = getNullableStringValue(formData, 'review_note');

    if (
      !paymentEventId ||
      (reviewStatus !== 'admin_reconciled' && reviewStatus !== 'admin_follow_up')
    ) {
      throw new Error('A valid payment review action is required.');
    }

    const existingEvent = await prisma.paymentEventLog.findUnique({
      where: { id: paymentEventId },
      select: {
        id: true,
        reference: true,
        processingOutcome: true,
        errorMessage: true,
      },
    });

    if (!existingEvent) {
      throw new Error('Payment event not found.');
    }

    const nextErrorMessage = reviewNote
      ? existingEvent.errorMessage
        ? `${existingEvent.errorMessage}\nAdmin review: ${reviewNote}`
        : `Admin review: ${reviewNote}`
      : existingEvent.errorMessage;

    await prisma.paymentEventLog.update({
      where: { id: paymentEventId },
      data: {
        processingOutcome: reviewStatus,
        errorMessage: nextErrorMessage,
      },
    });

    await recordAdminAudit(adminUser, {
      action: 'payment_event.reviewed',
      entityType: 'PaymentEvent',
      entityId: existingEvent.id,
      entityLabel: existingEvent.reference ?? existingEvent.id,
      summary: `${getAdminActorLabel(adminUser)} marked payment event ${existingEvent.reference ?? existingEvent.id} as ${reviewStatus}.`,
      details: {
        previousOutcome: existingEvent.processingOutcome,
        nextOutcome: reviewStatus,
        reviewNote,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to update the payment review.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Payment review updated successfully.',
  });
}


function parseSignedCredits(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed === 0) {
    throw new Error('Enter a non-zero whole number of credits. Use a negative number to debit.');
  }

  return parsed;
}

function parseOptionalDateTimeInput(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Enter a valid date and time.');
  }

  return parsed;
}

function normalizePromotionCode(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  return normalized.length > 0 ? normalized.slice(0, 50) : null;
}

function isReferralFraudReviewStatus(value: string): value is 'clear' | 'flagged' | 'blocked' {
  return value === 'clear' || value === 'flagged' || value === 'blocked';
}

function isPromotionCampaignStatus(value: string): value is 'draft' | 'active' | 'expired' | 'cancelled' {
  return value === 'draft' || value === 'active' || value === 'expired' || value === 'cancelled';
}

function buildPromotionCampaignMetadata(
  note: string | null,
  adminUser: AdminAppUser,
  existingMetadata?: Prisma.JsonValue,
) {
  const currentMetadata =
    existingMetadata && typeof existingMetadata === 'object' && !Array.isArray(existingMetadata)
      ? existingMetadata
      : {};

  return {
    ...currentMetadata,
    adminNote: note,
    lastManagedByAdminUserId: adminUser.userId,
    lastManagedByAdminEmail: adminUser.email,
    lastManagedAt: new Date().toISOString(),
  } satisfies Prisma.InputJsonValue;
}

export async function adjustWalletCreditsAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/wallet');

  try {
    const adminUser = await assertAdminAccess();
    const userEmail = getStringValue(formData, 'user_email').toLowerCase();
    const amountCredits = parseSignedCredits(getStringValue(formData, 'amount_credits'));
    const reason = getStringValue(formData, 'reason');

    if (!userEmail) {
      throw new Error('User email is required.');
    }

    if (!reason) {
      throw new Error('Adjustment reason is required.');
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!targetUser) {
      throw new Error('User not found for that email address.');
    }

    const adjustmentReferenceId = randomUUID();
    const result = await adjustWalletCreditsByAdmin({
      userId: targetUser.id,
      amountCredits,
      reason,
      referenceId: adjustmentReferenceId,
      metadata: {
        adminUserId: adminUser.userId,
        adminEmail: adminUser.email,
        targetEmail: targetUser.email,
      },
    });

    await recordAdminAudit(adminUser, {
      action: 'wallet.adjusted',
      entityType: 'WalletTransaction' as AuditLogEntityType,
      entityId: result.transaction.id,
      entityLabel: targetUser.email,
      targetUserId: targetUser.id,
      summary: `${getAdminActorLabel(adminUser)} ${amountCredits > 0 ? 'credited' : 'debited'} ${Math.abs(amountCredits)} wallet credits ${amountCredits > 0 ? 'to' : 'from'} ${targetUser.email}.`,
      details: {
        amountCredits,
        reason,
        adjustmentReferenceId,
        balanceAfterCredits: result.wallet.balanceCredits,
        targetName: targetUser.name,
        targetEmail: targetUser.email,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to adjust wallet credits.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Wallet credits adjusted successfully.',
  });
}

export async function updateReferralReviewStatusAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/wallet');

  try {
    const adminUser = await assertAdminAccess();
    const relationshipId = getStringValue(formData, 'relationship_id');
    const fraudReviewStatus = getStringValue(formData, 'fraud_review_status');
    const reviewReason = getNullableStringValue(formData, 'review_reason');

    if (!relationshipId || !isReferralFraudReviewStatus(fraudReviewStatus)) {
      throw new Error('Select a valid referral relationship and review status.');
    }

    const relationship = await prisma.referralRelationship.findUnique({
      where: { id: relationshipId },
      include: {
        referrer: {
          select: { id: true, name: true, email: true },
        },
        referred: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!relationship) {
      throw new Error('Referral relationship not found.');
    }

    const nextStatus =
      fraudReviewStatus === 'blocked'
        ? relationship.status === 'attached' ? 'rejected' : relationship.status
        : relationship.status === 'rejected'
          ? 'attached'
          : relationship.status;

    await prisma.referralRelationship.update({
      where: { id: relationshipId },
      data: {
        fraudReviewStatus,
        fraudReviewReason: reviewReason,
        status: nextStatus,
      },
    });

    await recordAdminAudit(adminUser, {
      action: 'referral.review.updated',
      entityType: 'ReferralRelationship' as AuditLogEntityType,
      entityId: relationship.id,
      entityLabel: relationship.referralCodeUsed,
      targetUserId: relationship.referredUserId,
      summary: `${getAdminActorLabel(adminUser)} updated referral review for ${relationship.referred.email}.`,
      details: {
        referrerEmail: relationship.referrer.email,
        referredEmail: relationship.referred.email,
        previousFraudReviewStatus: relationship.fraudReviewStatus,
        nextFraudReviewStatus: fraudReviewStatus,
        previousStatus: relationship.status,
        nextStatus,
        reviewReason,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to update referral review.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Referral review updated successfully.',
  });
}

export async function toggleReferralCodeStatusAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/wallet');

  try {
    const adminUser = await assertAdminAccess();
    const referralProfileId = getStringValue(formData, 'referral_profile_id');
    const mode = getStringValue(formData, 'mode');
    const disableReason = getNullableStringValue(formData, 'disable_reason');

    if (!referralProfileId || (mode !== 'disable' && mode !== 'enable')) {
      throw new Error('Select a valid referral profile and action.');
    }

    if (mode === 'disable' && !disableReason) {
      throw new Error('Provide a reason before disabling a referral code.');
    }

    const profile = await prisma.referralProfile.findUnique({
      where: { id: referralProfileId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!profile) {
      throw new Error('Referral profile not found.');
    }

    await prisma.referralProfile.update({
      where: { id: referralProfileId },
      data:
        mode === 'disable'
          ? {
              isDisabled: true,
              disabledAt: new Date(),
              disabledReason: disableReason,
            }
          : {
              isDisabled: false,
              disabledAt: null,
              disabledReason: null,
            },
    });

    if (mode === 'disable') {
      await prisma.referralRelationship.updateMany({
        where: {
          referralProfileId,
          qualifiedAt: null,
          rewardedAt: null,
          status: {
            in: ['attached', 'rejected'],
          },
        },
        data: {
          fraudReviewStatus: 'blocked',
          fraudReviewReason: disableReason ?? 'Referral code disabled by admin.',
          status: 'rejected',
        },
      });
    }

    await recordAdminAudit(adminUser, {
      action: mode === 'disable' ? 'referral.code.disabled' : 'referral.code.enabled',
      entityType: 'ReferralProfile' as AuditLogEntityType,
      entityId: profile.id,
      entityLabel: profile.referralCode,
      targetUserId: profile.userId,
      summary: `${getAdminActorLabel(adminUser)} ${mode === 'disable' ? 'disabled' : 're-enabled'} referral code ${profile.referralCode}.`,
      details: {
        referralCode: profile.referralCode,
        userEmail: profile.user.email,
        userName: profile.user.name,
        mode,
        disableReason,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to update the referral code status.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Referral code status updated successfully.',
  });
}

export async function createPromotionCampaignAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/wallet');

  try {
    const adminUser = await assertAdminAccess();
    const name = getStringValue(formData, 'name');
    const code = normalizePromotionCode(getNullableStringValue(formData, 'code'));
    const status = getStringValue(formData, 'status');
    const rewardCredits = Number.parseInt(getStringValue(formData, 'reward_credits'), 10);
    const startsAt = parseOptionalDateTimeInput(getNullableStringValue(formData, 'starts_at'));
    const endsAt = parseOptionalDateTimeInput(getNullableStringValue(formData, 'ends_at'));
    const maxRedemptionsRaw = getNullableStringValue(formData, 'max_redemptions');
    const adminNote = getNullableStringValue(formData, 'admin_note');

    if (!name) {
      throw new Error('Campaign name is required.');
    }

    if (!isPromotionCampaignStatus(status)) {
      throw new Error('Select a valid promotion status.');
    }

    if (!Number.isFinite(rewardCredits) || rewardCredits <= 0) {
      throw new Error('Reward credits must be a positive whole number.');
    }

    const maxRedemptions = maxRedemptionsRaw ? Number.parseInt(maxRedemptionsRaw, 10) : null;
    if (maxRedemptions !== null && (!Number.isFinite(maxRedemptions) || maxRedemptions <= 0)) {
      throw new Error('Max redemptions must be a positive whole number when provided.');
    }

    if (startsAt && endsAt && startsAt.getTime() > endsAt.getTime()) {
      throw new Error('Campaign end date must be after the start date.');
    }

    const campaign = await prisma.promotionCampaign.create({
      data: {
        id: randomUUID(),
        name: name.slice(0, 120),
        code,
        status,
        rewardCredits,
        startsAt,
        endsAt,
        maxRedemptions,
        metadata: buildPromotionCampaignMetadata(adminNote, adminUser),
      },
    });

    await recordAdminAudit(adminUser, {
      action: 'promotion.created',
      entityType: 'PromotionCampaign' as AuditLogEntityType,
      entityId: campaign.id,
      entityLabel: campaign.name,
      summary: `${getAdminActorLabel(adminUser)} created promotion campaign ${campaign.name}.`,
      details: {
        code: campaign.code,
        status: campaign.status,
        rewardCredits: campaign.rewardCredits,
        startsAt: campaign.startsAt?.toISOString() ?? null,
        endsAt: campaign.endsAt?.toISOString() ?? null,
        maxRedemptions: campaign.maxRedemptions,
        adminNote,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to create the promotion campaign.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Promotion campaign created successfully.',
  });
}

export async function updatePromotionCampaignStatusAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, '/admin/wallet');

  try {
    const adminUser = await assertAdminAccess();
    const campaignId = getStringValue(formData, 'campaign_id');
    const status = getStringValue(formData, 'status');
    const adminNote = getNullableStringValue(formData, 'admin_note');

    if (!campaignId || !isPromotionCampaignStatus(status)) {
      throw new Error('Select a valid promotion campaign and status.');
    }

    const existingCampaign = await prisma.promotionCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        status: true,
        metadata: true,
      },
    });

    if (!existingCampaign) {
      throw new Error('Promotion campaign not found.');
    }

    await prisma.promotionCampaign.update({
      where: { id: campaignId },
      data: {
        status,
        metadata: buildPromotionCampaignMetadata(adminNote, adminUser, existingCampaign.metadata),
      },
    });

    await recordAdminAudit(adminUser, {
      action: 'promotion.status.updated',
      entityType: 'PromotionCampaign' as AuditLogEntityType,
      entityId: existingCampaign.id,
      entityLabel: existingCampaign.name,
      summary: `${getAdminActorLabel(adminUser)} changed promotion campaign ${existingCampaign.name} to ${status}.`,
      details: {
        previousStatus: existingCampaign.status,
        nextStatus: status,
        adminNote,
      },
    });

    revalidateAdminPanel();
  } catch (error) {
    redirectWithResult(redirectTo, {
      tone: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to update the promotion campaign.',
    });
  }

  redirectWithResult(redirectTo, {
    tone: 'success',
    message: 'Promotion campaign updated successfully.',
  });
}

