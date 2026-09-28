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
  Check,
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import { Product, StockAdjustment, AdjustmentType } from "@/lib/data/types";
import { formatCurrency, formatQty, formatDateTime } from "@/lib/utils";

export default function AdjustmentsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
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
      if (prods[0].variants && prods[0].variants.length > 0) {
        setSelectedVariantId(prods[0].variants[0].id);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedVariant = selectedProduct?.variants?.find((v) => v.id === selectedVariantId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const previousStock = selectedVariant
      ? Number(selectedVariant.current_stock)
      : Number(selectedProduct.current_stock);
    const newStock = Math.max(0, previousStock + quantityChange);
    const costPrice = selectedVariant
      ? Number(selectedVariant.cost_price)
      : Number(selectedProduct.cost_price);
    const costImpact = Math.abs(quantityChange) * costPrice;

    await HardwareStoreService.recordStockAdjustment({
      product_id: selectedProduct.id,
      variant_id: selectedVariant?.id,
      variant_name: selectedVariant?.variant_name,
      product_name: selectedProduct.name,
      sku: selectedVariant?.sku || selectedProduct.sku,
      adjustment_type: adjustmentType,
      quantity_change: quantityChange,
      previous_stock: previousStock,
      new_stock: newStock,
      cost_impact: costImpact,
      reason_notes: notes || `${adjustmentType.replace("_", " ")} recorded`,
      adjusted_by: "Store Manager",
    });

    setShowForm(false);
    setNotes("");
    setQuantityChange(-1);
    await loadData();
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
              ← Back to Inventory
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock Adjustments & Wastage</h1>
          <p className="text-sm text-slate-500">
            Record timber cutting offcuts, broken items, shrinkage, and physical count audits.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            showForm
              ? "bg-slate-200 text-slate-800"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? "Close Form" : "Record New Adjustment"}</span>
        </button>
      </div>

      {/* INLINE ACTION PANEL: Record Stock Adjustment (No full-screen modal) */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-blue-200/80 shadow-md p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">Record Stock Adjustment</h3>
              <p className="text-xs text-slate-500">Audit stock variances, wood offcuts, or damage write-offs</p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Hardware Product *</label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedProductId(newId);
                  const prod = products.find((p) => p.id === newId);
                  setSelectedVariantId(prod?.variants?.[0]?.id || "");
                }}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-medium bg-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) - Current: {p.current_stock} {p.unit_of_measure}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Product Variant / Dimension *</label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full p-2.5 border border-blue-200 bg-blue-50/20 rounded-xl font-bold text-xs text-blue-950"
                >
                  {selectedProduct.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.variant_name} ({v.sku}) — In Stock: {formatQty(Number(v.current_stock), v.unit_of_measure || selectedProduct.unit_of_measure)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Type *</label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as AdjustmentType)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold bg-white"
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
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Current Stock Level:</span>
                  <span className="font-bold font-mono">
                    {selectedVariant ? selectedVariant.current_stock : selectedProduct.current_stock}{" "}
                    {selectedVariant?.unit_of_measure || selectedProduct.unit_of_measure}
                    {selectedVariant && ` (${selectedVariant.variant_name})`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>New Stock After Adjustment:</span>
                  <span className="font-black font-mono text-slate-900">
                    {Math.max(
                      0,
                      (selectedVariant ? Number(selectedVariant.current_stock) : Number(selectedProduct.current_stock)) +
                        quantityChange
                    )}{" "}
                    {selectedVariant?.unit_of_measure || selectedProduct.unit_of_measure}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600 pt-1 border-t border-slate-200">
                  <span>Estimated Cost Impact:</span>
                  <span className="font-black font-mono">
                    {formatCurrency(
                      Math.abs(quantityChange) *
                        (selectedVariant ? Number(selectedVariant.cost_price) : Number(selectedProduct.cost_price))
                    )}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">Reason Notes / Customer Reference</label>
              <input
                type="text"
                placeholder="e.g. Cut 3m piece for customer, remaining 1m discarded as unusable"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Adjustment</span>
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Cutting Scrap & Waste</span>
            <Scissors className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {adjustments.filter((a) => a.adjustment_type === "cutting_waste").length} logs
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Timber, veneer, sheet offcuts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Damage & Breakage</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {adjustments.filter((a) => a.adjustment_type === "damage").length} items
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Defects & broken stock</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Loss Value</span>
            <span className="text-xs font-bold text-rose-600">COGS Impact</span>
          </div>
          <div className="mt-2 text-xl font-black text-rose-600">{formatCurrency(totalCostLoss)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Written off to accounting</div>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Stock Adjustment History</h2>
          <span className="text-xs text-slate-500">{adjustments.length} logged records</span>
        </div>

        {adjustments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Layers className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="text-sm font-semibold text-slate-600">No Adjustments Recorded Yet</p>
            <p className="text-xs text-slate-400">
              Click &quot;Record New Adjustment&quot; when trimming timber, writing off damaged stock, or performing cycle counts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Hardware SKU & Name</th>
                  <th className="py-3 px-4">Adjustment Reason</th>
                  <th className="py-3 px-4 text-center">Previous Qty</th>
                  <th className="py-3 px-4 text-center">Adjustment</th>
                  <th className="py-3 px-4 text-center">New Qty</th>
                  <th className="py-3 px-4 text-right">Cost Impact</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {adjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-500">{formatDateTime(a.created_at)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{a.product_name}</span>
                        {a.variant_name && (
                          <span className="px-1.5 py-0.2 rounded font-bold text-[9px] bg-blue-50 text-blue-700 border border-blue-200">
                            {a.variant_name}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">{a.sku}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                          a.adjustment_type === "cutting_waste"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : a.adjustment_type === "damage" || a.adjustment_type === "theft_shrinkage"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {a.adjustment_type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{a.previous_stock}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={a.quantity_change < 0 ? "text-rose-600" : "text-emerald-600"}>
                        {a.quantity_change > 0 ? `+${a.quantity_change}` : a.quantity_change}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-slate-900">{a.new_stock}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      -{formatCurrency(a.cost_impact)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">{a.reason_notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
