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

export function Navigation() {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex gap-1">
            <img 
              src="/logo2.svg" 
              alt="Catcher Logo" 
              className="h-8 w-auto mr-0"
            />
            <span className="text-3xl font-semibold text-[#1c1c1c] tracking-tighter ml-0">Catcher</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="text-slate-700 hover:text-slate-900">
              Features
            </Button>
            <Button variant="ghost" className="text-slate-700 hover:text-slate-900">
              Pricing
            </Button>
            <Button variant="ghost" className="text-slate-700 hover:text-slate-900">
              About
            </Button>
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
              Sign In
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              Sign Up
            </Button>
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
                <DropdownMenuItem>
                  <span>Features</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Pricing</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>About</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span>Sign In</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-md">Sign Up</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
