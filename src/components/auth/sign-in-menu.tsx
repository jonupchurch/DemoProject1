"use client";

import { useEffect, useRef, useState } from "react";
import { SignInButtons } from "./sign-in-buttons";

// Mirrors user-menu.tsx's popover pattern (click to open, closes on
// outside-click/Escape) so a signed-out visitor can sign in from any page,
// not just by navigating back to the home page's hero CTA.
export function SignInMenu() {
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
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="rounded-card bg-brand-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
      >
        Sign in
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-64 rounded-card border border-gray-300 bg-white p-3 shadow-lg">
          <SignInButtons />
        </div>
      )}
    </div>
  );
}
