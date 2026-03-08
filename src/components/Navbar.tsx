"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/knowledge", label: "Knowledge" },
    { href: "/channels", label: "Channels" },
    { href: "/analytics", label: "Analytics" },
    { href: "/categories", label: "Categories" },
    { href: "/youtube-analysis", label: "YouTube Analysis" },
    { href: "/autofetch", label: "Autofetch" },
    { href: "/trades-table", label: "Trades Table" },
    { href: "/trading-settings", label: "Trading Settings" },
  ];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-400/10 rounded-2xl blur-xl"></div>

        {/* Main navbar */}
        <div className="relative glassmorphic rounded-2xl shadow-2xl">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center">
                <span
                  className={`text-xl font-bold bg-gradient-to-r from-green-400 via-emerald-300 to-green-200 text-transparent bg-clip-text green-text-glow ${
                    isActive("/") ? "scale-105" : ""
                  }`}
                >
                  CryptoLens-Test
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive(link.href)
                        ? "text-white glass-gradient rounded-lg scale-105 shadow-lg glass-glow"
                        : "text-gray-400 hover:text-white hover:glass-hover hover:rounded-lg"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile menu button */}
              <div className="flex md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-300 hover:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
                >
                  <span className="sr-only">Open menu</span>
                  {!isMenuOpen ? (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Desktop CTA */}
              <div className="hidden md:flex items-center">
                <Link
                  href="/autofetch"
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg ${
                    isActive("/autofetch") ? "scale-105" : ""
                  }`}
                >
                  Start Fetching
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div
            className={`${
              isMenuOpen ? "block" : "hidden"
            } md:hidden border-t border-green-900/30`}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? "text-white glass-gradient scale-[1.02] glass-glow"
                      : "text-gray-400 hover:text-white hover:glass-hover"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="px-3 py-2">
                <Link
                  href="/autofetch"
                  className={`w-full inline-flex items-center justify-center px-4 py-2 text-base font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg ${
                    isActive("/autofetch") ? "scale-105" : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Start Fetching
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
