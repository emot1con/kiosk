"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Terminal, Link2, Settings, FileText, ChevronRight } from "lucide-react";
import { useData } from "@/context/DataContext";
import styles from "./CommandPalette.module.css";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { endpoints = [], events = [] } = useData();
  const modalRef = useRef(null);

  // Static navigation routes
  const navigationRoutes = [
    { name: "Go to Dashboard", path: "/dashboard", icon: <Terminal size={16} />, section: "Navigation" },
    { name: "Go to Endpoints", path: "/endpoints", icon: <Link2 size={16} />, section: "Navigation" },
    { name: "Go to Event Logs", path: "/events", icon: <FileText size={16} />, section: "Navigation" },
    { name: "Go to Settings", path: "/settings", icon: <Settings size={16} />, section: "Navigation" },
  ];

  // Toggle command palette on Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Compute matched items
  const getFilteredItems = useCallback(() => {
    const term = query.toLowerCase().trim();
    if (!term) {
      return navigationRoutes;
    }

    const matchedNav = navigationRoutes.filter((r) =>
      r.name.toLowerCase().includes(term)
    );

    const matchedEndpoints = endpoints
      .filter((ep) => ep.name.toLowerCase().includes(term))
      .slice(0, 3)
      .map((ep) => ({
        name: ep.name,
        path: `/endpoints/${ep.id}`,
        icon: <Link2 size={16} />,
        section: "Endpoints",
        meta: ep.id,
      }));

    const matchedEvents = events
      .filter((ev) => ev.id.toLowerCase().includes(term) || ev.provider.toLowerCase().includes(term))
      .slice(0, 3)
      .map((ev) => ({
        name: `Event: ${ev.id}`,
        path: `/events/${ev.id}`,
        icon: <FileText size={16} />,
        section: "Recent Events",
        meta: ev.provider,
      }));

    return [...matchedNav, ...matchedEndpoints, ...matchedEvents];
  }, [query, endpoints, events]);

  const items = getFilteredItems();

  const handleSelect = useCallback((item) => {
    router.push(item.path);
    setIsOpen(false);
    setQuery("");
  }, [router]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[selectedIndex]) {
          handleSelect(items[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, items, selectedIndex, handleSelect]);

  if (!isOpen) return null;

  // Group items by section
  const sections = {};
  items.forEach((item) => {
    if (!sections[item.section]) {
      sections[item.section] = [];
    }
    sections[item.section].push(item);
  });

  // Flat array indexes mapping for sectioned list highlighting
  let globalItemIndex = 0;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            autoFocus
            className={styles.input}
            placeholder="Search pages, endpoints, event IDs... (ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className={styles.kbdHint}>ESC</span>
        </div>

        <div className={styles.results}>
          {items.length === 0 ? (
            <div className={styles.empty}>No results found for "{query}"</div>
          ) : (
            Object.keys(sections).map((sectionTitle) => (
              <div key={sectionTitle}>
                <div className={styles.sectionHeader}>{sectionTitle}</div>
                {sections[sectionTitle].map((item) => {
                  const currentIndex = globalItemIndex;
                  globalItemIndex++;
                  const isSelected = currentIndex === selectedIndex;

                  return (
                    <div
                      key={item.path}
                      className={`${styles.item} ${isSelected ? styles.selected : ""}`}
                      onClick={() => handleSelect(item)}
                    >
                      <span className={styles.itemIcon}>{item.icon}</span>
                      <span className={styles.itemText}>{item.name}</span>
                      {item.meta && <span className={styles.itemMeta}>{item.meta}</span>}
                      <ChevronRight size={14} style={{ opacity: isSelected ? 0.8 : 0 }} />
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
