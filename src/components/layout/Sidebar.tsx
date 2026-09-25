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
  Database,
  Flame,
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import AlkaramLogo from "@/components/brand/AlkaramLogo";

interface NavLinkItem {
  href: string;
  label: string;
  icon: any;
  badge?: string;
  count?: number;
  status?: string;
}

interface NavGroup {
  title: string;
  links: NavLinkItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
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
        const count = products.filter((p) => Number(p.current_stock) <= Number(p.min_reorder_level)).length;
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

  const navGroups: NavGroup[] = [
    {
      title: "Store Operations",
      links: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/pos", label: "POS Checkout", icon: ShoppingCart, badge: "Counter" },
        { href: "/inventory", label: "Inventory & SKUs", icon: Package, count: lowStockCount },
        { href: "/inventory/adjustments", label: "Wastage & Audits", icon: Layers },
      ],
    },
    {
      title: "Accounts & Credit",
      links: [
        { href: "/contractors", label: "Contractor Ledgers", icon: Users, badge: "AR" },
        { href: "/suppliers", label: "Suppliers & POs", icon: Truck, badge: "AP" },
      ],
    },
    {
      title: "Financials & Cash",
      links: [
        { href: "/accounting", label: "Profit & Loss (P&L)", icon: DollarSign },
        { href: "/accounting/register", label: "Cash Register (Till)", icon: Scale, status: drawerOpen ? "Open" : "Closed" },
        { href: "/accounting/expenses", label: "Store Expenses", icon: Receipt },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-screen flex flex-col border-r border-slate-800 select-none shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <AlkaramLogo size={40} variant="badge" />
          <div>
            <h1 className="font-extrabold text-white tracking-tight text-sm leading-snug">
              Alkaram <span className="text-blue-400">Wood Works</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Timber & Carpentry POS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/25"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`} />
                      <span>{link.label}</span>
                    </div>
                    {link.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-blue-400 border border-slate-700"
                      }`}>
                        {link.badge}
                      </span>
                    )}
                    {typeof link.count === "number" && link.count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-rose-500 text-white animate-pulse">
                        {link.count} low
                      </span>
                    )}
                    {link.status && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        link.status === "Open" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}>
                        {link.status}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Till & Showroom Status Card */}
      <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Till Register:</span>
          <span className={`font-semibold ${drawerOpen ? "text-emerald-400" : "text-rose-400"}`}>
            {drawerOpen ? `$${expectedCash.toFixed(2)} Active` : "Register Closed"}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
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
  );
}
