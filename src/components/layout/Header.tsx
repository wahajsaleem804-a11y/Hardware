"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  PlusCircle, 
  ShoppingCart, 
  UserCheck, 
  Clock, 
  AlertCircle 
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";

export default function Header() {
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
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        {lowStockCount > 0 && (
          <Link
            href="/inventory?filter=low"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium hover:bg-amber-100 transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{lowStockCount} hardware item(s) below reorder point</span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time || "12:00 PM"}</span>
        </div>

        <Link
          href="/accounting/expenses"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
        >
          <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>Expense</span>
        </Link>

        <Link
          href="/contractors"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors border border-indigo-200"
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Contractor Payment</span>
        </Link>

        <Link
          href="/pos"
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-sm shadow-amber-500/20"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>POS Terminal</span>
        </Link>
      </div>
    </header>
  );
}
