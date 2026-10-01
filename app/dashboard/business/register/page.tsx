import type { Metadata } from 'next';
import { getDashboardContext } from '@/lib/dashboard-context';
import {
  BUSINESS_MONTHLY_PROPERTY_PLAN_PRICE_NGN_KOBO,
  BUSINESS_YEARLY_PROPERTY_PLAN_PRICE_NGN_KOBO,
  formatNgnFromKobo,
} from '@/lib/property-plans';
import RegisterBusinessClient from './register-business-client';

export const metadata: Metadata = {
  title: 'Register a business · Catcher',
};

export default async function RegisterBusinessPage() {
  const { authenticatedUser } = await getDashboardContext();

  return (
    <RegisterBusinessClient
      defaultEmail={authenticatedUser.email}
      pricing={{
        monthly: formatNgnFromKobo(BUSINESS_MONTHLY_PROPERTY_PLAN_PRICE_NGN_KOBO),
        yearly: formatNgnFromKobo(BUSINESS_YEARLY_PROPERTY_PLAN_PRICE_NGN_KOBO),
      }}
    />
  );
}
