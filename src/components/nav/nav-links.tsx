"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
];

const DECISIONS_LINKS = [
  { href: "/decisions", label: "My Decisions" },
  { href: "/decisions/timeline", label: "Timeline" },
  { href: "/decisions/dashboard", label: "Dashboard" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Home and About are the only pages a signed-out visitor can see — every
// mini-app (Decisions today, more later) and Contact are personal tools
// gated behind sign-in, so they're hidden from the nav entirely rather
// than shown-but-inaccessible.
export function NavLinks({ isSignedIn }: { isSignedIn: boolean }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const decisionsActive = pathname.startsWith("/decisions");

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <nav className="flex items-center gap-4">
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "font-medium text-brand-600"
                : "text-gray-600 hover:text-brand-600"
            }
          >
            {link.label}
          </Link>
        );
      })}

      {isSignedIn && (
        <>
          {/* Decisions is a flyout rather than a plain link — its sub-pages
              (My Decisions/Timeline/Dashboard) previously lived in an
              always-visible bar under the page header; moving them here
              declutters the page and scales as more mini-apps get sub-pages. */}
          <div className="relative" ref={containerRef}>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isOpen}
              className={
                decisionsActive
                  ? "font-medium text-brand-600"
                  : "text-gray-600 hover:text-brand-600"
              }
            >
              Decisions
            </button>

            {isOpen && (
              <div
                role="menu"
                aria-label="Decisions"
                className="absolute left-0 z-10 mt-2 w-40 rounded-card border border-gray-300 bg-white p-1 shadow-lg"
              >
                {DECISIONS_LINKS.map((link) => {
                  const active = isActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      aria-current={active ? "page" : undefined}
                      onClick={() => setIsOpen(false)}
                      className={
                        active
                          ? "block rounded-card px-3 py-2 text-sm font-medium text-brand-600"
                          : "block rounded-card px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      }
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href="/contact"
            aria-current={isActive(pathname, "/contact") ? "page" : undefined}
            className={
              isActive(pathname, "/contact")
                ? "font-medium text-brand-600"
                : "text-gray-600 hover:text-brand-600"
            }
          >
            Contact
          </Link>
        </>
      )}
    </nav>
  );
}
