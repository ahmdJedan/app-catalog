import "./globals.css";
import PwaRegister from "./components/PwaRegister";

export const viewport = {
  themeColor: "#0f294a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  title: "Katalog Aplikasi Internal - DSTI UNDIP",
  description:
    "Portal inventarisasi terpusat aplikasi dan layanan internal DSTI Universitas Diponegoro.",
  manifest: "/manifest.webmanifest",
  applicationName: "Katalog DSTI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Katalog DSTI",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
