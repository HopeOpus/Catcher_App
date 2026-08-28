"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PROPERTY_TYPES } from "@/lib/catcher-domain";
import {
  deleteCatalogItemAction,
  updateCatalogItemAction,
} from "../actions";
import { formatAdminDateTime } from "../admin-page-utils";

export type AdminCatalogRow = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
};

export function AdminCatalogList({
  catalogItems,
}: {
  catalogItems: AdminCatalogRow[];
}) {
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(
    catalogItems[0]?.id ?? null,
  );

  React.useEffect(() => {
    if (!catalogItems.length) {
      setSelectedItemId(null);
      return;
    }

    if (!selectedItemId || !catalogItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(catalogItems[0]?.id ?? null);
    }
  }, [catalogItems, selectedItemId]);

  const selectedItem =
    catalogItems.find((item) => item.id === selectedItemId) ?? null;

  const columns = React.useMemo<ColumnDef<AdminCatalogRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Catalog Item",
      },
      {
        accessorKey: "type",
        header: "Type",
      },
      {
        accessorKey: "imageUrl",
        header: "Image",
        cell: ({ row }) =>
          row.original.imageUrl ? (
            <a
              href={row.original.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[#36689e] underline-offset-4 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              Open image
            </a>
          ) : (
            <span className="text-sm text-slate-500">Not set</span>
          ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatAdminDateTime(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Action",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedItemId(row.original.id);
            }}
          >
            Manage
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <AdminDataTable
        columns={columns}
        data={catalogItems}
        baseCount={catalogItems.length}
        entityLabel="catalog items"
        searchPlaceholder="Search catalog items by name, type, or description"
        emptyStateTitle="No catalog items found"
        emptyStateDescription="Create a pre-registered property above and it will appear here for ongoing admin management."
        searchPredicate={(item, query) =>
          [item.name, item.type, item.description ?? "", item.imageUrl ?? ""].some((value) =>
            value.toLowerCase().includes(query),
          )
        }
        selectedRowId={selectedItemId}
        onSelectRow={setSelectedItemId}
        renderMobileCard={(item) => (
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-[#0F2651]">{item.name}</p>
              <p className="text-xs text-slate-500">{item.type}</p>
            </div>
            <p className="text-xs text-slate-500">
              Created {formatAdminDateTime(item.createdAt)}
            </p>
            {item.imageUrl ? (
              <a
                href={item.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-sm text-[#36689e] underline-offset-4 hover:underline"
              >
                Open image
              </a>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setSelectedItemId(item.id)}
            >
              Manage Item
            </Button>
          </div>
        )}
      />

      {selectedItem ? (
        <Card className="overflow-hidden border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-[#0F2651]">{selectedItem.name}</CardTitle>
            <CardDescription>
              {selectedItem.type} · Created {formatAdminDateTime(selectedItem.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <form
              action={updateCatalogItemAction}
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4"
              onSubmit={(event) => {
                const confirmed = window.confirm(
                  `Save catalog changes for ${selectedItem.name}?`,
                );

                if (!confirmed) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="catalog_item_id" value={selectedItem.id} />
              <input type="hidden" name="redirect_to" value="/admin/catalog" />
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F2651]" htmlFor={`name-${selectedItem.id}`}>
                    Name
                  </label>
                  <Input id={`name-${selectedItem.id}`} name="name" defaultValue={selectedItem.name} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F2651]" htmlFor={`type-${selectedItem.id}`}>
                    Type
                  </label>
                  <select
                    id={`type-${selectedItem.id}`}
                    name="type"
                    defaultValue={selectedItem.type}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F2651]" htmlFor={`image-${selectedItem.id}`}>
                    Image URL
                  </label>
                  <Input
                    id={`image-${selectedItem.id}`}
                    name="image_url"
                    defaultValue={selectedItem.imageUrl ?? ""}
                  />
                  <p className="text-xs text-slate-500">
                    Paste a link or upload a fresh image below.
                  </p>
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <label className="text-sm font-medium text-[#0F2651]" htmlFor={`image-file-${selectedItem.id}`}>
                    Upload Image From Device
                  </label>
                  <input
                    id={`image-file-${selectedItem.id}`}
                    name="image_file"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#36689e] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#0F2651] focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                  />
                  <p className="text-xs text-slate-500">
                    If you provide both, the uploaded image replaces the link.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor={`description-${selectedItem.id}`}>
                  Description
                </label>
                <Textarea
                  id={`description-${selectedItem.id}`}
                  name="description"
                  defaultValue={selectedItem.description ?? ""}
                  rows={4}
                />
              </div>
              <Button type="submit" className="bg-[#36689e] text-white hover:bg-[#0F2651]">
                Save Catalog Item
              </Button>
            </form>

            <form
              action={deleteCatalogItemAction}
              className="rounded-2xl border border-red-200 bg-red-50 p-4"
              onSubmit={(event) => {
                const confirmed = window.confirm(
                  `Delete ${selectedItem.name} from the public catalog? This cannot be undone.`,
                );

                if (!confirmed) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="catalog_item_id" value={selectedItem.id} />
              <input type="hidden" name="redirect_to" value="/admin/catalog" />
              <p className="text-sm text-red-700">
                Delete this catalog item if it should no longer appear in the public catalog.
              </p>
              <Button type="submit" variant="ghost" className="mt-3 px-0 text-red-700 hover:text-red-800">
                Delete Catalog Item
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
