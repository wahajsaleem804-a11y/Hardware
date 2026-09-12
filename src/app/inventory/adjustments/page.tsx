"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  AlertTriangle,
  Scissors,
  CheckCircle,
  X,
  History,
  Trash,
  Package,
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import { Product, StockAdjustment, AdjustmentType } from "@/lib/data/types";
import { formatCurrency, formatQty, formatDateTime } from "@/lib/utils";

export default function AdjustmentsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [selectedProductId, setSelectedProductId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("cutting_waste");
  const [quantityChange, setQuantityChange] = useState<number>(-1);
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    const prods = await HardwareStoreService.getProducts();
    const adjs = await HardwareStoreService.getStockAdjustments();
    setProducts(Array.isArray(prods) ? prods : []);
    setAdjustments(Array.isArray(adjs) ? adjs : []);
    if (prods && prods.length > 0 && !selectedProductId) {
      setSelectedProductId(prods[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const previousStock = selectedProduct.current_stock;
    const newStock = Math.max(0, previousStock + quantityChange);
    const costImpact = Math.abs(quantityChange) * selectedProduct.cost_price;

    HardwareStoreService.recordStockAdjustment({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      sku: selectedProduct.sku,
      adjustment_type: adjustmentType,
      quantity_change: quantityChange,
      previous_stock: previousStock,
      new_stock: newStock,
      cost_impact: costImpact,
      reason_notes: notes || `${adjustmentType.replace("_", " ")} recorded`,
      adjusted_by: "Store Manager",
    });

    setIsModalOpen(false);
    setNotes("");
    setQuantityChange(-1);
    loadData();
  };

  const totalCostLoss = adjustments
    .filter((a) => a.quantity_change < 0)
    .reduce((acc, a) => acc + a.cost_impact, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/inventory" className="text-xs text-slate-500 hover:text-slate-800">
              ← Inventory
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock Adjustments & Wastage</h1>
          <p className="text-sm text-slate-500">
            Record pipe/wire cutting offcuts, broken or damaged items, shrinkage, and physical count audits.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/10 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Adjustment</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Cutting Scrap & Waste</span>
            <Scissors className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {adjustments.filter((a) => a.adjustment_type === "cutting_waste").length} logs
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Wire, pipe, hose offcuts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Damage & Breakage</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {adjustments.filter((a) => a.adjustment_type === "damage").length} items
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Defects & broken tools</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Loss Value</span>
            <span className="text-xs font-bold text-rose-600">COGS Impact</span>
          </div>
          <div className="mt-2 text-xl font-black text-rose-600">{formatCurrency(totalCostLoss)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Written off to accounting</div>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Stock Adjustment History</h2>
          <span className="text-xs text-slate-500">{adjustments.length} logged records</span>
        </div>

        {adjustments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Layers className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="text-sm font-semibold text-slate-600">No Adjustments Recorded Yet</p>
            <p className="text-xs text-slate-400">
              Click "Record New Adjustment" when trimming pipes, writing off damaged stock, or performing cycle counts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Adjustment Type</th>
                  <th className="py-3 px-4">Qty Change</th>
                  <th className="py-3 px-4">Stock Before → After</th>
                  <th className="py-3 px-4">Cost Loss</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-500">{formatDateTime(adj.created_at)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{adj.product_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {adj.adjustment_type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold font-mono">
                      <span className={adj.quantity_change < 0 ? "text-rose-600" : "text-emerald-600"}>
                        {adj.quantity_change > 0 ? `+${adj.quantity_change}` : adj.quantity_change}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {adj.previous_stock} → <span className="font-bold text-slate-900">{adj.new_stock}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {formatCurrency(adj.cost_impact)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                      {adj.reason_notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Record Stock Adjustment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Hardware Product *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Current: {p.current_stock} {p.unit_of_measure}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reason / Type *</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as AdjustmentType)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="cutting_waste">Cutting Offcuts / Wastage</option>
                    <option value="damage">Broken / Damaged in Store</option>
                    <option value="theft_shrinkage">Theft / Shrinkage</option>
                    <option value="cycle_count">Inventory Audit Correction</option>
                    <option value="return_restock">Customer Return Restock</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Qty Change (Negative for Loss) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={quantityChange}
                    onChange={(e) => setQuantityChange(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              {selectedProduct && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500">Unit Cost:</span>{" "}
                    <span className="font-bold">{formatCurrency(selectedProduct.cost_price)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Estimated Financial Loss:</span>{" "}
                    <span className="font-bold text-rose-600 font-mono">
                      {formatCurrency(Math.abs(quantityChange) * selectedProduct.cost_price)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Scrapped 1.5m offcut at spool end; customer bought custom length."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/10"
                >
                  Save Stock Adjustment
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
