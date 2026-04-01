import type { ReactNode } from 'react';
import { AdminLayoutShell } from '@/components/admin-layout-shell';
import { requireAdminPageAccess } from '@/lib/admin-access';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const adminUser = await requireAdminPageAccess();

  return <AdminLayoutShell adminName={adminUser.name}>{children}</AdminLayoutShell>;
}
