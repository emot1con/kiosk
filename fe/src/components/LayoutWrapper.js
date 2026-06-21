"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    let lastKey = null;
    let timeoutId = null;

    const handleKeyDown = (e) => {
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA" ||
        document.activeElement.tagName === "SELECT"
      ) {
        return;
      }

      if (lastKey === "g") {
        if (e.key === "d") {
          router.push("/dashboard");
        } else if (e.key === "e") {
          router.push("/endpoints");
        } else if (e.key === "l") {
          router.push("/events");
        } else if (e.key === "s") {
          router.push("/settings");
        }
        lastKey = null;
        clearTimeout(timeoutId);
      } else if (e.key === "g") {
        lastKey = "g";
        timeoutId = setTimeout(() => {
          lastKey = null;
        }, 1000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [router]);

  if (isAuthPage) {
    return <div className="auth-container">{children}</div>;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

