"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Receipt,
  Plus,
  DollarSign,
  TrendingDown,
  X,
  CheckCircle,
  Truck,
  Zap,
  Coffee,
  Wrench,
  Building,
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import { Expense, ExpenseCategory } from "@/lib/data/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: "utilities" as ExpenseCategory,
    amount: 50,
    payment_method: "cash_drawer" as "cash_drawer" | "bank" | "card",
    paid_to: "",
    description: "",
    receipt_ref: "",
  });

  const loadData = async () => {
    const exps = await HardwareStoreService.getExpenses();
    setExpenses(Array.isArray(exps) ? exps : []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    HardwareStoreService.addExpense({
      ...formData,
      amount: Number(formData.amount),
    });
    setIsModalOpen(false);
    setFormData({
      category: "utilities",
      amount: 50,
      payment_method: "cash_drawer",
      paid_to: "",
      description: "",
      receipt_ref: "",
    });
    loadData();
  };

  const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
      case "freight_transport":
        return <Truck className="w-3.5 h-3.5 text-blue-500" />;
      case "utilities":
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case "tea_refreshment":
        return <Coffee className="w-3.5 h-3.5 text-orange-500" />;
      case "maintenance":
        return <Wrench className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <Receipt className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/accounting" className="text-xs text-slate-500 hover:text-slate-800">
              ← Accounting
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Store Operating Expenses</h1>
          <p className="text-sm text-slate-500">
            Log shop overheads, freight-in shipping for heavy goods, petty cash, and utilities.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/10 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Expense KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Shop Expenses</span>
          <div className="mt-2 text-2xl font-black text-rose-600 font-mono">
            {formatCurrency(totalExpense)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Deducted from gross profit</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Paid via Cash Till</span>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(
              expenses
                .filter((e) => e.payment_method === "cash_drawer")
                .reduce((acc, e) => acc + e.amount, 0)
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Auto-deducted from register balance</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Expense Count</span>
          <div className="mt-2 text-2xl font-black text-slate-900">{expenses.length} Records</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Itemized store receipts</div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recorded Operating Costs</h2>
          <span className="text-xs text-slate-500">{expenses.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Paid To</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Receipt Ref</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500">{formatDate(e.created_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 capitalize font-bold text-slate-900">
                      {getCategoryIcon(e.category)}
                      <span>{e.category.replace("_", " ")}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-800">{e.description}</td>
                  <td className="py-3 px-4 text-slate-600">{e.paid_to}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                        e.payment_method === "cash_drawer"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {e.payment_method.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{e.receipt_ref || "-"}</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-rose-600 text-sm">
                    {formatCurrency(e.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Record Store Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expense Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold capitalize"
                  >
                    <option value="freight_transport">Freight / Transport In</option>
                    <option value="utilities">Utilities (Electric / Water)</option>
                    <option value="rent">Shop Rent</option>
                    <option value="wages">Staff Daily Wages</option>
                    <option value="tea_refreshment">Tea / Refreshments</option>
                    <option value="packaging">Bags & Packaging</option>
                    <option value="maintenance">Shop Repairs / Upkeep</option>
                    <option value="other">Other Overhead</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-base font-black text-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unloading cement bags freight charge"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Paid To (Vendor / Staff)</label>
                  <input
                    type="text"
                    placeholder="e.g. Metro Trucking"
                    value={formData.paid_to}
                    onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Receipt Reference #</label>
                  <input
                    type="text"
                    placeholder="e.g. REC-9921"
                    value={formData.receipt_ref}
                    onChange={(e) => setFormData({ ...formData, receipt_ref: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: "cash_drawer" })}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      formData.payment_method === "cash_drawer"
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Paid from Cash Till
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: "bank" })}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      formData.payment_method === "bank"
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Bank / Card
                  </button>
                </div>
                {formData.payment_method === "cash_drawer" && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    * This amount will be automatically deducted from today's active cash drawer balance.
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Record Expense ({formatCurrency(formData.amount)})
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
