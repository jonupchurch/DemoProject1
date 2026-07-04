import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DecisionTracker",
  description: "A demo project for tracking decisions",
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
