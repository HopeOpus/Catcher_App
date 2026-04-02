'use client'

import Image from "next/image";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900">Welcome Back to</h1>
            <Image
              src="/catcher-logo.svg"
              alt="Catcher logo"
              width={160}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </div>
          <p className="text-slate-600">Sign in to your Catcher account</p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-slate-200/50">
          <SignIn 
            routing="path"
            path="/auth/signin"
            signUpUrl="/auth/signup"
            afterSignInUrl="/auth/complete"
            afterSignUpUrl="/auth/complete"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1',
                card: 'bg-white',
                headerTitle: 'text-2xl font-bold text-slate-900',
                headerSubtitle: 'text-slate-600',
                socialButtonsBlockButton: 'border-slate-300 text-slate-700 hover:bg-slate-50',
                formFieldInput: 'border-slate-300 focus:border-blue-500 focus:ring-blue-500',
                footerActionLink: 'text-blue-600 hover:text-blue-500',
                formField: 'mb-4',
                formFieldLabel: 'text-slate-700',
                dividerRow: 'my-6',
                dividerText: 'text-slate-500',
                dividerLine: 'bg-slate-300'
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
