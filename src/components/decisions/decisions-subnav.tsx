"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/decisions", label: "My Decisions" },
  { href: "/decisions/dashboard", label: "Dashboard" },
];

function isActive(pathname: string, href: string) {
  if (href === "/decisions") return pathname === "/decisions";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Internal to the Decision Journal app — distinct from the site-wide showcase
// nav in components/nav (constitution's Multi-App Structure rule).
export function DecisionsSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Decision Journal"
      className="mx-auto flex max-w-3xl items-center gap-4 border-b border-gray-200 px-4 pt-6 pb-3"
    >
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
    </nav>
  );
}
