import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEON EXCHANGE",
  description: "Dark cyberpunk market city prototype built for UI-only exploration."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
