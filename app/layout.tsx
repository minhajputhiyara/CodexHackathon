import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UIForge - AI UI Builder",
  description: "AI-first UI canvas prototype",
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

