import "./globals.css";

export const metadata = {
  title: "Katalog Aplikasi Internal - DSTI Universitas Diponegoro",
  description:
    "Portal inventarisasi terpusat sistem informasi, pembagian modul pengembang, dan tautan akses layanan di lingkungan Gedung ICT Center Universitas Diponegoro.",
  icons: {
    icon: "/images/undip-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
