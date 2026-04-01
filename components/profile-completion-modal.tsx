'use client';

import Link from 'next/link';
import * as React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileDetailsForm } from '@/components/profile-details-form';
import type { UserProfileStatus } from '@/lib/profile';

type ProfileCompletionModalProps = {
  profileStatus: UserProfileStatus | null;
  isOpen: boolean;
  onDismiss: () => void;
  onCompleted: (profileStatus: UserProfileStatus) => void;
};

export function ProfileCompletionModal({
  profileStatus,
  isOpen,
  onDismiss,
  onCompleted,
}: ProfileCompletionModalProps) {
  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onDismiss]);

  if (!isOpen || !profileStatus) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/70 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onDismiss();
        }
      }}>
      <div className="flex min-h-full items-center justify-center py-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-completion-title"
          className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-[#36689e]/10 p-3 text-[#0F2651]">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h2
                    id="profile-completion-title"
                    className="text-2xl font-semibold text-[#0F2651]">
                    Complete your profile
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Before you continue, please add the missing contact details
                    for your account. You can update them again later from your
                    profile page.
                  </p>
                  {profileStatus.missingFields.length > 0 ? (
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Missing: {profileStatus.missingFields.join(', ')}
                    </p>
                  ) : null}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="shrink-0 text-slate-500 hover:bg-slate-100 hover:text-[#0F2651]"
                aria-label="Close profile completion modal">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
            <ProfileDetailsForm
              initialProfile={profileStatus.profile}
              submitLabel="Save and Continue"
              variant="modal"
              onSaved={onCompleted}
            />

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={onDismiss}
                className="border-slate-300 text-slate-700 hover:bg-slate-50">
                Close for now
              </Button>
              <Button
                asChild
                variant="ghost"
                className="justify-start px-0 text-[#36689e] hover:text-[#0F2651]">
                <Link href="/dashboard/profile">Open full profile page</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
