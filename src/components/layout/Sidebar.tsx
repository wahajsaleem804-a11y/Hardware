"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Users,
  Truck,
  DollarSign,
  Receipt,
  Scale,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import AlkaramLogo from "@/components/brand/AlkaramLogo";
import { useSidebar, NavGroup } from "./SidebarContext";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const {
    isMobileOpen,
    closeMobile,
    sectionOrder,
    moveSectionUp,
    moveSectionDown,
    collapsedSections,
    toggleSectionCollapse,
  } = useSidebar();

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [expectedCash, setExpectedCash] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const updateStatus = async () => {
      try {
        const [drawer, products] = await Promise.all([
          HardwareStoreService.getCashDrawer(),
          HardwareStoreService.getProducts(),
        ]);
        if (!isMounted) return;
        setDrawerOpen(drawer?.status === "open");
        setExpectedCash(drawer ? Number(drawer.expected_cash) : 0);
        const count = products.filter(
          (p) => Number(p.current_stock) <= Number(p.min_reorder_level)
        ).length;
        setLowStockCount(count);
      } catch (e) {
        console.error("Sidebar load error:", e);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navGroupsData: Record<string, NavGroup> = {
    "store-operations": {
      id: "store-operations",
      title: "Store Operations",
      links: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/pos", label: "POS Checkout", icon: ShoppingCart, badge: "Counter" },
        { href: "/inventory", label: "Inventory & SKUs", icon: Package, count: lowStockCount },
        { href: "/inventory/adjustments", label: "Wastage & Audits", icon: Layers },
      ],
    },
    "accounts-credit": {
      id: "accounts-credit",
      title: "Accounts & Credit",
      links: [
        { href: "/contractors", label: "Contractor Ledgers", icon: Users, badge: "AR" },
        { href: "/suppliers", label: "Suppliers & POs", icon: Truck, badge: "AP" },
      ],
    },
    "financials-cash": {
      id: "financials-cash",
      title: "Financials & Cash",
      links: [
        { href: "/accounting", label: "Profit & Loss (P&L)", icon: DollarSign },
        {
          href: "/accounting/register",
          label: "Cash Register (Till)",
          icon: Scale,
          status: drawerOpen ? "Open" : "Closed",
        },
        { href: "/accounting/expenses", label: "Store Expenses", icon: Receipt },
      ],
    },
  };

  // Order groups based on sectionOrder state
  const orderedGroups: NavGroup[] = sectionOrder
    .map((id) => navGroupsData[id])
    .filter(Boolean);

  return (
    <>
      {/* Mobile Backdrop Overlay - closes sidebar when tapped */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar: Fixed/Sticky layout with independent vertical scrolling */}
      <aside
        id="app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:sticky md:top-0 h-screen w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 select-none shrink-0 transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlkaramLogo size={40} variant="badge" />
            <div>
              <h1 className="font-extrabold text-white tracking-tight text-sm leading-snug">
                Alkaram <span className="text-blue-400">Traders</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Hardware & Timber POS</p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            type="button"
            onClick={closeMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - Independent Scrolling Container for Sidebar */}
        <div
          id="sidebar-navigation-container"
          className="flex-1 overflow-y-auto overscroll-contain py-3 px-3 sidebar-scrollbar space-y-3"
        >
          {orderedGroups.map((group, index) => {
            const isFirst = index === 0;
            const isLast = index === orderedGroups.length - 1;
            const isCollapsed = Boolean(collapsedSections[group.id]);

            return (
              <section
                key={group.id}
                id={`sidebar-section-${group.id}`}
                data-section={group.id}
                className={cn(
                  "sidebar-section relative isolate rounded-xl transition-all duration-200 border",
                  group.id === "store-operations"
                    ? "bg-slate-900/90 border-slate-800 shadow-xs"
                    : "bg-slate-900/50 border-slate-800/70 hover:border-slate-800"
                )}
              >
                {/* Independent Section Header with Move Up/Down & Collapse Controls */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/50 bg-slate-950/30 rounded-t-xl">
                  <span
                    className={cn(
                      "text-[11px] font-bold tracking-wider uppercase",
                      group.id === "store-operations" ? "text-blue-400" : "text-slate-400"
                    )}
                  >
                    {group.title}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Move Up Button - Moves this section up independently */}
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSectionUp(group.id);
                      }}
                      className={cn(
                        "p-1 rounded transition-colors",
                        isFirst
                          ? "text-slate-600 cursor-not-allowed opacity-30"
                          : "text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                      )}
                      title={`Move ${group.title} Up`}
                      aria-label={`Move ${group.title} section up`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down Button - Moves this section down independently */}
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSectionDown(group.id);
                      }}
                      className={cn(
                        "p-1 rounded transition-colors",
                        isLast
                          ? "text-slate-600 cursor-not-allowed opacity-30"
                          : "text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                      )}
                      title={`Move ${group.title} Down`}
                      aria-label={`Move ${group.title} section down`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Section Collapse / Expand Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleSectionCollapse(group.id)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-0.5"
                      title={isCollapsed ? `Expand ${group.title}` : `Collapse ${group.title}`}
                      aria-label={isCollapsed ? `Expand ${group.title}` : `Collapse ${group.title}`}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Section Links - Hidden if collapsed */}
                {!isCollapsed && (
                  <div className="p-1.5 space-y-1">
                    {group.links.map((link) => {
                      const Icon = link.icon;
                      const isActive = pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => closeMobile()}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                            isActive
                              ? "bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/25"
                              : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon
                              className={cn(
                                "w-4 h-4 shrink-0 transition-colors",
                                isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"
                              )}
                            />
                            <span className="truncate">{link.label}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {link.badge && (
                              <span
                                className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                                  isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-slate-800 text-blue-400 border border-slate-700"
                                )}
                              >
                                {link.badge}
                              </span>
                            )}
                            {typeof link.count === "number" && link.count > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-rose-500 text-white animate-pulse">
                                {link.count} low
                              </span>
                            )}
                            {link.status && (
                              <span
                                className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded font-bold",
                                  link.status === "Open"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                )}
                              >
                                {link.status}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Till & Showroom Status Card - Fixed at Bottom of Sidebar */}
        <div
          id="sidebar-section-till-status"
          data-section="till-status"
          className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/60 shrink-0"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Till Register:</span>
            <span className={cn("font-semibold", drawerOpen ? "text-emerald-400" : "text-rose-400")}>
              {drawerOpen ? `$${expectedCash.toFixed(2)} Active` : "Register Closed"}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium">Showroom Terminal</span>
            </div>
            <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              Counter 1
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
