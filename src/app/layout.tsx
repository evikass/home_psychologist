import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { RoleProvider } from "@/components/role-provider";
import { StarsOverlay } from "@/components/stars-overlay";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// basePath для иконок — на GitHub Pages нужен префикс /home_psychologist
const ICON_BASE = process.env.STATIC_EXPORT === "true" ? "/home_psychologist" : "";

export const metadata: Metadata = {
  title: "Домашний психолог · ИИ-диагностика и самотерапия",
  description:
    "Опишите свою ситуацию своими словами — ИИ определит эмоциональное состояние, застрявшие эмоции, базовые потребности и подберёт точные практики для самотерапии. Объединяет методы КПТ, гештальта, mindfulness и телесно-ориентированной терапии.",
  keywords: [
    "домашний психолог",
    "самотерапия",
    "проработки",
    "эмоции",
    "осознанность",
    "mindfulness",
    "КПТ",
    "гештальт",
    "трансформация",
    "психология",
  ],
  authors: [{ name: "Домашний психолог" }],
  icons: {
    icon: [
      { url: `${ICON_BASE}/favicon.svg`, type: "image/svg+xml" },
    ],
    apple: [
      { url: `${ICON_BASE}/apple-touch-icon.svg`, type: "image/svg+xml" },
    ],
    shortcut: [`${ICON_BASE}/favicon.svg`],
  },
  openGraph: {
    title: "Домашний психолог · ИИ-диагностика",
    description:
      "Опишите ситуацию — получите эмоциональный разбор и персональные практики для самотерапии.",
    type: "website",
    images: [
      {
        url: `${ICON_BASE}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: "Домашний психолог — ИИ-диагностика и самотерапия",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Домашний психолог · ИИ-диагностика",
    description:
      "Опишите ситуацию — получите эмоциональный разбор и персональные практики для самотерапии.",
    images: [`${ICON_BASE}/og-image.svg`],
  },
};

export const viewport: Viewport = {
  themeColor: "#fdf6f0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${fraunces.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LanguageProvider>
            <RoleProvider>
              <StarsOverlay />
              <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
            </RoleProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Sonner
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "rounded-xl border bg-card text-card-foreground shadow-md",
            },
          }}
        />
      </body>
    </html>
  );
}
