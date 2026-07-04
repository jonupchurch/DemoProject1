import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/nav/nav-bar";

export const metadata: Metadata = {
  title: "Decision Journal",
  description: "Track your decisions before you make them, then see how your instincts held up.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
