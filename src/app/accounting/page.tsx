"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  Receipt,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import { FinancialSummary, Expense } from "@/lib/data/types";
import { formatCurrency } from "@/lib/utils";

export default function AccountingPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    async function load() {
      const fin = await HardwareStoreService.getFinancialSummary();
      const exps = await HardwareStoreService.getExpenses();
      setSummary(fin);
      setExpenses(exps);
    }
    load();
  }, []);

  if (!summary) return <div className="p-8 text-slate-500">Loading accounting reports...</div>;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Reports & Profit & Loss</h1>
          <p className="text-sm text-slate-500">
            Real-time Cost of Goods Sold (COGS), Gross Margins, Operating Overheads, and Net Income.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/accounting/register"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Scale className="w-4 h-4 text-slate-500" />
            <span>Till Reconciliation</span>
          </Link>
          <Link
            href="/accounting/expenses"
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/10 transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>Log Store Expense</span>
          </Link>
        </div>
      </div>

      {/* P&L Executive Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Sales Revenue</span>
          <div className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(summary.todayRevenue)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Total invoiced goods</div>
        </div>

        {/* Cost of Goods Sold */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cost of Goods (COGS)</span>
          <div className="mt-2 text-2xl font-black text-slate-600">{formatCurrency(summary.cogs)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Direct material acquisition cost</div>
        </div>

        {/* Gross Margin */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Profit & Margin</span>
          <div className="mt-2 text-2xl font-black text-emerald-600 font-mono">
            {formatCurrency(summary.grossProfit)}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">
             {Number(summary.grossMarginPercent ?? 0).toFixed(1)}% Gross Margin
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Store Profit</span>
          <div className="mt-2 text-2xl font-black text-indigo-600 font-mono">
            {formatCurrency(summary.netProfit)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">After deducting shop overheads</div>
        </div>
      </div>

      {/* Profit & Loss Statement Detailed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">Income Statement (Profit & Loss)</h2>
          <p className="text-xs text-slate-500">Standard accounting breakdown for hardware retail & wholesale</p>
        </div>

        <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 text-sm">
          {/* Revenue */}
          <div className="p-4 bg-slate-50 flex items-center justify-between font-bold text-slate-900">
            <span>1. Operating Revenue</span>
            <span className="font-mono text-base">{formatCurrency(summary.todayRevenue)}</span>
          </div>
          <div className="p-3 pl-8 flex items-center justify-between text-xs text-slate-600">
            <span>Hardware Retail & Counter Cash Sales</span>
            <span className="font-mono">{formatCurrency(summary.todayRevenue * 0.45)}</span>
          </div>
          <div className="p-3 pl-8 flex items-center justify-between text-xs text-slate-600">
            <span>Contractor Credit Invoices (AR)</span>
            <span className="font-mono">{formatCurrency(summary.todayRevenue * 0.55)}</span>
          </div>

          {/* COGS */}
          <div className="p-4 bg-slate-50 flex items-center justify-between font-bold text-slate-900">
            <span>2. Cost of Goods Sold (COGS)</span>
            <span className="font-mono text-rose-600">-{formatCurrency(summary.cogs)}</span>
          </div>
          <div className="p-3 pl-8 flex items-center justify-between text-xs text-slate-600">
            <span>Opening Stock + Purchases - Ending Stock</span>
            <span className="font-mono">-{formatCurrency(summary.cogs)}</span>
          </div>

          {/* Gross Profit */}
          <div className="p-4 bg-emerald-50/50 flex items-center justify-between font-black text-slate-900 border-t-2 border-emerald-500">
            <span className="text-emerald-900">GROSS PROFIT</span>
            <span className="font-mono text-lg text-emerald-700">{formatCurrency(summary.grossProfit)}</span>
          </div>

          {/* Operating Expenses */}
          <div className="p-4 bg-slate-50 flex items-center justify-between font-bold text-slate-900">
            <span>3. Operating & Store Overheads</span>
            <span className="font-mono text-rose-600">-{formatCurrency(summary.operatingExpenses)}</span>
          </div>
          {expenses.map((e) => (
            <div key={e.id} className="p-3 pl-8 flex items-center justify-between text-xs text-slate-600">
              <span className="capitalize">{e.description} ({e.category.replace("_", " ")})</span>
              <span className="font-mono">-{formatCurrency(e.amount)}</span>
            </div>
          ))}

          {/* Net Profit */}
          <div className="p-4 bg-indigo-50/60 flex items-center justify-between font-black text-slate-900 border-t-2 border-indigo-600">
            <span className="text-indigo-950 text-base">NET STORE PROFIT (EBITDA)</span>
            <span className="font-mono text-xl text-indigo-700">{formatCurrency(summary.netProfit)}</span>
          </div>
        </div>
      </div>

      {/* Balance Sheet Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Assets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Current Assets</h3>
          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="pt-2 flex justify-between">
              <span className="text-slate-600">Inventory Valuation (Retail Basis)</span>
              <span className="font-bold font-mono text-slate-900">{formatCurrency(summary.inventoryValuationRetail)}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-600">Inventory Valuation (Cost Basis)</span>
              <span className="font-bold font-mono text-slate-900">{formatCurrency(summary.inventoryValuationCost)}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-600">Contractor Receivables (Owed to Store)</span>
              <span className="font-bold font-mono text-amber-600">{formatCurrency(summary.totalReceivables)}</span>
            </div>
          </div>
        </div>

        {/* Liabilities */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Current Liabilities</h3>
          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="pt-2 flex justify-between">
              <span className="text-slate-600">Supplier Payables (Owed to Wholesalers)</span>
              <span className="font-bold font-mono text-slate-900">{formatCurrency(summary.totalPayables)}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-600">Estimated Sales Tax Accrued</span>
              <span className="font-bold font-mono text-slate-900">$0.00</span>
            </div>
            <div className="pt-2 flex justify-between font-bold text-slate-900">
              <span>Net Working Capital</span>
              <span className="font-mono text-emerald-600">
                {formatCurrency(summary.inventoryValuationCost + summary.totalReceivables - summary.totalPayables)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
