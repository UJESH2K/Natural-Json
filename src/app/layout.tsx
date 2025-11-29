import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trading Workflow Builder",
  description: "AI-Powered Trading Strategy Builder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}