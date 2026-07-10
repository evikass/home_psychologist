import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";

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

export const metadata: Metadata = {
  title: "Мастер Кит · ИИ-диагностика по методу Дарьи Трутневой",
  description:
    "Опишите свою ситуацию своими словами — ИИ определит уровень развития, застрявшую эмоцию, эмоциональную яму и подберёт точные проработки по методике Дарьи Трутневой «Мастер Кит».",
  keywords: [
    "Мастер Кит",
    "Дарья Трутнева",
    "проработки",
    "эмоциональная яма",
    "уровни развития",
    "самопознание",
    "эмоции",
    "трансформация",
  ],
  authors: [{ name: "Мастер Кит" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.svg"],
  },
  openGraph: {
    title: "Мастер Кит · ИИ-диагностика",
    description:
      "Опишите ситуацию — получите диагноз уровня, эмоции и список проработок по методике Дарьи Трутневой.",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Мастер Кит — ИИ-диагностика по методике Дарьи Трутневой",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Мастер Кит · ИИ-диагностика",
    description:
      "Опишите ситуацию — получите диагноз уровня, эмоции и список проработок по методике Дарьи Трутневой.",
    images: ["/og-image.svg"],
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
          <LanguageProvider>{children}</LanguageProvider>
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
