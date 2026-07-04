import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/nav/nav-bar";

export const metadata: Metadata = {
  title: "Decision Journal",
  description: "Track your decisions before you make them, then see how your instincts held up.",
};

// Sets the `.dark` class on <html> before first paint — must run as a
// blocking inline script (not a useEffect, which would only run after
// hydration and cause a visible flash of the wrong theme). Reads the
// visitor's stored choice (theme-toggle.tsx), falling back to the OS
// preference when they haven't chosen one explicitly yet.
const THEME_INIT_SCRIPT = `
  try {
    var stored = localStorage.getItem("theme");
    var isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // suppressHydrationWarning below: THEME_INIT_SCRIPT sets `.dark` on <html>
  // directly, outside React, before hydration runs — the server never
  // renders that class at all (it can't know the visitor's stored/OS
  // preference), so React would otherwise flag every dark-mode page load as
  // a hydration mismatch even though this divergence is intentional.
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
