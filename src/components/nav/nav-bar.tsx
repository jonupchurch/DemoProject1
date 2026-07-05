import Link from "next/link";
import { auth } from "@/auth";
import { NavLinks } from "./nav-links";
import { MobileNavMenu } from "./mobile-nav-menu";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { SignInMenu } from "@/components/auth/sign-in-menu";

export async function NavBar() {
  const session = await auth();
  const isSignedIn = Boolean(session?.user);

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="font-bold text-brand-600">
          Jon Upchurch Showcase
        </Link>
        <div
          className="hidden h-6 border-l border-gray-300 dark:border-gray-700 md:block"
          aria-hidden="true"
        />
        {/* NavLinks collapses into MobileNavMenu's hamburger below `md` — the
            theme toggle and account/sign-in controls stay visible at every
            width, since they're compact enough not to need collapsing. */}
        <div className="hidden md:block">
          <NavLinks isSignedIn={isSignedIn} />
        </div>
        <div className="flex-1" />
        <ThemeToggle />
        {session?.user ? (
          <UserMenu image={session.user.image} name={session.user.name} />
        ) : (
          <SignInMenu />
        )}
        <MobileNavMenu isSignedIn={isSignedIn} />
      </div>
    </header>
  );
}
