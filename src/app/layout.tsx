import type { Metadata } from "next";
import "./globals.css";
import TabBar from "@/components/TabBar";
import IncidentModal from "@/components/IncidentModal";
import ControversyModal from "@/components/ControversyModal";
import StoreHydrator from "@/components/StoreHydrator";

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
        <StoreHydrator />
        {children}
        <TabBar />
        <IncidentModal />
        <ControversyModal />
      </body>
    </html>
  );
}
