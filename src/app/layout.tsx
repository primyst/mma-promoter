import type { Metadata } from "next";
import "./globals.css";
import TabBar from "@/components/TabBar";

export const metadata: Metadata = {
  title: "MMA Promoter",
  description: "Run your own MMA promotion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black">
        {children}
        <TabBar />
      </body>
    </html>
  );
}
