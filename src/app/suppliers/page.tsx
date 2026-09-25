"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  Plus,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  X,
  CheckCircle,
  FileText,
  AlertTriangle,
  Check,
  Send,
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import { Supplier, Product } from "@/lib/data/types";
import { formatCurrency } from "@/lib/utils";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [activePanel, setActivePanel] = useState<"none" | "new_supplier" | "po">("none");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Supplier Form
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    payment_terms_days: 30,
    current_payable: 0,
  });

  const loadData = async () => {
    const sups = await HardwareStoreService.getSuppliers();
    const prods = await HardwareStoreService.getProducts();
    setSuppliers(Array.isArray(sups) ? sups : []);
    setLowStockProducts(Array.isArray(prods) ? prods.filter((p) => p.current_stock <= p.min_reorder_level) : []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPayables = suppliers.reduce((acc, s) => acc + (s.current_payable || 0), 0);

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = [
      ...suppliers,
      {
        ...newSupplier,
        id: `sup-${Date.now()}`,
      },
    ];
    setSuppliers(updated);
    setActivePanel("none");
    setNewSupplier({
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      payment_terms_days: 30,
      current_payable: 0,
    });
  };

  const openPOPanel = (s: Supplier) => {
    setSelectedSupplier(s);
    setActivePanel("po");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Suppliers & Wholesalers (AP)</h1>
          <p className="text-sm text-slate-500">
            Track material distributors, purchase orders, credit payment terms, and accounts payable.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePanel(activePanel === "new_supplier" ? "none" : "new_supplier")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activePanel === "new_supplier"
                ? "bg-slate-200 text-slate-800"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{activePanel === "new_supplier" ? "Close Form" : "Add New Supplier"}</span>
          </button>
        </div>
      </div>

      {/* INLINE ACTION PANEL: Add Supplier (No full-screen modal) */}
      {activePanel === "new_supplier" && (
        <div className="bg-white rounded-2xl border border-blue-200/80 shadow-md p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">Add New Hardware Supplier</h3>
              <p className="text-xs text-slate-500">Register a material wholesaler, timber mill, or distributor</p>
            </div>
            <button
              onClick={() => setActivePanel("none")}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddSupplier} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Company / Supplier Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Fasteners & Timber Supply"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="Sales Representative Name"
                  value={newSupplier.contact_person}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                placeholder="orders@supplier.com"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Warehouse Address</label>
              <input
                type="text"
                placeholder="e.g. 50 Logistics Blvd, Industrial Zone"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Credit Terms (Days)</label>
                <input
                  type="number"
                  value={newSupplier.payment_terms_days}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, payment_terms_days: parseInt(e.target.value) || 30 })
                  }
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Opening Payable ($)</label>
                <input
                  type="number"
                  value={newSupplier.current_payable}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, current_payable: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20"
              >
                Save Supplier
              </button>
              <button
                type="button"
                onClick={() => setActivePanel("none")}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* INLINE ACTION PANEL: Create Purchase Order (No full-screen modal) */}
      {activePanel === "po" && selectedSupplier && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-md p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">Generate Purchase Order</h3>
              <p className="text-xs text-slate-500">Distributor: <span className="font-bold text-slate-800">{selectedSupplier.name}</span></p>
            </div>
            <button
              onClick={() => setActivePanel("none")}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex justify-between items-center">
            <span><span className="font-bold">PO Ref:</span> PO-{Date.now().toString().slice(-6)}</span>
            <span className="font-semibold text-slate-700">Payment Terms: Net {selectedSupplier.payment_terms_days} Days</span>
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-bold text-slate-700 block">Suggested Low-Stock Hardware Items to Restock:</label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-2 bg-slate-50/40">
              {lowStockProducts.length === 0 ? (
                <div className="p-4 text-center text-slate-400">All inventory items are currently above safe threshold levels.</div>
              ) : (
                lowStockProducts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between px-2">
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Current: {p.current_stock} {p.unit_of_measure} (Min: {p.min_reorder_level})
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-slate-900">
                      Cost: {formatCurrency(p.cost_price)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                alert(`Purchase Order for ${selectedSupplier.name} generated successfully!`);
                setActivePanel("none");
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send PO to Supplier</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("none")}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Payables KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Accounts Payable (AP)</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(totalPayables)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Owed to distributors on credit</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Wholesalers</span>
            <Truck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{suppliers.length} Companies</div>
          <div className="text-[11px] text-slate-500 mt-1">Plumbing, electrical, tools, steel</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Reorders Needed</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">{lowStockProducts.length} Items</div>
          <div className="text-[11px] text-slate-500 mt-1">Items below minimum safety threshold</div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Registered Hardware Vendors</h2>
          <span className="text-xs text-slate-500">{suppliers.length} vendors</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Supplier Name</th>
                <th className="py-3.5 px-4">Contact Representative</th>
                <th className="py-3.5 px-4">Phone / Email</th>
                <th className="py-3.5 px-4">Credit Terms</th>
                <th className="py-3.5 px-4 font-mono">Current Payables Owed</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{s.address}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{s.contact_person}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{s.phone}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{s.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700">
                      Net {s.payment_terms_days} Days
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-black text-sm text-slate-900">
                    {formatCurrency(s.current_payable)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openPOPanel(s)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs transition-colors shadow-xs"
                    >
                      Create PO
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
