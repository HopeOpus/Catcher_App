import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Navigation() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-1">
            <Image
              src="/logo2.svg"
              alt="Catcher Logo"
              width={160}
              height={32}
              className="mr-0 h-8 w-auto"
            />
            <span className="ml-0 text-3xl font-semibold tracking-tighter text-[#1c1c1c]">
              Catcher
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" className="text-slate-700 hover:text-slate-900">
              <Link href="/#features">Features</Link>
            </Button>
            <Button asChild variant="ghost" className="text-slate-700 hover:text-slate-900">
              <Link href="/#how-it-works">How It Works</Link>
            </Button>
            <Button asChild variant="ghost" className="text-slate-700 hover:text-slate-900">
              <Link href="/#pricing">Pricing</Link>
            </Button>
            <Button asChild variant="ghost" className="text-slate-700 hover:text-slate-900">
              <Link href="/catcher-security-credit">Security Credits</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="text-[#36689e] hover:bg-[#36689e]/10 hover:text-[#0F2651]">
              <Link href="/search-registry">Search Registry</Link>
            </Button>

            <SignedOut>
              <Button
                asChild
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-[#336699] to-[#0F2651] text-white shadow-lg transition-all duration-200 hover:from-[#0F2651] hover:to-[#0F2651] hover:shadow-xl">
                <Link href="/auth/signup">Create Account</Link>
              </Button>
            </SignedOut>

            <SignedIn>
              <Button
                asChild
                variant="outline"
                className="border-[#36689e] text-[#0F2651] hover:bg-[#36689e]/10">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-10 h-10',
                    userButtonPopoverCard: 'bg-white border border-slate-200 shadow-lg',
                    userButtonPopoverActionButton: 'hover:bg-slate-50',
                    userButtonPopoverFooter: 'border-t border-slate-200',
                  },
                }}
              />
            </SignedIn>
          </div>

          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-700 hover:text-slate-900">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/#features">Features</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/#how-it-works">How It Works</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/#pricing">Pricing</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/search-registry" className="font-medium text-[#36689e]">
                    Search Registry
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/catcher-security-credit">Security Credits</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <SignedOut>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/signin">Sign In</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/signup">Create Account</Link>
                  </DropdownMenuItem>
                </SignedOut>

                <SignedIn>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <div className="px-2 py-2">
                    <UserButton
                      appearance={{
                        elements: {
                          userButtonAvatarBox: 'w-8 h-8',
                          userButtonPopoverCard: 'bg-white border border-slate-200 shadow-lg',
                          userButtonPopoverActionButton: 'hover:bg-slate-50',
                          userButtonPopoverFooter: 'border-t border-slate-200',
                        },
                      }}
                    />
                  </div>
                </SignedIn>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
