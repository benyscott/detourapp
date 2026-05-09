import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

export const metadata = {
  manifest: "/manifest.json",
  title: "Detour: navigation meets zen",
  description: "An app that displays a compass pointing to different POIs with estimated time to walk or cycle",
  appleWebApp: {
    capable: true,
    title: "Detour",
    // Lets the page paint edge-to-edge under the status bar so it matches a white UI (use env(safe-area-inset-*)).
    statusBarStyle: "black-translucent",
  },
};

/** iOS Home Screen PWA + Safari: tints the status bar region to match the app background. */
export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
