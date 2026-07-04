import Link from "next/link";
import { auth } from "@/auth";
import { NavLinks } from "./nav-links";
import { UserMenu } from "@/components/auth/user-menu";

export async function NavBar() {
  const session = await auth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="font-bold text-brand-600">
          Jon Upchurch Showcase
        </Link>
        <div className="h-6 border-l border-gray-300" aria-hidden="true" />
        <NavLinks />
        <div className="flex-1" />
        {session?.user ? (
          <UserMenu image={session.user.image} name={session.user.name} />
        ) : (
          <Link href="/" className="text-sm font-medium text-brand-600 underline">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
