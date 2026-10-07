import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#047857", // Match your app theme/brand color
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://dashboard.teeitupgolf.com.au"),
  title: {
    default: "Tee It Up Golf | Management Dashboard",
    template: "%s | Tee It Up Golf",
  },
  description:
    "Official administration and management dashboard for Tee It Up Golf. Manage bookings, memberships, simulators, and operations.",
  applicationName: "Tee It Up Golf Dashboard",
  keywords: [
    "Tee It Up Golf",
    "Golf Simulator Dashboard",
    "Golf Bookings",
    "Tee It Up Management",
    "Golf Australia",
  ],
  authors: [{ name: "Tee It Up Golf" }],
  creator: "Tee It Up Golf",
  publisher: "Tee It Up Golf",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "https://dashboard.teeitupgolf.com.au",
    siteName: "Tee It Up Golf",
    title: "Tee It Up Golf | Management Dashboard",
    description:
      "Admin and operations portal for Tee It Up Golf facilities and simulators.",
    images: [
      {
        url: "/og-image.png", // Place an image (1200x630px) in /public
        width: 1200,
        height: 630,
        alt: "Tee It Up Golf Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tee It Up Golf | Management Dashboard",
    description: "Admin portal for Tee It Up Golf.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  // If this portal is private / behind authentication:
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}