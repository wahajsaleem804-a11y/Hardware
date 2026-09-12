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
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import { Supplier, Product } from "@/lib/data/types";
import { formatCurrency } from "@/lib/utils";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
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
    setIsAddSupplierModalOpen(false);
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
            onClick={() => setIsAddSupplierModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Supplier</span>
          </button>
        </div>
      </div>

      {/* Payables KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Accounts Payable (AP)</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(totalPayables)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Owed to distributors on credit</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Wholesalers</span>
            <Truck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{suppliers.length} Companies</div>
          <div className="text-[11px] text-slate-500 mt-1">Plumbing, electrical, tools, steel</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Reorders Needed</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">{lowStockProducts.length} Items</div>
          <div className="text-[11px] text-slate-500 mt-1">Items below minimum safety threshold</div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                      onClick={() => {
                        setSelectedSupplier(s);
                        setIsPOModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition-colors shadow-xs"
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

      {/* Add Supplier Modal */}
      {isAddSupplierModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Add New Hardware Supplier</h3>
              <button onClick={() => setIsAddSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Fasteners Supply"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Sales Rep Name"
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
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Terms (Days)</label>
                  <input
                    type="number"
                    value={newSupplier.payment_terms_days}
                    onChange={(e) => setNewSupplier({ ...newSupplier, payment_terms_days: parseInt(e.target.value) || 30 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Opening Payable ($)</label>
                  <input
                    type="number"
                    value={newSupplier.current_payable}
                    onChange={(e) => setNewSupplier({ ...newSupplier, current_payable: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md"
                >
                  Save Supplier
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddSupplierModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Purchase Order Modal */}
      {isPOModalOpen && selectedSupplier && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Generate Purchase Order</h3>
                <p className="text-xs text-slate-500">To: {selectedSupplier.name}</p>
              </div>
              <button onClick={() => setIsPOModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              <span className="font-bold">PO Number:</span> PO-{Date.now().toString().slice(-6)} | Terms: Net {selectedSupplier.payment_terms_days} Days
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Suggested Low-Stock Hardware Items to Restock:</label>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-2">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Current: {p.current_stock} {p.unit_of_measure} (Min: {p.min_reorder_level})
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-amber-600">
                      Cost: {formatCurrency(p.cost_price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  alert(`Purchase Order for ${selectedSupplier.name} generated successfully!`);
                  setIsPOModalOpen(false);
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
              >
                Send PO to Supplier
              </button>
              <button
                type="button"
                onClick={() => setIsPOModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
