"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  DollarSign,
  UserCheck,
  AlertCircle,
  FileText,
  CreditCard,
  X,
  CheckCircle,
  Phone,
  Mail,
  Building,
  TrendingUp,
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import { Customer } from "@/lib/data/types";
import { formatCurrency } from "@/lib/utils";

export default function ContractorsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Customer | null>(null);

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer" | "check">("cash");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  // New Customer Form
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    customer_type: "contractor" as const,
    credit_limit: 5000,
    payment_terms_days: 30,
  });

  const loadData = async () => {
    const custs = await HardwareStoreService.getCustomers();
    setCustomers(Array.isArray(custs) ? custs : []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const contractorList = customers.filter((c) => c.customer_type === "contractor");
  const totalReceivables = contractorList.reduce((acc, c) => acc + (c.current_balance || 0), 0);
  const totalCreditLimit = contractorList.reduce((acc, c) => acc + (c.credit_limit || 0), 0);

  const openPaymentModal = (c: Customer) => {
    setSelectedContractor(c);
    setPaymentAmount(c.current_balance > 0 ? c.current_balance : 100);
    setPaymentNotes(`Payment for ${c.name} account`);
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractor || paymentAmount <= 0) return;

    HardwareStoreService.recordCustomerPayment(
      selectedContractor.id,
      paymentAmount,
      paymentMethod,
      paymentNotes
    );

    setIsPaymentModalOpen(false);
    loadData();
  };

  const handleAddContractor = (e: React.FormEvent) => {
    e.preventDefault();
    HardwareStoreService.addCustomer({
      ...newCustomer,
      current_balance: 0,
    });
    setIsAddCustomerModalOpen(false);
    setNewCustomer({
      name: "",
      phone: "",
      email: "",
      address: "",
      customer_type: "contractor",
      credit_limit: 5000,
      payment_terms_days: 30,
    });
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Contractor Credit Accounts (AR)</h1>
          <p className="text-sm text-slate-500">
            Control contractor credit lines, track balances ("Udhar / Khata"), record collections, and prevent bad debt.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddCustomerModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Open New Credit Line</span>
          </button>
        </div>
      </div>

      {/* Credit Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Uncollected Debt (AR)</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">{formatCurrency(totalReceivables)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Owed across {contractorList.length} contractor accounts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Approved Credit</span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(totalCreditLimit)}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalCreditLimit > 0 ? ((totalReceivables / totalCreditLimit) * 100).toFixed(0) : 0}% credit line utilized
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Average Payment Term</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">Net 30 Days</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Standard construction industry terms</div>
        </div>
      </div>

      {/* Contractor Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Active Contractor Ledgers</h2>
          <span className="text-xs text-slate-500">{contractorList.length} accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Contractor / Business</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Terms</th>
                <th className="py-3.5 px-4">Credit Limit</th>
                <th className="py-3.5 px-4">Outstanding Balance</th>
                <th className="py-3.5 px-4">Credit Utilization</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {contractorList.map((c) => {
                const percent = Math.min(100, (c.current_balance / (c.credit_limit || 1)) * 100);
                const isOverdue = percent > 80;

                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{c.address}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{c.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Net {c.payment_terms_days}d
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatCurrency(c.credit_limit)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-black text-base text-rose-600">
                      {formatCurrency(c.current_balance)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-32">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-bold">
                          <span>{percent.toFixed(0)}%</span>
                          <span>Left: {formatCurrency(Math.max(0, c.credit_limit - c.current_balance))}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent > 85 ? "bg-rose-500" : percent > 50 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openPaymentModal(c)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-colors shadow-xs"
                      >
                        Receive Payment
                      </button>
                      <Link
                        href={`/contractors/${c.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs inline-block transition-colors"
                      >
                        Statement
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive Payment Modal */}
      {isPaymentModalOpen && selectedContractor && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Record Contractor Payment</h3>
                <p className="text-xs text-slate-500">{selectedContractor.name}</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex justify-between items-center text-amber-950">
              <span>Outstanding Debt:</span>
              <span className="font-black text-sm text-rose-600 font-mono">
                {formatCurrency(selectedContractor.current_balance)}
              </span>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Amount Received ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-base font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      paymentMethod === "cash" ? "bg-slate-900 text-white" : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Cash (Till)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      paymentMethod === "bank_transfer" ? "bg-slate-900 text-white" : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Bank Wire
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("check")}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      paymentMethod === "check" ? "bg-slate-900 text-white" : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Check
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reference / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Wire reference #9921, or Paid at desk"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Record Payment ({formatCurrency(paymentAmount)})
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

      {/* Add Contractor Modal */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Add New Contractor / Account</h3>
              <button onClick={() => setIsAddCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddContractor} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Contractor / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Renovation LLC"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="billing@contractor.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Address / Job Site Location</label>
                <input
                  type="text"
                  placeholder="e.g. 12 Builder St, Sector 9"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Limit ($) *</label>
                  <input
                    type="number"
                    step="100"
                    required
                    value={newCustomer.credit_limit}
                    onChange={(e) => setNewCustomer({ ...newCustomer, credit_limit: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Term (Days) *</label>
                  <select
                    value={newCustomer.payment_terms_days}
                    onChange={(e) => setNewCustomer({ ...newCustomer, payment_terms_days: parseInt(e.target.value) || 30 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value={7}>Net 7 Days</option>
                    <option value={15}>Net 15 Days</option>
                    <option value={30}>Net 30 Days</option>
                    <option value={60}>Net 60 Days</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/10"
                >
                  Create Contractor Account
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(false)}
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
