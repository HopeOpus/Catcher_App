'use client';

import Link from 'next/link';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import {
  AlertTriangle,
  Building2,
  CreditCard,
  Home,
  History,
  LogOut,
  Menu,
  Package,
  Shield,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const adminNavigationItems = [
  { href: '/admin', label: 'Overview', icon: Home },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/stolen-reports', label: 'Stolen Reports', icon: AlertTriangle },
  { href: '/admin/catalog', label: 'Catalog', icon: Package },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: History },
] as const;

export function AdminLayoutShell({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName: string;
}) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const getLinkClasses = (href: string) =>
    cn(
      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
      pathname === href
        ? 'bg-[#0F2651] text-white shadow-sm'
        : 'text-slate-700 hover:bg-slate-100 hover:text-[#0F2651]',
    );

  const navigation = (
    <nav className="space-y-2">
      {adminNavigationItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={getLinkClasses(item.href)}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-72 px-0">
                <div className="flex h-full flex-col">
                  <div className="border-b border-slate-200 px-5 py-5">
                    <div className="flex items-center gap-3">
                      <Shield className="h-8 w-8 rounded-full bg-[#0F2651] p-1.5 text-white" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36689e]">
                          Admin Panel
                        </p>
                        <p className="text-lg font-semibold text-[#0F2651]">{adminName}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4">{navigation}</div>
                </div>
              </SheetContent>
            </Sheet>
            <Image
              src="/logo2.svg"
              alt="Catcher Logo"
              width={132}
              height={28}
              className="h-7 w-auto"
            />
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-6 py-6">
            <div className="flex items-center gap-3">
              <Shield className="h-10 w-10 rounded-full bg-[#0F2651] p-2 text-white" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#36689e]">
                  Catcher Admin
                </p>
                <p className="mt-1 text-lg font-semibold text-[#0F2651]">{adminName}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">{navigation}</div>

          <div className="border-t border-slate-200 px-4 py-4">
            <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo2.svg"
                  alt="Catcher Logo"
                  width={110}
                  height={24}
                  className="h-6 w-auto"
                />
                <span className="text-sm font-medium text-slate-600">Console</span>
              </div>
              <UserButton afterSignOutUrl="/" />
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-700 hover:text-red-600"
              onClick={() => signOut({ redirectUrl: '/' })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 lg:pl-72">
        <div className="min-h-screen overflow-x-hidden">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10">{children}</div>
        </div>
      </main>
    </div>
  );
}
