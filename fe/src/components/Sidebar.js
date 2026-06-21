"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Activity, 
  Terminal, 
  Settings, 
  LogOut, 
  Webhook,
  Search,
  Sun,
  Moon
} from "lucide-react";
import styles from "./Sidebar.module.css";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth() || { user: { email: "user@kiosk.dev" }, logout: () => {} };

  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("kiosk_theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("kiosk_theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const isActive = (path) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    if (path !== "/dashboard" && pathname?.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Endpoints", href: "/endpoints", icon: Webhook },
    { name: "Events", href: "/events", icon: Activity },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <Terminal className={styles.logoIcon} size={22} />
        <span className={styles.logoText}>KIOSK</span>
      </div>

      <button 
        onClick={() => {
          const event = new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true
          });
          window.dispatchEvent(event);
        }}
        className={styles.searchTrigger}
      >
        <Search size={13} />
        <span>Search...</span>
        <kbd>⌘K</kbd>
      </button>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`${styles.navLink} ${active ? styles.activeLink : ""}`}
            >
              <Icon className={styles.navIcon} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.profileInfo}>
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
            <div className={styles.profileEmail}>{user?.email || "user@kiosk.dev"}</div>
            <div className={styles.profileRole}>Developer</div>
          </div>
          <button 
            onClick={toggleTheme} 
            className={styles.themeToggle}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
        <button onClick={logout} className={styles.logoutBtn}>
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}