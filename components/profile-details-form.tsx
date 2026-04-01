'use client';

import * as React from 'react';
import { Camera, Trash2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { normalizeStoredPhotoUrl } from '@/lib/catcher-domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PROFILE_UPDATED_EVENT,
  type UserProfileSnapshot,
  type UserProfileStatus,
} from '@/lib/profile';

type ProfileDetailsFormProps = {
  initialProfile: UserProfileSnapshot;
  submitLabel?: string;
  variant?: 'page' | 'modal';
  onSaved?: (profileStatus: UserProfileStatus) => void;
};

type FormState = {
  profileImageUrl: string;
  phoneNumber: string;
  nextOfKinEmail: string;
  nextOfKinPhone: string;
};

function getInitialFormState(profile: UserProfileSnapshot): FormState {
  return {
    profileImageUrl: profile.profileImageUrl ?? '',
    phoneNumber: profile.phoneNumber ?? '',
    nextOfKinEmail: profile.nextOfKinEmail ?? '',
    nextOfKinPhone: profile.nextOfKinPhone ?? '',
  };
}

function getInitials(name: string) {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'CU';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

function getDisplayImageUrl(url: string) {
  return url ? normalizeStoredPhotoUrl(url) : '';
}

export function ProfileDetailsForm({
  initialProfile,
  submitLabel = 'Save Profile',
  variant = 'page',
  onSaved,
}: ProfileDetailsFormProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formState, setFormState] = React.useState<FormState>(
    getInitialFormState(initialProfile),
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<keyof FormState, string>>
  >({});

  React.useEffect(() => {
    setFormState(getInitialFormState(initialProfile));
  }, [initialProfile]);

  const handleChange =
    (field: keyof Omit<FormState, 'profileImageUrl'>) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((current) => ({
        ...current,
        [field]: event.target.value,
      }));

      setFieldErrors((current) => ({
        ...current,
        [field]: undefined,
      }));

      setFormError('');
      setSuccessMessage('');
    };

  const handleProfileImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploadingImage(true);
    setFormError('');
    setSuccessMessage('');
    setFieldErrors((current) => ({
      ...current,
      profileImageUrl: undefined,
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('propertyId', 'profile-picture');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.url) {
        throw new Error(
          payload?.error || 'Failed to upload profile picture.',
        );
      }

      setFormState((current) => ({
        ...current,
        profileImageUrl: payload.url,
      }));
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setFieldErrors((current) => ({
        ...current,
        profileImageUrl:
          error instanceof Error
            ? error.message
            : 'Failed to upload profile picture.',
      }));
    } finally {
      setIsUploadingImage(false);

      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleRemoveProfileImage = () => {
    setFormState((current) => ({
      ...current,
      profileImageUrl: '',
    }));

    setFieldErrors((current) => ({
      ...current,
      profileImageUrl: undefined,
    }));

    setSuccessMessage('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError('');
    setSuccessMessage('');
    setFieldErrors({});

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || 'Failed to update profile.');
        setFieldErrors(data.fieldErrors || {});
        return;
      }

      const updatedProfileStatus = data as UserProfileStatus & {
        message?: string;
      };

      setSuccessMessage(
        updatedProfileStatus.message || 'Profile updated successfully.',
      );
      setFormState(getInitialFormState(updatedProfileStatus.profile));
      onSaved?.(updatedProfileStatus);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(PROFILE_UPDATED_EVENT, {
            detail: updatedProfileStatus,
          }),
        );
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      setFormError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isModal = variant === 'modal';
  const displayImageUrl = getDisplayImageUrl(formState.profileImageUrl);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className={`grid gap-4 ${
          isModal ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]'
        }`}>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {displayImageUrl ? (
                <div
                  aria-label="Profile picture preview"
                  className="h-28 w-28 rounded-full border border-slate-200 bg-cover bg-center bg-no-repeat shadow-sm"
                  style={{ backgroundImage: `url("${displayImageUrl}")` }}
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#36689e]/15 text-2xl font-semibold text-[#0F2651] shadow-sm">
                  {getInitials(initialProfile.name)}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-2 shadow-sm">
                <Camera className="h-4 w-4 text-[#36689e]" />
              </div>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-[#0F2651]">
              Profile Picture
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Add an optional profile picture for your account.
            </p>

            <Input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleProfileImageUpload}
            />

            <div className="mt-4 flex w-full flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="w-full border-[#36689e] text-[#0F2651]">
                <Upload className="mr-2 h-4 w-4" />
                {isUploadingImage ? 'Uploading...' : displayImageUrl ? 'Change Picture' : 'Upload Picture'}
              </Button>

              {displayImageUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemoveProfileImage}
                  className="w-full text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Picture
                </Button>
              ) : null}
            </div>

            {fieldErrors.profileImageUrl ? (
              <p className="mt-3 text-sm text-red-600">
                {fieldErrors.profileImageUrl}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div
            className={`grid gap-4 ${
              isModal ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
            }`}>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Account Name
              </p>
              <p className="mt-2 text-sm font-medium text-[#0F2651]">
                {initialProfile.name}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Account Email
              </p>
              <p className="mt-2 break-all text-sm font-medium text-[#0F2651]">
                {initialProfile.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input
                id="phone-number"
                type="tel"
                placeholder="+234 800 000 0000"
                value={formState.phoneNumber}
                onChange={handleChange('phoneNumber')}
              />
              {fieldErrors.phoneNumber ? (
                <p className="text-sm text-red-600">{fieldErrors.phoneNumber}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="next-of-kin-email">Next of Kin Email</Label>
              <Input
                id="next-of-kin-email"
                type="email"
                placeholder="nextofkin@example.com"
                value={formState.nextOfKinEmail}
                onChange={handleChange('nextOfKinEmail')}
              />
              {fieldErrors.nextOfKinEmail ? (
                <p className="text-sm text-red-600">
                  {fieldErrors.nextOfKinEmail}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="next-of-kin-phone">Next of Kin Phone Number</Label>
              <Input
                id="next-of-kin-phone"
                type="tel"
                placeholder="+234 800 000 0000"
                value={formState.nextOfKinPhone}
                onChange={handleChange('nextOfKinPhone')}
              />
              {fieldErrors.nextOfKinPhone ? (
                <p className="text-sm text-red-600">
                  {fieldErrors.nextOfKinPhone}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {formError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      ) : null}

      {successMessage && !isModal ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      <div className={`flex ${isModal ? 'flex-col gap-3' : 'justify-end'}`}>
        <Button
          type="submit"
          disabled={isSaving || isUploadingImage}
          className="bg-[#36689e] text-white hover:bg-[#0F2651]">
          {isSaving ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
