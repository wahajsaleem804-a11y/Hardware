"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  Phone,
  Building,
  Plus,
  X,
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import { Customer, CustomerLedgerEntry } from "@/lib/data/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function ContractorStatementPage() {
  const params = useParams();
  const id = params?.id as string;

  const [contractor, setContractor] = useState<Customer | null>(null);
  const [ledger, setLedger] = useState<CustomerLedgerEntry[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer" | "check">("bank_transfer");

  const loadData = () => {
    const custs = HardwareStoreService.getCustomers();
    const found = custs.find((c) => c.id === id);
    if (found) {
      setContractor(found);
      const entries = HardwareStoreService.getCustomerLedger(found.id);
      setLedger(entries);
      setPaymentAmount(found.current_balance);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!contractor) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Contractor account not found.</p>
        <Link href="/contractors" className="mt-2 text-xs text-amber-600 font-bold hover:underline inline-block">
          ← Back to Contractors
        </Link>
      </div>
    );
  }

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;
    HardwareStoreService.recordCustomerPayment(
      contractor.id,
      paymentAmount,
      paymentMethod,
      `Statement payment via ${paymentMethod}`
    );
    setIsPaymentModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/contractors"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">{contractor.name}</h1>
            <p className="text-xs text-slate-500">Contractor Account Statement & Running Ledger</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Receive Payment</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Current Balance Owed</span>
          <div className="mt-1 text-2xl font-black text-rose-600 font-mono">
            {formatCurrency(contractor.current_balance)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Credit Line Limit</span>
          <div className="mt-1 text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(contractor.credit_limit)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Credit Terms</span>
          <div className="mt-1 text-2xl font-black text-indigo-600">Net {contractor.payment_terms_days} Days</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Contact & Phone</span>
          <div className="mt-1 font-bold text-slate-900 text-sm">{contractor.phone}</div>
          <div className="text-[11px] text-slate-400">{contractor.email}</div>
        </div>
      </div>

      {/* Ledger Statement */}
      <div id="printable-receipt" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Chronological Account Statement</h2>
            <p className="text-xs text-slate-500">Every material purchase and payment received</p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
            {ledger.length} Transactions
          </span>
        </div>

        {ledger.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No transaction entries found for this contractor.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Transaction Type</th>
                  <th className="py-3 px-4">Invoice / Ref #</th>
                  <th className="py-3 px-4">Description / Notes</th>
                  <th className="py-3 px-4 text-right">Debit (+)</th>
                  <th className="py-3 px-4 text-right">Credit (-)</th>
                  <th className="py-3 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {ledger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-500">{formatDate(entry.created_at)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                          entry.transaction_type === "invoice"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {entry.transaction_type === "invoice" ? "Invoice / Material" : "Payment Received"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {entry.invoice_number || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{entry.notes || "-"}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                      {formatCurrency(entry.balance_after)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Receive Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-base font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="bank_transfer">Bank Wire / Electronic Transfer</option>
                  <option value="cash">Cash (Add to Till)</option>
                  <option value="check">Check</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                >
                  Confirm Payment ({formatCurrency(paymentAmount)})
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
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
