import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Wagai Shoppers", template: "%s | Wagai Shoppers" },
  description: "Wagai Shoppers Debt Management System",
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
