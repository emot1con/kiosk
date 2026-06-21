import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { ToastProvider } from "@/context/ToastContext";
import LayoutWrapper from "@/components/LayoutWrapper";
import CommandPalette from "@/components/CommandPalette";

export const metadata = {
  title: "Kiosk | Webhook Reliability Layer",
  description: "Guarantee webhook delivery with automatic retries and full visibility.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <AuthProvider>
          <DataProvider>
            <ToastProvider>
              <CommandPalette />
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </ToastProvider>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

