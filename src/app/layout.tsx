import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Streaming",
  icons: { icon: { url: "/favicon.png", type: "image/png" } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><div id="root">{children}</div></body></html>;
}
