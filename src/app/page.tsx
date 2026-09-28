"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  Users,
  Truck,
  Package,
  Layers,
  ArrowUpRight,
  ChevronRight,
  Scale,
  RefreshCw,
  Plus,
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import { Product, Customer, Sale, FinancialSummary } from "@/lib/data/types";
import { formatCurrency, formatQty, formatDate } from "@/lib/utils";
import AlkaramLogo from "@/components/brand/AlkaramLogo";

export default function DashboardPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [contractors, setContractors] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [fin, products, sales, custs] = await Promise.all([
        HardwareStoreService.getFinancialSummary(),
        HardwareStoreService.getProducts(),
        HardwareStoreService.getSales(),
        HardwareStoreService.getCustomers(),
      ]);

      setSummary(fin);
      setLowStockProducts(products.filter((p) => Number(p.current_stock) <= Number(p.min_reorder_level)));
      setRecentSales(sales.slice(0, 5));

      const activeContractors = custs.filter(
        (c) => c.customer_type === "contractor" && Number(c.current_balance) > 0
      );
      setContractors(activeContractors.sort((a, b) => Number(b.current_balance) - Number(a.current_balance)));
    } catch (err) {
      console.error("Dashboard refresh error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (isLoading && !summary) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold">Loading Alkaram Traders inventory & financial records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Store Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <AlkaramLogo size={52} variant="badge" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Alkaram <span className="text-blue-600">Traders</span>
            </h1>
            <p className="text-sm text-slate-500">
              Hardware, timber inventory, contractor ledgers & POS counter.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/pos"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Open POS Terminal</span>
          </Link>
          <Link
            href="/accounting/register"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-sm transition-all"
          >
            <Scale className="w-4 h-4 text-slate-500" />
            <span>Till Register</span>
          </Link>
        </div>
      </div>

      {/* Critical Low-Stock Warning Banner */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {lowStockProducts.length} Wood & Hardware Item(s) Reached Reorder Threshold
              </h3>
              <p className="text-xs text-slate-600">
                Items like <span className="font-semibold text-slate-900">{lowStockProducts[0]?.name}</span> ({formatQty(lowStockProducts[0]?.current_stock, lowStockProducts[0]?.unit_of_measure)}) are running low. Restock now to avoid carpentry workshop delays.
              </p>
            </div>
          </div>
          <Link
            href="/inventory?filter=low"
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shrink-0 transition-colors shadow-xs"
          >
            View Reorder List →
          </Link>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales / Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Invoiced Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{formatCurrency(summary?.todayRevenue)}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Gross Margin {Number(summary?.grossMarginPercent ?? 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Contractor Credit / AR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contractor Receivables</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{formatCurrency(summary?.totalReceivables)}</div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>{contractors.length} active balances</span>
              <Link href="/contractors" className="text-indigo-600 font-bold hover:underline">
                Ledger →
              </Link>
            </div>
          </div>
        </div>

        {/* Supplier Payables / AP */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier Payables</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{formatCurrency(summary?.totalPayables)}</div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Wholesale accounts</span>
              <Link href="/suppliers" className="text-blue-600 font-bold hover:underline">
                POs →
              </Link>
            </div>
          </div>
        </div>

        {/* Inventory Stock Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Valuation (Retail)</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{formatCurrency(summary?.inventoryValuationRetail)}</div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Cost Basis: {formatCurrency(summary?.inventoryValuationCost)}</span>
              <Link href="/inventory" className="text-slate-700 font-bold hover:underline">
                Catalog →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Contractor Credit Accounts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Contractor Credit Accounts</h2>
              <p className="text-xs text-slate-500">Live outstanding balances from active contractor ledgers.</p>
            </div>
            <Link
              href="/contractors"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Manage All Ledgers</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {contractors.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto text-slate-300 stroke-1 mb-1" />
              <p className="text-xs font-semibold">No outstanding contractor debts recorded.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {contractors.slice(0, 4).map((contractor) => {
                const percent = Math.min(100, (Number(contractor.current_balance) / (Number(contractor.credit_limit) || 1)) * 100);
                return (
                  <div key={contractor.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{contractor.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Net {contractor.payment_terms_days}d
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Tel: {contractor.phone}</span>
                        <span>•</span>
                        <span>Credit Line: {formatCurrency(contractor.credit_limit)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="text-sm font-black text-rose-600">
                          {formatCurrency(contractor.current_balance)}
                        </div>
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent > 80 ? "bg-rose-500" : "bg-blue-600"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <Link
                        href={`/contractors/${contractor.id}`}
                        className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        Statement
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Actions & Recent Sales */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/pos"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-sm font-medium transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <span>Point of Sale Terminal</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/inventory"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-sm font-medium transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <span>Add / Manage SKUs</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/accounting/expenses"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-sm font-medium transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span>Record Store Expense</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Recent Invoices Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Recent Invoices</h3>
              <span className="text-[11px] text-slate-400 font-mono">{recentSales.length} total</span>
            </div>
            {recentSales.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No sales completed yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {recentSales.map((s) => (
                  <div key={s.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 font-mono">{s.invoice_number}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{s.customer_name} • {s.payment_method}</div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">{formatCurrency(s.total_amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
