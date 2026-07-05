"use client";

import { useEffect, useRef, useState } from "react";
import { NavLinks } from "./nav-links";

function HamburgerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Small-screen replacement for the horizontal NavLinks row (nav-bar.tsx hides
 * that row below `md`). The theme toggle and account/sign-in controls stay
 * visible in the header at every width — only the navigation links collapse
 * here, mirroring the disclosure-popover pattern already used by
 * UserMenu/SignInMenu/the Travel & Decisions flyouts.
 */
export function MobileNavMenu({ isSignedIn }: { isSignedIn: boolean }) {
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

  return (
    <div className="relative md:hidden" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="flex h-9 w-9 items-center justify-center rounded-card border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400"
      >
        {isOpen ? <CloseIcon /> : <HamburgerIcon />}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-card border border-gray-300 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <NavLinks
            isSignedIn={isSignedIn}
            orientation="vertical"
            onNavigate={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
