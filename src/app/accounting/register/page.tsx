"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scale,
  DollarSign,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  History,
  Calculator,
  RotateCcw,
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import { CashDrawerSession } from "@/lib/data/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function CashRegisterPage() {
  const [drawer, setDrawer] = useState<CashDrawerSession | null>(null);
  const [physicalCount, setPhysicalCount] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState("");
  const [newFloat, setNewFloat] = useState(200);
  const [cashierName, setCashierName] = useState("Counter Cashier");

  const loadData = async () => {
    const d = await HardwareStoreService.getCashDrawer();
    setDrawer(d);
    if (d && d.status === "open") {
      setPhysicalCount(d.expected_cash);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!drawer) return <div className="p-8 text-slate-500">Loading cash drawer data...</div>;

  const isOpen = drawer.status === "open";
  const discrepancy = physicalCount - drawer.expected_cash;

  const handleCloseRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await HardwareStoreService.closeCashDrawer(physicalCount, closingNotes);
    await loadData();
  };

  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await HardwareStoreService.openCashDrawer(newFloat, cashierName);
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/accounting" className="text-xs text-slate-500 hover:text-slate-800">
              ← Accounting
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daily Cash Register (Till) Control</h1>
          <p className="text-sm text-slate-500">
            Reconcile opening float, cash sales, petty payouts, and audit end-of-shift discrepancies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 ${
              isOpen
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-slate-100 text-slate-700 border border-slate-300"
            }`}
          >
            {isOpen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Shift Register {isOpen ? "ACTIVE / OPEN" : "CLOSED"}</span>
          </span>
        </div>
      </div>

      {/* Till KPI Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Opening Float */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">1. Opening Float</span>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(drawer.opening_float)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Starting change in till</div>
        </div>

        {/* Cash Sales Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">2. Cash Collected (+)</span>
          <div className="mt-2 text-2xl font-black text-emerald-600 font-mono">
            +{formatCurrency(drawer.cash_sales_total)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Cash sales + contractor cash</div>
        </div>

        {/* Cash Expenses Paid from Till */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">3. Cash Paid Out (-)</span>
          <div className="mt-2 text-2xl font-black text-rose-600 font-mono">
            -{formatCurrency(drawer.cash_expenses_total)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Freight, snacks, shop petty cash</div>
        </div>

        {/* Expected Cash in Drawer */}
        <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200/80 shadow-xs">
          <span className="text-xs font-bold text-blue-900 uppercase">4. Expected in Drawer</span>
          <div className="mt-2 text-2xl font-black text-blue-900 font-mono">
            {formatCurrency(drawer.expected_cash)}
          </div>
          <div className="text-[11px] text-blue-700 font-semibold mt-1">Calculated System Total</div>
        </div>
      </div>

      {/* Reconciliation Form */}
      {isOpen ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-base font-bold text-slate-900">End-of-Shift Physical Cash Count</h2>
            <p className="text-xs text-slate-500">
              Count all physical currency bills and coins currently in the till and enter below.
            </p>
          </div>

          <form onSubmit={handleCloseRegister} className="space-y-6 max-w-xl">
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-sm">
                Physical Cash Counted in Drawer ($) *
              </label>
              <div className="relative">
                <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={physicalCount}
                  onChange={(e) => setPhysicalCount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl font-mono text-xl font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Discrepancy Status Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                discrepancy === 0
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : discrepancy > 0
                  ? "bg-blue-50 border-blue-200 text-blue-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                {discrepancy === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                )}
                <span>
                  {discrepancy === 0
                    ? "Drawer is perfectly balanced (Zero discrepancy)!"
                    : discrepancy > 0
                    ? `Drawer OVER by ${formatCurrency(discrepancy)} (Excess cash)`
                    : `Drawer SHORT by ${formatCurrency(Math.abs(discrepancy))} (Shortage)`}
                </span>
              </div>
              <div className="font-mono font-black text-sm">{formatCurrency(discrepancy)}</div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Shift Closing Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Afternoon shift handed over to evening cashier. Everything counted."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Close Shift & Reconcile Register</span>
            </button>
          </form>
        </div>
      ) : (
        /* Open New Shift Form */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-base font-bold text-slate-900">Open New Register Shift</h2>
            <p className="text-xs text-slate-500">
              Set the opening cash float for the morning or afternoon cashier shift.
            </p>
          </div>

          <form onSubmit={handleOpenRegister} className="space-y-4 max-w-md">
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Cashier Name</label>
              <input
                type="text"
                required
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Opening Cash Float ($) *</label>
              <input
                type="number"
                step="1"
                required
                value={newFloat}
                onChange={(e) => setNewFloat(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-base font-black text-blue-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Open Cash Register ({formatCurrency(newFloat)})</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
