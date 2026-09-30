'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminAccess } from '@/lib/admin-access';
import { BusinessActionError, reviewBusinessVerification } from '@/lib/business/service';

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function backTo(formData: FormData, tone: 'success' | 'error', message: string): never {
  const redirectTo = field(formData, 'redirect_to');
  const url = new URL(redirectTo.startsWith('/admin/businesses') ? redirectTo : '/admin/businesses', 'http://localhost');
  url.searchParams.set('status', tone);
  url.searchParams.set('message', message);
  redirect(`${url.pathname}${url.search}`);
}

export async function reviewBusinessAction(formData: FormData) {
  const admin = await assertAdminAccess();
  const businessId = field(formData, 'business_id');
  const outcome = field(formData, 'outcome');
  const note = field(formData, 'note').slice(0, 1000) || null;

  if (!businessId || (outcome !== 'verified' && outcome !== 'rejected')) {
    backTo(formData, 'error', 'Choose a business and a decision.');
  }

  try {
    await reviewBusinessVerification({
      adminUserId: admin.userId,
      businessId,
      outcome,
      note,
    });
  } catch (error) {
    if (error instanceof BusinessActionError) {
      backTo(formData, 'error', error.message);
    }

    console.error('Failed to review business verification:', error);
    backTo(formData, 'error', 'Could not save the decision. Try again.');
  }

  revalidatePath('/admin/businesses');
  revalidatePath('/admin');
  backTo(
    formData,
    'success',
    outcome === 'verified' ? 'Business verified and the owners notified.' : 'Verification rejected and the owners notified.',
  );
}
