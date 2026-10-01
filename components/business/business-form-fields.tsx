'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UploadField } from '@/components/business/upload-field';
import {
  BUSINESS_INDUSTRIES,
  BUSINESS_TYPES,
  BUSINESS_TYPE_LABELS,
  NIGERIAN_STATES,
} from '@/lib/business/constants';
import type { BusinessProfileField } from '@/lib/business/validation';
import { cn } from '@/lib/utils';

export type BusinessFormValues = {
  name: string;
  businessType: string;
  registrationNumber: string;
  taxId: string;
  industry: string;
  email: string;
  phoneNumber: string;
  website: string;
  addressLine: string;
  city: string;
  state: string;
  logoUrl: string | null;
  cacDocumentUrl: string | null;
};

export type BusinessFormErrors = Partial<Record<BusinessProfileField, string>>;

export const EMPTY_BUSINESS_FORM: BusinessFormValues = {
  name: '',
  businessType: '',
  registrationNumber: '',
  taxId: '',
  industry: '',
  email: '',
  phoneNumber: '',
  website: '',
  addressLine: '',
  city: '',
  state: '',
  logoUrl: null,
  cacDocumentUrl: null,
};

export const BUSINESS_FORM_SECTIONS = {
  identity: ['name', 'businessType', 'registrationNumber', 'taxId', 'industry'],
  contact: ['email', 'phoneNumber', 'website', 'addressLine', 'city', 'state'],
  documents: ['cacDocumentUrl', 'logoUrl'],
} as const satisfies Record<string, readonly BusinessProfileField[]>;

export type BusinessFormSection = keyof typeof BUSINESS_FORM_SECTIONS;

type FieldProps = {
  id: BusinessProfileField;
  label: string;
  hint?: string;
  optional?: boolean;
  error?: string;
  className?: string;
  children: (props: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby'?: string;
  }) => React.ReactNode;
};

function Field({ id, label, hint, optional, error, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-slate-900">
        {label}
        {optional ? <span className="font-normal text-slate-500"> (optional)</span> : null}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {hint && !error ? (
        <p id={hintId} className="text-xs leading-5 text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputErrorClass =
  'h-11 data-[size=default]:h-11 aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus-visible:ring-red-300';

export function BusinessFormSectionFields({
  section,
  values,
  errors,
  onChange,
}: {
  section: BusinessFormSection;
  values: BusinessFormValues;
  errors: BusinessFormErrors;
  onChange: <K extends keyof BusinessFormValues>(field: K, value: BusinessFormValues[K]) => void;
}) {
  const text =
    (field: keyof BusinessFormValues) => (event: React.ChangeEvent<HTMLInputElement>) =>
      onChange(field, event.target.value);

  if (section === 'identity') {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field id="name" label="Registered business name" error={errors.name} className="md:col-span-2"
          hint="Exactly as it appears on your CAC certificate.">
          {(props) => (
            <Input {...props} autoComplete="organization" value={values.name} onChange={text('name')}
              placeholder="e.g. Adewale Logistics Limited" className={inputErrorClass} />
          )}
        </Field>
        <Field id="businessType" label="Registration type" error={errors.businessType}>
          {(props) => (
            <Select value={values.businessType} onValueChange={(value) => onChange('businessType', value)}>
              <SelectTrigger {...props} className={cn('w-full cursor-pointer', inputErrorClass)}>
                <SelectValue placeholder="Choose a type" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {BUSINESS_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
        <Field id="registrationNumber" label="CAC registration number" error={errors.registrationNumber}
          hint="RC for companies, BN for business names, IT for trustees.">
          {(props) => (
            <Input {...props} value={values.registrationNumber} onChange={text('registrationNumber')}
              placeholder="e.g. RC 1234567" className={cn('uppercase', inputErrorClass)} />
          )}
        </Field>
        <Field id="industry" label="Industry" error={errors.industry}>
          {(props) => (
            <Select value={values.industry} onValueChange={(value) => onChange('industry', value)}>
              <SelectTrigger {...props} className={cn('w-full cursor-pointer', inputErrorClass)}>
                <SelectValue placeholder="Choose an industry" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_INDUSTRIES.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
        <Field id="taxId" label="Tax Identification Number (TIN)" optional error={errors.taxId}
          hint="Printed on your business receipts when provided.">
          {(props) => (
            <Input {...props} inputMode="numeric" value={values.taxId} onChange={text('taxId')}
              placeholder="e.g. 12345678-0001" className={inputErrorClass} />
          )}
        </Field>
      </div>
    );
  }

  if (section === 'contact') {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field id="email" label="Business email" error={errors.email}
          hint="Receipts and verification updates are sent here.">
          {(props) => (
            <Input {...props} type="email" autoComplete="email" value={values.email} onChange={text('email')}
              placeholder="accounts@company.ng" className={inputErrorClass} />
          )}
        </Field>
        <Field id="phoneNumber" label="Business phone" error={errors.phoneNumber}>
          {(props) => (
            <Input {...props} type="tel" autoComplete="tel" value={values.phoneNumber}
              onChange={text('phoneNumber')} placeholder="+234 803 000 0000" className={inputErrorClass} />
          )}
        </Field>
        <Field id="website" label="Website" optional error={errors.website} className="md:col-span-2">
          {(props) => (
            <Input {...props} type="url" inputMode="url" autoComplete="url" value={values.website}
              onChange={text('website')} placeholder="www.company.ng" className={inputErrorClass} />
          )}
        </Field>
        <Field id="addressLine" label="Head office address" error={errors.addressLine} className="md:col-span-2">
          {(props) => (
            <Input {...props} autoComplete="street-address" value={values.addressLine}
              onChange={text('addressLine')} placeholder="12 Admiralty Way, Lekki Phase 1" className={inputErrorClass} />
          )}
        </Field>
        <Field id="city" label="City or town" error={errors.city}>
          {(props) => (
            <Input {...props} autoComplete="address-level2" value={values.city} onChange={text('city')}
              placeholder="Lagos" className={inputErrorClass} />
          )}
        </Field>
        <Field id="state" label="State" error={errors.state}>
          {(props) => (
            <Select value={values.state} onValueChange={(value) => onChange('state', value)}>
              <SelectTrigger {...props} className={cn('w-full cursor-pointer', inputErrorClass)}>
                <SelectValue placeholder="Choose a state" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {NIGERIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <UploadField
        id="cacDocumentUrl"
        label="CAC certificate"
        description="Upload your Certificate of Incorporation or Business Name registration. We use it only to verify the business."
        kind="document"
        value={values.cacDocumentUrl}
        onChange={(url) => onChange('cacDocumentUrl', url)}
        error={errors.cacDocumentUrl}
      />
      <UploadField
        id="logoUrl"
        label="Business logo"
        optional
        description="Shown on your dashboard and next to your assets in the public registry."
        kind="image"
        value={values.logoUrl}
        onChange={(url) => onChange('logoUrl', url)}
        error={errors.logoUrl}
      />
    </div>
  );
}

/** Client-side check for one section, using the same rules as the server. */
export function pickSectionErrors(
  section: BusinessFormSection,
  errors: BusinessFormErrors,
): BusinessFormErrors {
  const fields = BUSINESS_FORM_SECTIONS[section] as readonly BusinessProfileField[];
  return Object.fromEntries(
    Object.entries(errors).filter(([field]) => fields.includes(field as BusinessProfileField)),
  );
}
