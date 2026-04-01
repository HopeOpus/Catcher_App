import { redirect } from 'next/navigation';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ProfileDetailsForm } from '@/components/profile-details-form';
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from '@/lib/authenticated-user';
import { prisma } from '@/lib/prisma';
import { buildUserProfileStatus } from '@/lib/profile';

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

export default async function ProfilePage() {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    redirect('/auth/signin');
  }

  await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

  const user = await prisma.user.findUnique({
    where: { id: authenticatedUser.userId },
    select: {
      name: true,
      email: true,
      profileImageUrl: true,
      phoneNumber: true,
      nextOfKinEmail: true,
      nextOfKinPhone: true,
    },
  });

  if (!user) {
    redirect('/auth/signin');
  }

  const profileStatus = buildUserProfileStatus(user);
  const requiredItems = [
    {
      label: 'Phone number added',
      complete: Boolean(profileStatus.profile.phoneNumber),
      icon: Phone,
    },
    {
      label: 'Next of kin email added',
      complete: Boolean(profileStatus.profile.nextOfKinEmail),
      icon: Mail,
    },
    {
      label: 'Next of kin phone added',
      complete: Boolean(profileStatus.profile.nextOfKinPhone),
      icon: ShieldCheck,
    },
  ];
  const optionalItems = [
    {
      label: 'Profile picture uploaded',
      complete: Boolean(profileStatus.profile.profileImageUrl),
      icon: Camera,
    },
  ];
  const completedRequiredCount = requiredItems.filter((item) => item.complete).length;
  const completionPercentage = Math.round(
    (completedRequiredCount / requiredItems.length) * 100,
  );
  const displayImageUrl = profileStatus.profile.profileImageUrl;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-[#36689e]/20 bg-gradient-to-br from-white via-[#f7fbff] to-[#e8f1f8] px-6 py-8 shadow-sm sm:px-8">
        <div
          aria-hidden
          className="absolute right-0 top-0 h-44 w-44 rounded-full bg-[#36689e]/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <Badge
              className={
                profileStatus.profileComplete
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }>
              {profileStatus.profileComplete
                ? 'Profile Complete'
                : 'Complete Your Profile'}
            </Badge>
            <h1 className="mt-4 text-3xl font-bold text-[#0F2651] sm:text-4xl">
              Build a complete account profile
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              Add your direct contact details, emergency next-of-kin information,
              and an optional profile picture so your Catcher account is easier to
              verify, support, and manage whenever you need help.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="min-w-[180px] rounded-2xl border border-white/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur">
                <p className="text-2xl font-bold text-[#0F2651]">
                  {completedRequiredCount}/{requiredItems.length}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  required profile details completed
                </p>
              </div>
              <div className="min-w-[180px] rounded-2xl border border-white/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur">
                <p className="text-2xl font-bold text-[#0F2651]">
                  {optionalItems[0].complete ? 'Added' : 'Optional'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  profile picture status
                </p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center gap-4">
              {displayImageUrl ? (
                <div
                  aria-label="Profile picture"
                  className="h-20 w-20 rounded-2xl border border-slate-200 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url("${displayImageUrl}")` }}
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#36689e]/15 text-2xl font-semibold text-[#0F2651]">
                  {getInitials(profileStatus.profile.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Account Summary
                </p>
                <h2 className="mt-2 truncate text-xl font-semibold text-[#0F2651]">
                  {profileStatus.profile.name}
                </h2>
                <p className="mt-1 break-all text-sm text-slate-600">
                  {profileStatus.profile.email}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Completion</span>
                <span className="font-semibold text-[#0F2651]">
                  {completionPercentage}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#36689e] to-[#0F2651]"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card className="overflow-hidden border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70">
            <CardTitle className="text-[#0F2651]">Account Summary</CardTitle>
            <CardDescription>
              A quick snapshot of the information already attached to your
              Catcher account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <User className="h-4 w-4 text-[#36689e]" />
                  Account Name
                </div>
                <p className="mt-2 text-base font-semibold text-[#0F2651]">
                  {profileStatus.profile.name}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Mail className="h-4 w-4 text-[#36689e]" />
                  Account Email
                </div>
                <p className="mt-2 break-all text-base font-semibold text-[#0F2651]">
                  {profileStatus.profile.email}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {requiredItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-[#36689e]/10 p-2 text-[#0F2651]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {item.label}
                      </span>
                    </div>
                    {item.complete ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                        <CheckCircle2 className="h-4 w-4" />
                        Done
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                        <AlertTriangle className="h-4 w-4" />
                        Needed
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-[#0F2651]">Setup Guidance</CardTitle>
            <CardDescription>
              A complete profile helps your account feel trustworthy and easier
              to support.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
              <h3 className="font-semibold text-[#0F2651]">
                Why this information matters
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Your phone number and next-of-kin contact details give your
                Catcher account the basic information needed for follow-up,
                support checks, and better account readiness.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 px-4 py-4">
                <p className="text-sm font-semibold text-[#0F2651]">
                  1. Add your direct phone number
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  This gives your account a clear primary contact point.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-4">
                <p className="text-sm font-semibold text-[#0F2651]">
                  2. Add next-of-kin email and phone
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  These details complete the emergency contact side of your
                  profile.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-4">
                <p className="text-sm font-semibold text-[#0F2651]">
                  3. Upload a profile picture
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  This step is optional, but it makes your account feel more
                  complete and personal.
                </p>
              </div>
            </div>

            {!profileStatus.profileComplete ? (
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-4">
                <h3 className="font-semibold text-yellow-900">
                  Still missing a few things
                </h3>
                <p className="mt-2 text-sm text-yellow-800">
                  Missing fields: {profileStatus.missingFields.join(', ')}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-4">
                <h3 className="font-semibold text-green-900">
                  Your account profile is complete
                </h3>
                <p className="mt-2 text-sm text-green-800">
                  You can still return here anytime to update contact details or
                  change your profile picture.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card id="profile-form" className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-[#0F2651]">
            Profile Details and Emergency Contact
          </CardTitle>
          <CardDescription>
            Keep your contact information current and upload a profile picture if
            you want your account to feel more complete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileDetailsForm
            initialProfile={profileStatus.profile}
            submitLabel={
              profileStatus.profileComplete ? 'Save Changes' : 'Complete Profile'
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
