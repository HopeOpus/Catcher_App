'use client';

import * as React from "react";
import { Pin, PinOff, StickyNote, Trash2 } from "lucide-react";
import {
  createAdminNoteAction,
  deleteAdminNoteAction,
  toggleAdminNotePinnedAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export type AdminNoteItem = {
  id: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorEmail: string;
};

type AdminNotesPanelProps = {
  title?: string;
  description?: string;
  redirectTo: string;
  targetType: "User" | "Property" | "StolenReport";
  targetId: string;
  targetLabel: string;
  notes: AdminNoteItem[];
  targetUserId?: string | null;
  propertyId?: string | null;
  stolenReportId?: string | null;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminNotesPanel({
  title = "Admin Notes",
  description = "Internal notes for admin coordination and follow-up.",
  redirectTo,
  targetType,
  targetId,
  targetLabel,
  notes,
  targetUserId = null,
  propertyId = null,
  stolenReportId = null,
}: AdminNotesPanelProps) {
  const [draft, setDraft] = React.useState("");

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#0F2651]">
          <StickyNote className="h-5 w-5 text-[#36689e]" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form
          action={createAdminNoteAction}
          className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <input type="hidden" name="redirect_to" value={redirectTo} />
          <input type="hidden" name="target_type" value={targetType} />
          <input type="hidden" name="target_id" value={targetId} />
          <input type="hidden" name="target_label" value={targetLabel} />
          <input type="hidden" name="target_user_id" value={targetUserId ?? ""} />
          <input type="hidden" name="property_id" value={propertyId ?? ""} />
          <input type="hidden" name="stolen_report_id" value={stolenReportId ?? ""} />
          <Textarea
            name="body"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add an internal note for other admins..."
            rows={4}
          />
          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="is_pinned" value="true" />
              Pin this note
            </label>
            <Button
              type="submit"
              className="bg-[#36689e] text-white hover:bg-[#0F2651]"
              disabled={draft.trim().length === 0}
            >
              Add Note
            </Button>
          </div>
        </form>

        {notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            No admin notes yet for this record.
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`rounded-2xl border px-4 py-4 ${
                  note.isPinned
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[#0F2651]">{note.authorName}</p>
                      <span className="text-xs text-slate-500">{note.authorEmail}</span>
                      {note.isPinned ? (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                          Pinned
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                      {note.body}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      Updated {formatDateTime(note.updatedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={toggleAdminNotePinnedAction}>
                      <input type="hidden" name="redirect_to" value={redirectTo} />
                      <input type="hidden" name="note_id" value={note.id} />
                      <input
                        type="hidden"
                        name="is_pinned"
                        value={note.isPinned ? "false" : "true"}
                      />
                      <Button type="submit" variant="outline" size="sm">
                        {note.isPinned ? (
                          <>
                            <PinOff className="mr-2 h-4 w-4" />
                            Unpin
                          </>
                        ) : (
                          <>
                            <Pin className="mr-2 h-4 w-4" />
                            Pin
                          </>
                        )}
                      </Button>
                    </form>
                    <form action={deleteAdminNoteAction}>
                      <input type="hidden" name="redirect_to" value={redirectTo} />
                      <input type="hidden" name="note_id" value={note.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
