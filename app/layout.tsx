import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QLSX - Quản lý Sản xuất & Lắp đặt",
  description: "Web app quản lý sản xuất và lắp đặt",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
