import "./globals.css";
import { ConfigProvider } from "@/context/ConfigContext";
import { DataProvider } from "@/context/DataContext";
import { ToastProvider } from "@/context/ToastContext";
import LayoutWrapper from "@/components/LayoutWrapper";
import CommandPalette from "@/components/CommandPalette";

export const metadata = {
  title: "Kiosk — Open Source Webhook Reliability Layer",
  description: "Self-hosted webhook reliability layer with automatic retries, dead letter queues, and full delivery visibility. Never miss a webhook again.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <ConfigProvider>
          <DataProvider>
            <ToastProvider>
              <CommandPalette />
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </ToastProvider>
          </DataProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
