"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Shield, ShieldCheck } from "lucide-react";
import { AdminAuditLogList, type AdminAuditLogItem } from "@/components/admin/admin-audit-log-list";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminNotesPanel, type AdminNoteItem } from "@/components/admin/admin-notes-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { bulkUpdateUserRoleAction, updateUserRoleAction } from "../actions";
import { formatAdminDateTime } from "../admin-page-utils";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: "User" | "Admin";
  createdAt: string;
  propertyCount: number;
  stolenReportCount: number;
  propertyCoverageCount: number;
};

function getRoleBadgeClass(role: AdminUserRow["role"]) {
  return role === "Admin"
    ? "bg-[#0F2651] text-white"
    : "bg-slate-100 text-slate-700";
}

function isDateWithinRange(value: string, from: string, to: string) {
  const date = new Date(value).getTime();

  if (Number.isNaN(date)) {
    return false;
  }

  if (from) {
    const fromDate = new Date(`${from}T00:00:00`).getTime();

    if (date < fromDate) {
      return false;
    }
  }

  if (to) {
    const toDate = new Date(`${to}T23:59:59.999`).getTime();

    if (date > toDate) {
      return false;
    }
  }

  return true;
}

export function AdminUsersTable({
  users,
  notesByUserId,
  auditLogsByUserId,
}: {
  users: AdminUserRow[];
  notesByUserId: Record<string, AdminNoteItem[]>;
  auditLogsByUserId: Record<string, AdminAuditLogItem[]>;
}) {
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(
    users[0]?.id ?? null,
  );
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [roleFilter, setRoleFilter] = React.useState<"all" | AdminUserRow["role"]>("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const filteredUsers = React.useMemo(
    () =>
      users.filter((user) => {
        if (roleFilter !== "all" && user.role !== roleFilter) {
          return false;
        }

        return isDateWithinRange(user.createdAt, dateFrom, dateTo);
      }),
    [dateFrom, dateTo, roleFilter, users],
  );

  const filteredUserIds = React.useMemo(
    () => filteredUsers.map((user) => user.id),
    [filteredUsers],
  );

  React.useEffect(() => {
    setSelectedUserIds((current) =>
      current.filter((id) => filteredUserIds.includes(id)),
    );
  }, [filteredUserIds]);

  React.useEffect(() => {
    if (!filteredUsers.length) {
      setSelectedUserId(null);
      return;
    }

    if (
      !selectedUserId ||
      !filteredUsers.some((user) => user.id === selectedUserId)
    ) {
      setSelectedUserId(filteredUsers[0]?.id ?? null);
    }
  }, [filteredUsers, selectedUserId]);

  const selectedUser =
    filteredUsers.find((user) => user.id === selectedUserId) ?? null;

  const selectedUserNotes = selectedUser
    ? notesByUserId[selectedUser.id] ?? []
    : [];
  const selectedUserAuditLogs = selectedUser
    ? auditLogsByUserId[selectedUser.id] ?? []
    : [];

  const allVisibleSelected =
    filteredUserIds.length > 0 &&
    filteredUserIds.every((id) => selectedUserIds.includes(id));

  const toggleUserSelection = React.useCallback((userId: string, checked: boolean) => {
    setSelectedUserIds((current) => {
      if (checked) {
        return current.includes(userId) ? current : [...current, userId];
      }

      return current.filter((id) => id !== userId);
    });
  }, []);

  const columns = React.useMemo<ColumnDef<AdminUserRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <input
            type="checkbox"
            aria-label="Select all visible users"
            checked={allVisibleSelected}
            onChange={(event) =>
              setSelectedUserIds(event.target.checked ? filteredUserIds : [])
            }
            className="h-4 w-4 rounded border-slate-300 text-[#36689e] focus:ring-[#36689e]"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.email}`}
            checked={selectedUserIds.includes(row.original.id)}
            onChange={(event) =>
              toggleUserSelection(row.original.id, event.target.checked)
            }
            onClick={(event) => event.stopPropagation()}
            className="h-4 w-4 rounded border-slate-300 text-[#36689e] focus:ring-[#36689e]"
          />
        ),
      },
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-semibold text-[#0F2651]">{row.original.name}</p>
            <p className="text-xs text-slate-500">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge className={getRoleBadgeClass(row.original.role)}>
            {row.original.role}
          </Badge>
        ),
      },
      {
        accessorKey: "propertyCount",
        header: "Properties",
      },
      {
        accessorKey: "stolenReportCount",
        header: "Reports",
      },
      {
        accessorKey: "propertyCoverageCount",
        header: "Subscriptions",
      },
      {
        accessorKey: "createdAt",
        header: "Registered",
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
              setSelectedUserId(row.original.id);
            }}
          >
            Manage
          </Button>
        ),
      },
    ],
    [allVisibleSelected, filteredUserIds, selectedUserIds, toggleUserSelection],
  );

  return (
    <div className="space-y-6">
      <AdminDataTable
        columns={columns}
        data={filteredUsers}
        baseCount={users.length}
        selectedCount={selectedUserIds.length}
        entityLabel="users"
        searchPlaceholder="Search users by name, email, or role"
        emptyStateTitle="No users found"
        emptyStateDescription="Signed-in Clerk users will appear here once they have synchronized into the app database."
        searchPredicate={(user, query) =>
          [user.name, user.email, user.role].some((value) =>
            value.toLowerCase().includes(query),
          )
        }
        selectedRowId={selectedUserId}
        onSelectRow={setSelectedUserId}
        toolbar={
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor="user-role-filter">
                  Role
                </label>
                <select
                  id="user-role-filter"
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(event.target.value as "all" | AdminUserRow["role"])
                  }
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                >
                  <option value="all">All roles</option>
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor="user-date-from">
                  Registered From
                </label>
                <Input
                  id="user-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor="user-date-to">
                  Registered To
                </label>
                <Input
                  id="user-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button asChild variant="outline" className="w-full">
                  <a href="/admin/users/export">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </a>
                </Button>
              </div>
            </div>

            <form
              action={bulkUpdateUserRoleAction}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:flex-row xl:items-end xl:justify-between"
              onSubmit={(event) => {
                if (selectedUserIds.length === 0) {
                  return;
                }

                const confirmed = window.confirm(
                  `Apply this role change to ${selectedUserIds.length} selected user${selectedUserIds.length === 1 ? '' : 's'}?`,
                );

                if (!confirmed) {
                  event.preventDefault();
                }
              }}
            >
              <input
                type="hidden"
                name="selected_ids"
                value={JSON.stringify(selectedUserIds)}
              />
              <input type="hidden" name="redirect_to" value="/admin/users" />

              <div className="space-y-1">
                <p className="text-sm font-medium text-[#0F2651]">Bulk access update</p>
                <p className="text-sm text-slate-600">
                  {selectedUserIds.length === 0
                    ? "Select one or more users to change access in one step."
                    : `${selectedUserIds.length} user${selectedUserIds.length === 1 ? "" : "s"} selected.`}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F2651]" htmlFor="bulk-user-role">
                    New Role
                  </label>
                  <select
                    id="bulk-user-role"
                    name="role"
                    defaultValue="User"
                    className="h-10 min-w-40 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  className="bg-[#36689e] text-white hover:bg-[#0F2651]"
                  disabled={selectedUserIds.length === 0}
                >
                  Save Bulk Role Update
                </Button>
              </div>
            </form>
          </div>
        }
        renderMobileCard={(user) => (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  aria-label={`Select ${user.email}`}
                  checked={selectedUserIds.includes(user.id)}
                  onChange={(event) => toggleUserSelection(user.id, event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#36689e] focus:ring-[#36689e]"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-[#0F2651]">{user.name}</p>
                  <p className="break-all text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <Badge className={getRoleBadgeClass(user.role)}>{user.role}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Properties</p>
                <p className="mt-1 font-semibold text-[#0F2651]">{user.propertyCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Reports</p>
                <p className="mt-1 font-semibold text-[#0F2651]">{user.stolenReportCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Subscriptions</p>
                <p className="mt-1 font-semibold text-[#0F2651]">{user.propertyCoverageCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Registered</p>
                <p className="mt-1 font-semibold text-[#0F2651]">{formatAdminDateTime(user.createdAt)}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setSelectedUserId(user.id)}
            >
              Manage Access
            </Button>
          </div>
        )}
      />

      {selectedUser ? (
        <div className="space-y-6">
          <Card className="overflow-hidden border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="text-[#0F2651]">{selectedUser.name}</CardTitle>
                  <CardDescription className="mt-1 break-all">
                    {selectedUser.email}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={getRoleBadgeClass(selectedUser.role)}>
                    {selectedUser.role}
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-700">
                    Joined {formatAdminDateTime(selectedUser.createdAt)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Registered Properties
                  </p>
                  <p className="mt-1 text-base font-semibold text-[#0F2651]">
                    {selectedUser.propertyCount}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stolen Reports
                  </p>
                  <p className="mt-1 text-base font-semibold text-[#0F2651]">
                    {selectedUser.stolenReportCount}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Subscription Records
                  </p>
                  <p className="mt-1 text-base font-semibold text-[#0F2651]">
                    {selectedUser.propertyCoverageCount}
                  </p>
                </div>
              </div>

              <form
                action={updateUserRoleAction}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-end"
                onSubmit={(event) => {
                  const confirmed = window.confirm(
                    `Save the access update for ${selectedUser.email}?`,
                  );

                  if (!confirmed) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="user_id" value={selectedUser.id} />
                <input type="hidden" name="redirect_to" value="/admin/users" />
                <div className="w-full max-w-xs space-y-2">
                  <label
                    className="text-sm font-medium text-[#0F2651]"
                    htmlFor={`role-${selectedUser.id}`}
                  >
                    Access Level
                  </label>
                  <select
                    id={`role-${selectedUser.id}`}
                    name="role"
                    defaultValue={selectedUser.role}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <Button type="submit" className="bg-[#36689e] text-white hover:bg-[#0F2651]">
                  {selectedUser.role === "Admin" ? (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Save Admin Access
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Save Access
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <AdminNotesPanel
              redirectTo="/admin/users"
              targetType="User"
              targetId={selectedUser.id}
              targetLabel={selectedUser.email}
              targetUserId={selectedUser.id}
              notes={selectedUserNotes}
            />
            <AdminAuditLogList logs={selectedUserAuditLogs} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
