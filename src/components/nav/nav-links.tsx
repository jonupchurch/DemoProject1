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

// Built up incrementally as each /travel route ships (tasks.md T009/T019/T026)
// rather than all at once — mirrors how the Decisions flyout above grew a
// "Timeline" entry only once /decisions/timeline actually existed.
const TRAVEL_LINKS = [
  { href: "/travel", label: "Map" },
  { href: "/travel/list", label: "List" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Shared open/close-on-outside-click/Escape behavior for a nav flyout. */
function useFlyout() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return { isOpen, setIsOpen, containerRef };
}

// Home and About are the only pages a signed-out visitor can see by default —
// every private mini-app (Decisions today, more later) and Contact are
// personal tools gated behind sign-in, hidden from the nav entirely rather
// than shown-but-inaccessible. Travel is the one exception: browsing it is
// public by design (constitution Principle IX / FR-005), so its flyout
// trigger and "Map"/"List" entries stay visible either way — only its
// "Add a Pin" entry (added in tasks.md T019) is conditional on `isSignedIn`.
export function NavLinks({ isSignedIn }: { isSignedIn: boolean }) {
  const pathname = usePathname();
  const decisions = useFlyout();
  const travel = useFlyout();
  const decisionsActive = pathname.startsWith("/decisions");
  const travelActive = pathname.startsWith("/travel");
  const travelLinks = isSignedIn
    ? [...TRAVEL_LINKS, { href: "/travel/new", label: "Add a Pin" }]
    : TRAVEL_LINKS;

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
                : "text-gray-600 hover:text-brand-600 dark:text-gray-400"
            }
          >
            {link.label}
          </Link>
        );
      })}

      <div className="relative" ref={travel.containerRef}>
        <button
          type="button"
          onClick={() => travel.setIsOpen((prev) => !prev)}
          aria-haspopup="true"
          aria-expanded={travel.isOpen}
          className={
            travelActive
              ? "font-medium text-brand-600"
              : "text-gray-600 hover:text-brand-600 dark:text-gray-400"
          }
        >
          Travel
        </button>

        {travel.isOpen && (
          <div
            role="menu"
            aria-label="Travel"
            className="absolute left-0 z-10 mt-2 w-40 rounded-card border border-gray-300 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            {travelLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  aria-current={active ? "page" : undefined}
                  onClick={() => travel.setIsOpen(false)}
                  className={
                    active
                      ? "block rounded-card px-3 py-2 text-sm font-medium text-brand-600"
                      : "block rounded-card px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {isSignedIn && (
        <>
          {/* Decisions is a flyout rather than a plain link — its sub-pages
              (My Decisions/Timeline/Dashboard) previously lived in an
              always-visible bar under the page header; moving them here
              declutters the page and scales as more mini-apps get sub-pages. */}
          <div className="relative" ref={decisions.containerRef}>
            <button
              type="button"
              onClick={() => decisions.setIsOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={decisions.isOpen}
              className={
                decisionsActive
                  ? "font-medium text-brand-600"
                  : "text-gray-600 hover:text-brand-600 dark:text-gray-400"
              }
            >
              Decisions
            </button>

            {decisions.isOpen && (
              <div
                role="menu"
                aria-label="Decisions"
                className="absolute left-0 z-10 mt-2 w-40 rounded-card border border-gray-300 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                {DECISIONS_LINKS.map((link) => {
                  const active = isActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      aria-current={active ? "page" : undefined}
                      onClick={() => decisions.setIsOpen(false)}
                      className={
                        active
                          ? "block rounded-card px-3 py-2 text-sm font-medium text-brand-600"
                          : "block rounded-card px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
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
                : "text-gray-600 hover:text-brand-600 dark:text-gray-400"
            }
          >
            Contact
          </Link>
        </>
      )}
    </nav>
  );
}
