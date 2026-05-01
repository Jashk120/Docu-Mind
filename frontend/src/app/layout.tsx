```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocuMind",
  description: "AI documentation pipeline",
};

/**
 * Root layout component for the DocuMind application.
 * Sets up global styles, fonts, and providers.
 *
 * @param props - The component props.
 * @param props.children - The content to be wrapped by the layout.
 * @returns The root HTML structure with fonts, metadata, and providers.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full font-sans bg-[#0a0a0a] text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```