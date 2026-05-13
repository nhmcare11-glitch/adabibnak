import type { Metadata } from "next";
import { Cairo, Inter, Sora } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";

import ConditionalShell from "@/components/ui/ConditionalShell";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Adabibnak",
  description: "Premium Medical Telehealth Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
    <ClerkProvider>
      <html
        lang="ar"
        dir="rtl"
        suppressHydrationWarning
        className={`
          ${cairo.variable}
          ${inter.variable}
          ${sora.variable}
        `}
      >
        <body className="medical-body">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ConditionalShell>
              {children}
            </ConditionalShell>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}