import { Link, useLocation } from "wouter";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "./ThemeToggle";
import { FEATURES } from "@/config/features";

export default function Navigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navLinkClass = (path: string) => {
    const base = "font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2";
    return isActive(path)
      ? `${base} text-red-500 font-bold`
      : `${base} text-gray-600 dark:text-gray-400 hover:text-red-500`;
  };

  return (
    <header className="border-b border-black dark:border-gray-800 bg-white dark:bg-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="text-2xl font-bold tracking-tight font-mono text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            data-testid="link-nav-logo"
          >
            Enamorado
          </Link>

          <nav className="flex items-center space-x-6">
            <Link 
              href="/" 
              className={navLinkClass("/")}
              data-testid="link-nav-home"
            >
              Home
            </Link>

            <Link 
              href="/latest" 
              className={navLinkClass("/latest")}
              data-testid="link-nav-latest"
            >
              Latest
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger 
                className="font-mono text-sm text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                data-testid="dropdown-nav-explore"
              >
                Explore
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="bg-white dark:bg-black border-black dark:border-gray-800 font-mono"
              >
                <DropdownMenuItem asChild>
                  <Link 
                    href="/episodes" 
                    className="cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-900 focus:text-red-500"
                    data-testid="dropdown-item-episodes"
                  >
                    Episodes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link 
                    href="/mixes" 
                    className="cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-900 focus:text-red-500"
                    data-testid="dropdown-item-mixes"
                  >
                    Mixes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link 
                    href="/albums" 
                    className="cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-900 focus:text-red-500"
                    data-testid="dropdown-item-albums"
                  >
                    Albums of the Month
                  </Link>
                </DropdownMenuItem>
                {FEATURES.SCHEDULE && (
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/schedule" 
                      className="cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-900 focus:text-red-500"
                      data-testid="dropdown-item-schedule"
                    >
                      Schedule
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link 
              href="/submit-mix" 
              className={navLinkClass("/submit-mix")}
              data-testid="link-nav-submit"
            >
              Submit
            </Link>

            <Link 
              href="/about" 
              className={navLinkClass("/about")}
              data-testid="link-nav-about"
            >
              About
            </Link>

            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
