import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function Navigation() {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex gap-1">
            <Image
              src="/logo2.svg"
              alt="Catcher Logo"
              width={160}
              height={32}
              className="h-8 w-auto mr-0"
            />
            <span className="text-3xl font-semibold text-[#1c1c1c] tracking-tighter ml-0">Catcher</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
<Link href="/features">
  <Button variant="ghost" className="text-slate-700 hover:text-slate-900">
    Features
  </Button>
</Link>
            <Link href="/stolen-items">
              <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                Stolen Items
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="text-slate-700 hover:text-slate-900">
                About
              </Button>
            </Link>
            
            <SignedOut>
              <Link href="/auth/signin">
                <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-[#336699] to-[#0F2651] hover:from-[#0F2651] hover:to-[#0F2651] text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  Sign Up
                </Button>
              </Link>
            </SignedOut>
            
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-10 h-10',
                    userButtonPopoverCard: 'bg-white border border-slate-200 shadow-lg',
                    userButtonPopoverActionButton: 'hover:bg-slate-50',
                    userButtonPopoverFooter: 'border-t border-slate-200'
                  }
                }}
              />
            </SignedIn>
          </div>

          {/* Mobile Navigation */}
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
  <Link href="/features">Features</Link>
</DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/stolen-items" className="text-red-600 font-medium">Stolen Items</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/">About</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                <SignedOut>
                  <Link href="/auth/signin">
                    <DropdownMenuItem>
                      <span>Sign In</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/auth/signup">
                    <DropdownMenuItem>
                      <span className="bg-gradient-to-r from-[#336699] to-[#0F2651] text-white px-3 py-1 rounded-md">Sign Up</span>
                    </DropdownMenuItem>
                  </Link>
                </SignedOut>
                
                <SignedIn>
                  <DropdownMenuItem>
                    <UserButton 
                      appearance={{
                        elements: {
                          userButtonAvatarBox: 'w-8 h-8 mr-2',
                          userButtonPopoverCard: 'bg-white border border-slate-200 shadow-lg',
                          userButtonPopoverActionButton: 'hover:bg-slate-50',
                          userButtonPopoverFooter: 'border-t border-slate-200'
                        }
                      }}
                    />
                  </DropdownMenuItem>
                </SignedIn>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
