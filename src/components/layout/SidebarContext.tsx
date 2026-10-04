"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface NavLinkItem {
  href: string;
  label: string;
  icon: any;
  badge?: string;
  count?: number;
  status?: string;
}

export interface NavGroup {
  id: string;
  title: string;
  description?: string;
  links: NavLinkItem[];
}

interface SidebarContextType {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  sectionOrder: string[];
  moveSectionUp: (sectionId: string) => void;
  moveSectionDown: (sectionId: string) => void;
  collapsedSections: Record<string, boolean>;
  toggleSectionCollapse: (sectionId: string) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const DEFAULT_ORDER = ["store-operations", "accounts-credit", "financials-cash"];

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_ORDER);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Load saved section order from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("alkaram_sidebar_section_order");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all default sections are present
          const unique = Array.from(new Set([...parsed, ...DEFAULT_ORDER]));
          setSectionOrder(unique);
        }
      }
    } catch (e) {
      // LocalStorage access may fail in incognito or restricted mode
    }
  }, []);

  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);

  const moveSectionUp = (sectionId: string) => {
    setSectionOrder((prev) => {
      const idx = prev.indexOf(sectionId);
      if (idx <= 0) return prev;
      const copy = [...prev];
      const temp = copy[idx - 1];
      copy[idx - 1] = copy[idx];
      copy[idx] = temp;
      try {
        localStorage.setItem("alkaram_sidebar_section_order", JSON.stringify(copy));
      } catch (e) {}
      return copy;
    });
  };

  const moveSectionDown = (sectionId: string) => {
    setSectionOrder((prev) => {
      const idx = prev.indexOf(sectionId);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[idx + 1];
      copy[idx + 1] = copy[idx];
      copy[idx] = temp;
      try {
        localStorage.setItem("alkaram_sidebar_section_order", JSON.stringify(copy));
      } catch (e) {}
      return copy;
    });
  };

  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <SidebarContext.Provider
      value={{
        isMobileOpen,
        setIsMobileOpen,
        toggleMobile,
        closeMobile,
        sectionOrder,
        moveSectionUp,
        moveSectionDown,
        collapsedSections,
        toggleSectionCollapse,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
