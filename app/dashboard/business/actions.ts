'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  AccountScopeError,
  loadBusinessScope,
  resolveAccountScope,
  type BusinessAccountScope,
} from '@/lib/account-scope';
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
  type AuthenticatedAppUser,
} from '@/lib/authenticated-user';
import {
  ACTIVE_ACCOUNT_COOKIE,
  PERSONAL_ACCOUNT_KEY,
  isBusinessMemberRole,
  isInvitableBusinessRole,
} from '@/lib/business/constants';
import {
  BusinessActionError,
  acceptBusinessInvite,
  changeMemberRole,
  createBusiness,
  createBusinessInvite,
  leaveBusiness,
  removeMember,
  revokeBusinessInvite,
  transferOwnership,
  updateBusinessProfile,
} from '@/lib/business/service';
import {
  normalizeEmail,
  validateBusinessProfile,
  type BusinessProfileField,
} from '@/lib/business/validation';
import { prisma } from '@/lib/prisma';

export type BusinessActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<BusinessProfileField, string>> };

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

async function requireUser(): Promise<AuthenticatedAppUser> {
  const user = await getAuthenticatedAppUser();

  if (!user) {
    throw new BusinessActionError('Your session has expired. Sign in again.');
  }

  await syncAuthenticatedAppUserRecord(prisma, user);
  return user;
}

async function requireBusinessScope(user: AuthenticatedAppUser): Promise<BusinessAccountScope> {
  const scope = await resolveAccountScope(user);

  if (scope.kind !== 'business') {
    throw new BusinessActionError('Switch to your business account first.');
  }

  return scope;
}

async function setActiveAccountCookie(key: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ACCOUNT_COOKIE, key, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  });
}

function toFailure(error: unknown): { ok: false; error: string } {
  if (error instanceof BusinessActionError || error instanceof AccountScopeError) {
    return { ok: false, error: error.message };
  }

  console.error('Business action failed:', error);
  return { ok: false, error: 'Something went wrong. Please try again.' };
}

function refreshDashboard() {
  revalidatePath('/dashboard', 'layout');
}

export async function switchAccountAction(accountKey: string): Promise<BusinessActionResult> {
  try {
    const user = await requireUser();

    if (accountKey !== PERSONAL_ACCOUNT_KEY) {
      const scope = await loadBusinessScope(user.userId, accountKey);

      if (!scope) {
        return { ok: false, error: 'You are not a member of that business.' };
      }
    }

    await setActiveAccountCookie(accountKey);
    refreshDashboard();
    return { ok: true };
  } catch (error) {
    return toFailure(error);
  }
}

export async function registerBusinessAction(
  values: Record<string, unknown>,
): Promise<BusinessActionResult<{ businessId: string }>> {
  try {
    const user = await requireUser();
    const validation = validateBusinessProfile(values);

    if (!validation.ok) {
      return { ok: false, error: 'Check the highlighted fields.', fieldErrors: validation.fieldErrors };
    }

    if (values.acceptedTerms !== true) {
      return { ok: false, error: 'Confirm that you are authorised to register this business.' };
    }

    const business = await createBusiness(user, validation.data);
    await setActiveAccountCookie(business.id);
    refreshDashboard();

    return { ok: true, data: { businessId: business.id } };
  } catch (error) {
    return toFailure(error);
  }
}

export async function updateBusinessAction(
  values: Record<string, unknown>,
): Promise<BusinessActionResult<{ verificationStatus: string }>> {
  try {
    const user = await requireUser();
    const scope = await requireBusinessScope(user);
    const validation = validateBusinessProfile(values);

    if (!validation.ok) {
      return { ok: false, error: 'Check the highlighted fields.', fieldErrors: validation.fieldErrors };
    }

    const business = await updateBusinessProfile(scope, validation.data);
    refreshDashboard();

    return {
      ok: true,
      data: { verificationStatus: business.verificationStatus },
      message:
        business.verificationStatus === 'pending' && scope.business.verificationStatus !== 'pending'
          ? 'Saved. The changes have been sent for verification review.'
          : 'Business details saved.',
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function inviteMemberAction(
  emailValue: string,
  roleValue: string,
): Promise<BusinessActionResult> {
  try {
    const user = await requireUser();
    const scope = await requireBusinessScope(user);
    const email = normalizeEmail(emailValue);

    if (!email) {
      return { ok: false, error: 'Enter a valid email address.' };
    }

    if (!isInvitableBusinessRole(roleValue)) {
      return { ok: false, error: 'Choose a role for this person.' };
    }

    if (user.candidateEmails.includes(email)) {
      return { ok: false, error: 'You are already a member of this business.' };
    }

    const { emailed } = await createBusinessInvite(scope, user, email, roleValue);
    revalidatePath('/dashboard/business/team');

    return {
      ok: true,
      message: emailed
        ? `Invitation sent to ${email}.`
        : `Invitation created for ${email}, but the email could not be sent. Ask them to check back, or resend the invite.`,
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function revokeInviteAction(inviteId: string): Promise<BusinessActionResult> {
  try {
    const user = await requireUser();
    await revokeBusinessInvite(await requireBusinessScope(user), inviteId);
    revalidatePath('/dashboard/business/team');
    return { ok: true, message: 'Invitation revoked.' };
  } catch (error) {
    return toFailure(error);
  }
}

export async function changeMemberRoleAction(
  memberId: string,
  roleValue: string,
): Promise<BusinessActionResult> {
  try {
    if (!isBusinessMemberRole(roleValue)) {
      return { ok: false, error: 'Choose a valid role.' };
    }

    const user = await requireUser();
    await changeMemberRole(await requireBusinessScope(user), memberId, roleValue);
    revalidatePath('/dashboard/business/team');
    return { ok: true, message: 'Role updated.' };
  } catch (error) {
    return toFailure(error);
  }
}

export async function removeMemberAction(memberId: string): Promise<BusinessActionResult> {
  try {
    const user = await requireUser();
    await removeMember(await requireBusinessScope(user), memberId);
    revalidatePath('/dashboard/business/team');
    return { ok: true, message: 'Member removed. Their registered assets stay with the business.' };
  } catch (error) {
    return toFailure(error);
  }
}

export async function transferOwnershipAction(memberId: string): Promise<BusinessActionResult> {
  try {
    const user = await requireUser();
    await transferOwnership(await requireBusinessScope(user), memberId);
    refreshDashboard();
    return { ok: true, message: 'Ownership transferred. You are now an admin.' };
  } catch (error) {
    return toFailure(error);
  }
}

export async function leaveBusinessAction(): Promise<BusinessActionResult> {
  try {
    const user = await requireUser();
    await leaveBusiness(await requireBusinessScope(user));
    await setActiveAccountCookie(PERSONAL_ACCOUNT_KEY);
    refreshDashboard();
    return { ok: true };
  } catch (error) {
    return toFailure(error);
  }
}

export async function acceptInviteAction(token: string): Promise<BusinessActionResult<{ businessId: string }>> {
  try {
    const user = await requireUser();
    const business = await acceptBusinessInvite(user, token);
    await setActiveAccountCookie(business.id);
    refreshDashboard();
    return { ok: true, data: { businessId: business.id } };
  } catch (error) {
    return toFailure(error);
  }
}
