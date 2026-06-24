import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "จดรายรับรายจ่าย",
  description: "เว็บแอปบันทึกรายรับ-รายจ่าย สไตล์มินิมอล น่ารัก ใช้งานง่าย",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${nunito.variable} h-full`}>
      <body className="min-h-full flex flex-col font-nunito bg-cream-50 text-stone-700 antialiased">
        {children}
      </body>
    </html>
  );
}
