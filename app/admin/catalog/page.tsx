import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PROPERTY_TYPES } from '@/lib/catcher-domain';
import { prisma } from '@/lib/prisma';
import { requireAdminPageAccess } from '@/lib/admin-access';
import {
  createCatalogItemAction,
} from '../actions';
import {
  AdminPageHeader,
  AdminPageNotice,
  getAdminPageNotice,
  type AdminPageSearchParams,
} from '../admin-page-utils';
import { AdminCatalogList } from './admin-catalog-list';

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams?: AdminPageSearchParams;
}) {
  await requireAdminPageAccess();
  const notice = await getAdminPageNotice(searchParams);

  const catalogItems = await prisma.preRegisteredProperty.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Catalog"
        description="Manage the pre-registered property catalog shown publicly across the platform."
      />

      <AdminPageNotice notice={notice} />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-5">
          <CardTitle className="text-[#0F2651]">Create Catalog Item</CardTitle>
          <CardDescription>Add a new pre-registered property to the catalog.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={createCatalogItemAction} className="space-y-4">
            <input type="hidden" name="redirect_to" value="/admin/catalog" />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor="catalog-name">
                  Name
                </label>
                <input
                  id="catalog-name"
                  name="name"
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor="catalog-type">
                  Type
                </label>
                <select
                  id="catalog-type"
                  name="type"
                  defaultValue="Other"
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor="catalog-image-url">
                  Image URL
                </label>
                <input
                  id="catalog-image-url"
                  name="image_url"
                  placeholder="https://..."
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                />
                <p className="text-xs text-slate-500">
                  Paste an external image URL or upload directly from your device below.
                </p>
              </div>
              <div className="space-y-2 xl:col-span-3">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor="catalog-image-file">
                  Upload Image From Device
                </label>
                <input
                  id="catalog-image-file"
                  name="image_file"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#36689e] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#0F2651] focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                />
                <p className="text-xs text-slate-500">
                  If you provide both, the uploaded image will be used.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0F2651]" htmlFor="catalog-description">
                Description
              </label>
              <textarea
                id="catalog-description"
                name="description"
                rows={4}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
              />
            </div>
            <Button type="submit" className="bg-[#36689e] text-white hover:bg-[#0F2651]">
              Create Catalog Item
            </Button>
          </form>
        </CardContent>
      </Card>

      <AdminCatalogList
        catalogItems={catalogItems.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          description: item.description,
          imageUrl: item.imageUrl,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
