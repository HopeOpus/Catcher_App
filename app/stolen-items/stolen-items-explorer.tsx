"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Calendar, MapPin, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PublicStolenItem = {
  id: string;
  property_name: string;
  serial_number: string;
  date_reported: string;
  location: string;
  description: string;
  status: string;
};

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

export function StolenItemsExplorer({
  items,
}: {
  items: PublicStolenItem[];
}) {
  const [query, setQuery] = React.useState("");
  const deferredQuery = React.useDeferredValue(query);
  const normalizedQuery = normalizeValue(deferredQuery);

  const filteredItems = React.useMemo(() => {
    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) =>
      [
        item.property_name,
        item.serial_number,
        item.location,
        item.description,
        item.status,
      ].some((value) => normalizeValue(value).includes(normalizedQuery)),
    );
  }, [items, normalizedQuery]);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-xl font-semibold text-[#0F2651]">
              Search Stolen Items
            </h2>
            <p className="text-sm text-slate-600">
              Search by item name, serial number, location, report description, or status.
            </p>
          </div>

          <div className="w-full max-w-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, serial number, location, or status"
                className="h-12 rounded-2xl border-slate-300 pl-10 pr-12"
              />
              {query ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {normalizedQuery
              ? `Showing ${filteredItems.length} of ${items.length} records for "${query.trim()}".`
              : `Showing all ${items.length} public stolen-item records.`}
          </p>
          {normalizedQuery ? (
            <Button type="button" variant="link" className="h-auto p-0 text-[#36689e]" onClick={() => setQuery("")}>
              Clear search
            </Button>
          ) : null}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h2 className="text-2xl font-semibold text-[#0F2651]">No matching stolen items found</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Try a different property name, serial number, location, or status keyword.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex-grow p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-xl bg-red-50 p-3 text-red-600">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <Badge className="border-none bg-red-100 text-red-800">
                    {item.status || "Reported Stolen"}
                  </Badge>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-[#0F2651]">{item.property_name}</h3>
                <div className="mb-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-1 font-medium text-slate-700">
                      SN: {item.serial_number}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                    <span>{item.location || "Location not specified"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{new Date(item.date_reported).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="line-clamp-3 text-sm text-slate-600">{item.description}</p>
              </div>
              <div className="mt-auto border-t border-slate-100 bg-slate-50 px-6 py-4">
                <Link
                  href={`/stolen-items/${item.id}`}
                  className="block w-full text-center text-sm font-medium text-[#36689e] transition-colors hover:text-[#0F2651]"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
