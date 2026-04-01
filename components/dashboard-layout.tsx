'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import { Menu, X, Home, Building2, CreditCard, LogOut, AlertTriangle, User, Bell, ReceiptText } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { ProfileCompletionModal } from '@/components/profile-completion-modal';
import {
  PROFILE_UPDATED_EVENT,
  type UserProfileStatus,
} from '@/lib/profile';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/properties', label: 'Registered Properties', icon: Building2 },
  { href: '/dashboard/stolen-reports', label: 'Stolen Reports', icon: AlertTriangle },
  { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/dashboard/receipts', label: 'Billing History', icon: ReceiptText },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [profileStatus, setProfileStatus] = React.useState<UserProfileStatus | null>(null);
  const [isProfileModalDismissed, setIsProfileModalDismissed] = React.useState(false);
  const { signOut, isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    let isActive = true;

    const loadProfileStatus = async () => {
      try {
        const response = await fetch('/api/profile', {
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as UserProfileStatus;

        if (isActive) {
          setProfileStatus(data);
          if (data.profileComplete) {
            setIsProfileModalDismissed(false);
          }
        }
      } catch (error) {
        console.error('Failed to load user profile status:', error);
      }
    };

    void loadProfileStatus();

    return () => {
      isActive = false;
    };
  }, [isLoaded, isSignedIn]);

  React.useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<UserProfileStatus>;
      setProfileStatus(customEvent.detail);
      setIsProfileModalDismissed(false);
    };

    window.addEventListener(
      PROFILE_UPDATED_EVENT,
      handleProfileUpdated as EventListener,
    );

    return () => {
      window.removeEventListener(
        PROFILE_UPDATED_EVENT,
        handleProfileUpdated as EventListener,
      );
    };
  }, []);

  React.useEffect(() => {
    setIsProfileModalDismissed(false);
  }, [pathname]);

  const getNavigationItemClasses = (href: string) =>
    cn(
      'flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
      pathname === href
        ? 'bg-[#36689e]/10 text-[#0F2651]'
        : 'text-gray-700 hover:bg-gray-100 hover:text-[#0F2651]',
    );

  const shouldShowProfileCompletionModal =
    Boolean(profileStatus && !profileStatus.profileComplete) &&
    !isProfileModalDismissed &&
    pathname !== '/dashboard/profile';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center space-x-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-64">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h1 className="text-lg font-semibold text-[#0F2651]">Catcher</h1>
                    <UserButton afterSignOutUrl="/" />
                  </div>
                  <nav className="flex-1 overflow-y-auto py-4">
                    <NavigationMenu className="flex flex-col space-y-2">
                      <NavigationMenuList>
                        {navigationItems.map((item) => (
                          <NavigationMenuItem key={item.href}>
                            <NavigationMenuLink
                              asChild
                              className="w-full"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <Link
                                href={item.href}
                                className={getNavigationItemClasses(item.href)}
                              >
                                <item.icon className="h-4 w-4 text-[#36689e]" />
                                <span>{item.label}</span>
                              </Link>
                            </NavigationMenuLink>
                          </NavigationMenuItem>
                        ))}
                      </NavigationMenuList>
                    </NavigationMenu>
                  </nav>
                  <div className="p-4 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-700 hover:text-red-600"
                      onClick={() => {
                        signOut({ redirectUrl: '/' });
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Image
              src="/logo2.svg"
              alt="Catcher Logo"
              width={160}
              height={32}
              className="h-8 w-auto"
            />
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-gray-200 bg-white xl:w-80 lg:block">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Image
                src="/logo2.svg"
                alt="Catcher Logo"
                width={160}
                height={32}
                className="h-8 w-auto"
              />
              <span className="text-3xl font-semibold tracking-tighter text-[#1c1c1c]">
                Catcher
              </span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
          
          <nav className="flex-1 overflow-y-auto py-6">
            <div className="space-y-2 px-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={getNavigationItemClasses(item.href)}
                >
                  <item.icon className="h-5 w-5 text-[#36689e]" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-red-600"
              onClick={() => {
                signOut({ redirectUrl: '/' });
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 lg:pl-72 xl:pl-80">
        <div className="min-h-screen overflow-x-hidden">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
            {children}
          </div>
        </div>
      </main>

      <ProfileCompletionModal
        profileStatus={profileStatus}
        isOpen={shouldShowProfileCompletionModal}
        onDismiss={() => {
          setIsProfileModalDismissed(true);
        }}
        onCompleted={(updatedProfileStatus) => {
          setProfileStatus(updatedProfileStatus);
          setIsProfileModalDismissed(false);
        }}
      />
    </div>
  );
}
