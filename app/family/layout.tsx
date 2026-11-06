import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "우리 가족 기념일",
  description: "음력·양력 가족 생일, 결혼기념일, 제사 달력",
  manifest: "/family.webmanifest",
  appleWebApp: { capable: true, title: "가족기념일", statusBarStyle: "default" },
  icons: { icon: "/family-icon-192.png", apple: "/family-apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#be123c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
