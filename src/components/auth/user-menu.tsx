"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SignOutButton } from "./sign-out-button";

interface UserMenuProps {
  image: string | null | undefined;
  name: string | null | undefined;
}

export function UserMenu({ image, name }: UserMenuProps) {
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
        aria-label={name ? `Account menu for ${name}` : "Account menu"}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="block h-9 w-9 overflow-hidden rounded-full border border-gray-300 bg-gray-100"
      >
        {image ? (
          <Image src={image} alt="" width={36} height={36} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-600">
            {name?.trim()?.[0]?.toUpperCase() ?? "?"}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-2 w-44 rounded-card border border-gray-300 bg-white p-3 shadow-lg"
        >
          {name && <p className="mb-2 truncate text-sm font-medium">{name}</p>}
          <SignOutButton />
        </div>
      )}
    </div>
  );
}
