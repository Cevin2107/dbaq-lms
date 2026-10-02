import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AppLaunchEntrance } from "@/components/ui/AppLaunchEntrance";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://dbaq-lms.vercel.app"),
  title: "Gia sư Đào Bá Anh Quân",
  description: "Hệ thống bài tập trực tuyến - Giao và làm bài tập, tự động chấm điểm, theo dõi tiến độ học tập",
  icons: {
    icon: [
      { url: "/icon.png?v=3", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon.png?v=3", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gia sư Đào Bá Anh Quân",
  },
  openGraph: {
    title: "Gia sư Đào Bá Anh Quân - ĐBAQ LMS",
    description: "Hệ thống bài tập trực tuyến - Giao và làm bài tập, tự động chấm điểm, theo dõi tiến độ học tập",
    siteName: "Gia sư Đào Bá Anh Quân",
    type: "website",
    locale: "vi_VN",
    images: [
      {
        url: "/og-image.png?v=3",
        width: 1200,
        height: 630,
        alt: "Gia sư Đào Bá Anh Quân - ĐBAQ LMS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gia sư Đào Bá Anh Quân - ĐBAQ LMS",
    description: "Hệ thống bài tập trực tuyến",
    images: ["/og-image.png?v=3"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png?v=3" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>
            <ToastProvider>
              <AppLaunchEntrance>
                {children}
              </AppLaunchEntrance>
            </ToastProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
