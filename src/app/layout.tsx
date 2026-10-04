import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { SidebarProvider } from "@/components/layout/SidebarContext";

export const metadata: Metadata = {
  title: "Alkaram Traders - POS, Hardware & Inventory Management",
  description: "Specialized inventory management, POS checkout and contractor accounting system for Alkaram Traders.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.ico",
    apple: "/brand/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-slate-50 text-slate-900 h-full overflow-hidden antialiased">
        <SidebarProvider>
          <div className="flex h-screen w-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 custom-scrollbar">
                <div className="max-w-7xl w-full mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
