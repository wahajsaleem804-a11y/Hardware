"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  PlusCircle, 
  ShoppingCart, 
  UserCheck, 
  Clock, 
  AlertCircle,
  Menu,
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import { useSidebar } from "./SidebarContext";

export default function Header() {
  const { toggleMobile } = useSidebar();
  const [time, setTime] = useState("");
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    const updateLowStock = async () => {
      try {
        const products = await HardwareStoreService.getProducts();
        if (!isMounted) return;
        setLowStockCount(products.filter((p) => Number(p.current_stock) <= Number(p.min_reorder_level)).length);
      } catch (e) {
        console.error("Header stock fetch error:", e);
      }
    };
    updateLowStock();
    const stockInterval = setInterval(updateLowStock, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearInterval(stockInterval);
    };
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          onClick={toggleMobile}
          className="md:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/80 text-xs font-bold text-blue-900 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Alkaram Traders</span>
        </div>

        {lowStockCount > 0 && (
          <Link
            href="/inventory?filter=low"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-100 transition-colors truncate"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="truncate">{lowStockCount} low stock</span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time || "12:00 PM"}</span>
        </div>

        <Link
          href="/accounting/expenses"
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
          title="Record Store Expense"
        >
          <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Expense</span>
        </Link>

        <Link
          href="/contractors"
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors border border-indigo-200"
          title="Contractor Ledger & Payments"
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden md:inline">Contractor Payment</span>
          <span className="md:hidden hidden sm:inline">Contractor</span>
        </Link>

        <Link
          href="/pos"
          className="flex items-center gap-1.5 text-xs font-bold px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm shadow-blue-500/20"
          title="Open POS Terminal"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>POS<span className="hidden sm:inline"> Terminal</span></span>
        </Link>
      </div>
    </header>
  );
}
