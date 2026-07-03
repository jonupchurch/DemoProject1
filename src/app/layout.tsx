import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Typescript2",
  description: "Learning Next.js with TypeScript and Tailwind",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
