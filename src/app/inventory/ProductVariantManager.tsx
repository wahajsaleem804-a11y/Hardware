"use client";

import React, { useState } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Sparkles,
  Sliders,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Hash,
} from "lucide-react";
import { ProductVariant, UnitOfMeasure } from "@/lib/data/types";

interface ProductVariantManagerProps {
  variants: ProductVariant[];
  setVariants: React.Dispatch<React.SetStateAction<ProductVariant[]>>;
  baseSku: string;
  baseCostPrice: number;
  baseRetailPrice: number;
  baseContractorPrice: number;
  unitOfMeasure: UnitOfMeasure;
  baseLocation?: string;
}

export const ProductVariantManager: React.FC<ProductVariantManagerProps> = ({
  variants,
  setVariants,
  baseSku,
  baseCostPrice,
  baseRetailPrice,
  baseContractorPrice,
  unitOfMeasure,
  baseLocation,
}) => {
  const [showBulkTool, setShowBulkTool] = useState(false);
  const [bulkMode, setBulkMode] = useState<"percentage" | "fixed_add" | "fixed_set" | "margin_over_cost">("percentage");
  const [bulkValue, setBulkValue] = useState<number>(10);
  const [bulkFields, setBulkFields] = useState<("retail_price" | "contractor_price" | "cost_price")[]>([
    "retail_price",
    "contractor_price",
  ]);

  const [customPresetInput, setCustomPresetInput] = useState("");
  const [showCustomPreset, setShowCustomPreset] = useState(false);

  // Clean SKU helper: cleans special characters for SKU safety
  const formatVariantSku = (parentSku: string, name: string) => {
    const cleanName = name
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toUpperCase();
    return `${parentSku || "SKU"}-${cleanName || "VAR"}`;
  };

  const handleAddSingleVariant = () => {
    const nextIdx = variants.length + 1;
    const defaultName = `Variant ${nextIdx}`;
    const generatedSku = formatVariantSku(baseSku, defaultName);

    const newVariant: ProductVariant = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      product_id: "",
      variant_name: "",
      sku: generatedSku,
      barcode: "",
      cost_price: Number(baseCostPrice) || 0,
      retail_price: Number(baseRetailPrice) || 0,
      contractor_price: Number(baseContractorPrice) || 0,
      current_stock: 0,
      min_reorder_level: 5,
      aisle_bin_location: baseLocation || "",
      unit_of_measure: unitOfMeasure || "piece",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setVariants((prev) => [...prev, newVariant]);
  };

  const handleApplyPreset = (options: string[]) => {
    const existingNames = new Set(variants.map((v) => v.variant_name.trim().toLowerCase()));
    const toAdd = options.filter((opt) => !existingNames.has(opt.trim().toLowerCase()));

    if (toAdd.length === 0) {
      alert("All preset variants already exist in the list.");
      return;
    }

    const newItems: ProductVariant[] = toAdd.map((optName) => {
      const generatedSku = formatVariantSku(baseSku, optName);
      return {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        product_id: "",
        variant_name: optName,
        sku: generatedSku,
        barcode: "",
        cost_price: Number(baseCostPrice) || 0,
        retail_price: Number(baseRetailPrice) || 0,
        contractor_price: Number(baseContractorPrice) || 0,
        current_stock: 0,
        min_reorder_level: 5,
        aisle_bin_location: baseLocation || "",
        unit_of_measure: unitOfMeasure || "piece",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    setVariants((prev) => [...prev, ...newItems]);
    setShowCustomPreset(false);
    setCustomPresetInput("");
  };

  const handleCustomPresetGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPresetInput.trim()) return;
    const splitOptions = customPresetInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    handleApplyPreset(splitOptions);
  };

  const handleUpdateField = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [field]: value };

        // If variant name changes and SKU was auto-generated, keep SKU sync'd if user hasn't overridden
        if (field === "variant_name" && (!item.sku || item.sku.startsWith(baseSku))) {
          updated.sku = formatVariantSku(baseSku, value);
        }
        return updated;
      })
    );
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRegenerateAllSkus = () => {
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        sku: formatVariantSku(baseSku, v.variant_name || "VAR"),
      }))
    );
  };

  const toggleBulkField = (field: "retail_price" | "contractor_price" | "cost_price") => {
    setBulkFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleApplyBulkPricing = () => {
    if (bulkFields.length === 0) {
      alert("Please select at least one target price field.");
      return;
    }

    setVariants((prev) =>
      prev.map((v) => {
        const updated = { ...v };
        for (const field of bulkFields) {
          const currentVal = Number(v[field]) || 0;
          let newVal = currentVal;

          if (bulkMode === "percentage") {
            newVal = Math.round(currentVal * (1 + bulkValue / 100) * 100) / 100;
          } else if (bulkMode === "fixed_add") {
            newVal = Math.max(0, Math.round((currentVal + bulkValue) * 100) / 100);
          } else if (bulkMode === "fixed_set") {
            newVal = Math.max(0, Math.round(bulkValue * 100) / 100);
          } else if (bulkMode === "margin_over_cost") {
            const cost = Number(v.cost_price) || 0;
            newVal = Math.round(cost * (1 + bulkValue / 100) * 100) / 100;
          }

          updated[field] = newVal;
        }
        return updated;
      })
    );

    setShowBulkTool(false);
  };

  const totalAggregatedStock = variants.reduce((sum, v) => sum + (Number(v.current_stock) || 0), 0);

  return (
    <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Product Variants Studio</h4>
              {variants.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] border border-blue-200">
                  {variants.length} {variants.length === 1 ? "Variant" : "Variants"} Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Manage multi-size thicknesses, lengths, gauges and their individual pricing
            </p>
          </div>
        </div>

        {variants.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBulkTool(!showBulkTool)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Bulk Pricing</span>
              {showBulkTool ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
            </button>
            <button
              type="button"
              onClick={handleRegenerateAllSkus}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
              title="Auto-format all variant SKUs based on base SKU"
            >
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              <span>Sync SKUs</span>
            </button>
          </div>
        )}
      </div>

      {/* Bulk Price Adjuster Drawer / Popover */}
      {showBulkTool && variants.length > 0 && (
        <div className="p-4 bg-white border border-blue-200 rounded-xl shadow-xs space-y-3 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
              <span>Bulk Price Update for All Variants</span>
            </span>
            <button
              type="button"
              onClick={() => setShowBulkTool(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center text-xs">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Adjustment Mode</label>
              <select
                value={bulkMode}
                onChange={(e) => setBulkMode(e.target.value as any)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium"
              >
                <option value="percentage">Percentage (+/- %)</option>
                <option value="fixed_add">Add/Deduct Fixed</option>
                <option value="fixed_set">Set Exact Fixed Price</option>
                <option value="margin_over_cost">Margin % Over Cost</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                {bulkMode === "percentage" || bulkMode === "margin_over_cost" ? "Rate (%)" : "Amount"}
              </label>
              <input
                type="number"
                step="any"
                value={bulkValue}
                onChange={(e) => setBulkValue(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleApplyBulkPricing}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
              >
                Apply to All
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-medium text-slate-500">Apply update to:</span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold text-[11px]">
              <input
                type="checkbox"
                checked={bulkFields.includes("retail_price")}
                onChange={() => toggleBulkField("retail_price")}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Retail Price</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-indigo-700 font-semibold text-[11px]">
              <input
                type="checkbox"
                checked={bulkFields.includes("contractor_price")}
                onChange={() => toggleBulkField("contractor_price")}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Contractor Wholesale</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600 font-semibold text-[11px]">
              <input
                type="checkbox"
                checked={bulkFields.includes("cost_price")}
                onChange={() => toggleBulkField("cost_price")}
                className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
              />
              <span>Cost Price</span>
            </label>
          </div>
        </div>
      )}

      {/* Quick Preset Generator Toolbar */}
      <div className="p-3 bg-white border border-slate-200/90 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>1-Click Hardware Size Generators:</span>
          </span>
          <button
            type="button"
            onClick={() => setShowCustomPreset(!showCustomPreset)}
            className="text-blue-600 hover:text-blue-700 font-bold"
          >
            {showCustomPreset ? "Hide custom" : "+ Custom Comma-Separated"}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleApplyPreset(["3mm", "4mm", "6mm", "8mm", "12mm", "18mm"])}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-[10px] font-semibold transition-all"
          >
            Thicknesses (3mm, 6mm, 12mm, 18mm)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(["1/2 inch", "3/4 inch", "1 inch", "1.5 inch", "2 inch"])}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-[10px] font-semibold transition-all"
          >
            Pipes / Fittings (1/2&quot;, 3/4&quot;, 1&quot;, 2&quot;)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(["8 ft", "10 ft", "12 ft", "14 ft"])}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-[10px] font-semibold transition-all"
          >
            Timber Lengths (8ft, 10ft, 12ft)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(["Matt Black", "Satin Nickel", "Antique Brass", "SS 304"])}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-[10px] font-semibold transition-all"
          >
            Finishes (Black, Nickel, Brass)
          </button>
        </div>

        {showCustomPreset && (
          <form onSubmit={handleCustomPresetGenerate} className="flex gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              placeholder="e.g. 25x50mm, 38x75mm, 50x100mm (comma separated)"
              value={customPresetInput}
              onChange={(e) => setCustomPresetInput(e.target.value)}
              className="flex-1 p-2 border border-slate-200 rounded-lg bg-slate-50 text-xs"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-xs"
            >
              Generate
            </button>
          </form>
        )}
      </div>

      {/* Empty State when no variants exist */}
      {variants.length === 0 ? (
        <div className="py-8 px-4 bg-white rounded-xl border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-5 h-5 stroke-1" />
          </div>
          <div>
            <h5 className="font-bold text-slate-800 text-xs">No Variants Configured</h5>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
              This product will be saved as a simple single-SKU item. Use the quick presets above or click below to configure multiple sizes or thicknesses.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddSingleVariant}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Variant</span>
          </button>
        </div>
      ) : (
        /* Responsive Table Container (optimized for laptop & desktop viewports) */
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[140px]">Variant Spec / Size *</th>
                    <th className="py-2.5 px-2.5 min-w-[130px]">Variant SKU *</th>
                    <th className="py-2.5 px-2 min-w-[95px]">Barcode</th>
                    <th className="py-2.5 px-2 min-w-[85px]">Cost</th>
                    <th className="py-2.5 px-2 min-w-[95px]">Retail Price</th>
                    <th className="py-2.5 px-2 min-w-[100px]">Contractor</th>
                    <th className="py-2.5 px-2 min-w-[80px]">Stock</th>
                    <th className="py-2.5 px-2 min-w-[70px]">Alert</th>
                    <th className="py-2.5 px-2 text-right w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-[11px]">
                  {variants.map((v, idx) => {
                    const margin =
                      Number(v.retail_price) > 0
                        ? (((Number(v.retail_price) - Number(v.cost_price)) / Number(v.retail_price)) * 100).toFixed(0)
                        : "0";

                    return (
                      <tr key={v.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        {/* Variant Name */}
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            placeholder="e.g. 12mm Standard"
                            value={v.variant_name}
                            onChange={(e) => handleUpdateField(idx, "variant_name", e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded-md font-bold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* SKU */}
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={v.sku}
                            onChange={(e) => handleUpdateField(idx, "sku", e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded-md font-mono text-[10px] font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Barcode */}
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Barcode"
                            value={v.barcode || ""}
                            onChange={(e) => handleUpdateField(idx, "barcode", e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded-md font-mono text-[10px] text-slate-500"
                          />
                        </td>

                        {/* Cost */}
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            value={v.cost_price}
                            onChange={(e) => handleUpdateField(idx, "cost_price", parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 border border-slate-200 rounded-md font-mono text-xs text-slate-600"
                          />
                        </td>

                        {/* Retail */}
                        <td className="p-2">
                          <div>
                            <input
                              type="number"
                              step="0.01"
                              value={v.retail_price}
                              onChange={(e) => handleUpdateField(idx, "retail_price", parseFloat(e.target.value) || 0)}
                              className="w-full p-1.5 border border-slate-200 rounded-md font-mono font-bold text-xs text-slate-900"
                            />
                            <span className="text-[9px] text-emerald-600 block text-right mt-0.5 font-normal">
                              {margin}% margin
                            </span>
                          </div>
                        </td>

                        {/* Contractor Wholesale */}
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            value={v.contractor_price}
                            onChange={(e) => handleUpdateField(idx, "contractor_price", parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 border border-blue-200 bg-blue-50/30 rounded-md font-mono font-bold text-xs text-indigo-700"
                          />
                        </td>

                        {/* Stock */}
                        <td className="p-2">
                          <input
                            type="number"
                            step="any"
                            value={v.current_stock}
                            onChange={(e) => handleUpdateField(idx, "current_stock", parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 border border-slate-200 rounded-md font-mono font-bold text-xs text-slate-900"
                          />
                        </td>

                        {/* Min Alert Level */}
                        <td className="p-2">
                          <input
                            type="number"
                            step="any"
                            value={v.min_reorder_level}
                            onChange={(e) => handleUpdateField(idx, "min_reorder_level", parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 border border-slate-200 rounded-md font-mono text-xs text-slate-500"
                          />
                        </td>

                        {/* Actions */}
                        <td className="p-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Variant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Table Toolbar */}
            <div className="p-3 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={handleAddSingleVariant}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-xs shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Add Row</span>
              </button>

              <div className="text-[11px] text-slate-500 flex items-center gap-3">
                <span>
                  Total Combined Stock: <strong className="text-slate-900">{totalAggregatedStock} {unitOfMeasure}</strong>
                </span>
                <span>•</span>
                <span className="text-blue-700 font-semibold">
                  Saved automatically with product
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
