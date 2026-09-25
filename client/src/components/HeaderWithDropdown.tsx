import { Link, useLocation } from "wouter";
import { Search } from "lucide-react";
import { useState } from "react";

type DropdownCategory = "DISCOVER" | "EDITORIAL" | "COMMUNITY" | "ABOUT" | null;

interface DropdownItem {
  label: string;
  href: string;
}

const dropdownContent: Record<Exclude<DropdownCategory, null>, DropdownItem[]> = {
  DISCOVER: [
    { label: "Featured", href: "/discover/featured" },
    { label: "Latest", href: "/latest" },
    { label: "Trending", href: "/discover/trending" },
    { label: "Staff Picks", href: "/discover/staff-picks" },
    { label: "Archives", href: "/discover/archives" },
  ],
  EDITORIAL: [
    { label: "All Editorial", href: "/editorial" },
    { label: "Interviews", href: "/editorial?category=interviews" },
    { label: "Essays", href: "/editorial?category=essays" },
    { label: "Style Guides", href: "/editorial?category=style-guides" },
    { label: "Culture", href: "/editorial?category=culture" },
    { label: "Music", href: "/editorial?category=music" },
    { label: "Art", href: "/editorial?category=art" },
  ],
  COMMUNITY: [
    { label: "Feed", href: "/community" },
    { label: "Submit", href: "/submit" },
    { label: "Following", href: "/community/following" },
    { label: "Curated Lists", href: "/community/curated-lists" },
    { label: "Contributors", href: "/contributors" },
  ],
  ABOUT: [
    { label: "Mission", href: "/about/mission" },
    { label: "Team", href: "/about/team" },
    { label: "Submit Work", href: "/submit" },
    { label: "Contact", href: "/about/contact" },
  ],
};

export default function HeaderWithDropdown() {
  const [location] = useLocation();
  const [activeDropdown, setActiveDropdown] = useState<DropdownCategory>(null);

  const categories: Exclude<DropdownCategory, null>[] = [
    "DISCOVER",
    "EDITORIAL",
    "COMMUNITY",
    "ABOUT",
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black">
      <div className="max-w-[1440px] mx-auto px-20">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="focus:outline-none focus:ring-2 focus:ring-black">
            <h1 className="text-2xl font-serif tracking-tight">SSENSE</h1>
          </Link>

          {/* Dropdown Navigation */}
          <nav className="flex items-center gap-8">
            {categories.map((category) => (
              <div
                key={category}
                className="relative"
                onMouseEnter={() => setActiveDropdown(category)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className="text-sm font-sans text-black hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black"
                  aria-expanded={activeDropdown === category}
                  aria-haspopup="true"
                >
                  {category}
                </button>

                {/* Dropdown Menu */}
                {activeDropdown === category && (
                  <div className="absolute top-full left-0 pt-2">
                    <div className="bg-white border border-black shadow-sm min-w-[200px]">
                      <div className="grid grid-cols-1 gap-0">
                        {dropdownContent[category].map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="px-4 py-3 text-sm font-sans text-black hover:bg-gray-100 transition-colors duration-200 border-b border-gray-200 last:border-b-0 focus:outline-none focus:bg-gray-100"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Search Icon */}
          <button
            className="p-2 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
