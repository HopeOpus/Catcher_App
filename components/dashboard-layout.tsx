'use client';

import * as React from 'react';
import { UserButton, useAuth } from '@clerk/nextjs';
import { Menu, X, Home, Building2, CreditCard, LogOut } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/properties', label: 'Registered Properties', icon: Building2 },
  { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: CreditCard },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
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
                              href={item.href}
                              className="flex items-center space-x-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <item.icon className="h-4 w-4 text-[#36689e]" />
                              <span>{item.label}</span>
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
      <aside className="hidden lg:block fixed inset-y-0 left-2 z-50 w-80 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className='flex'>
              <Image
                src="/logo2.svg"
                alt="Catcher Logo"
                width={160}
                height={32}
                className="h-8 w-auto mr-0"
              />
              <span className="text-3xl font-semibold text-[#1c1c1c] tracking-tighter ml-0">Catcher</span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
          
          <nav className="flex-1 overflow-y-auto py-6">
            <div className="space-y-2 px-4">
              {navigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-md transition-colors",
                    "text-gray-700 hover:bg-gray-100 hover:text-[#0F2651]"
                  )}
                >
                  <item.icon className="h-5 w-5 text-[#36689e]" />
                  <span>{item.label}</span>
                </a>
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
      <main className="lg:ml-30">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
