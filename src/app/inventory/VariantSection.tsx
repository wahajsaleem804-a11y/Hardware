// VariantSection.tsx – component for managing product variants
import React from "react";
import { ProductVariant, BulkPriceUpdateOptions } from "@/lib/data/types";
import { HardwareStoreService } from "@/lib/data/store";
import { Check } from "lucide-react";

type VariantSectionProps = {
  productId: string | null;
  variants: ProductVariant[];
  setVariants: React.Dispatch<React.SetStateAction<ProductVariant[]>>;
  bulkMode: BulkPriceUpdateOptions["mode"];
  setBulkMode: React.Dispatch<React.SetStateAction<BulkPriceUpdateOptions["mode"]>>;
  bulkValue: number;
  setBulkValue: React.Dispatch<React.SetStateAction<number>>;
  bulkFields: ("cost_price" | "retail_price" | "contractor_price")[];
  setBulkFields: React.Dispatch<React.SetStateAction<("cost_price" | "retail_price" | "contractor_price")[]>>;
  refresh: () => void; // callback to reload product list after changes
};

export const VariantSection: React.FC<VariantSectionProps> = ({
  productId,
  variants,
  setVariants,
  bulkMode,
  setBulkMode,
  bulkValue,
  setBulkValue,
  bulkFields,
  setBulkFields,
  refresh,
}) => {
  const toggleBulkField = (field: "cost_price" | "retail_price" | "contractor_price") => {
    setBulkFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: "temp-" + Date.now(), // temporary id for UI; real id will be set after insert
        product_id: productId || "",
        variant_name: "",
        sku: "",
        barcode: "",
        cost_price: 0,
        retail_price: 0,
        contractor_price: 0,
        current_stock: 0,
        min_reorder_level: 0,
        aisle_bin_location: "",
        unit_of_measure: "piece",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  };

  const handleSaveVariants = async () => {
    if (!productId) return;
    for (const v of variants) {
      if (v.id?.startsWith("temp-")) {
        // new variant – create via service
        const added = await HardwareStoreService.addVariant({
          ...v,
          product_id: productId,
        });
        if (!added) {
          // If service returned null, skip updating this variant
          continue;
        }
        const id = added.id;
        // replace temporary id with real one
        setVariants((prev) =>
          prev.map((varItem) => (varItem.id === v.id ? { ...varItem, id } : varItem))
        );
      } else {
        // existing – update
        await HardwareStoreService.updateVariant(v.id, {
          variant_name: v.variant_name,
          sku: v.sku,
          barcode: v.barcode,
          cost_price: v.cost_price,
          retail_price: v.retail_price,
          contractor_price: v.contractor_price,
          current_stock: v.current_stock,
          min_reorder_level: v.min_reorder_level,
          aisle_bin_location: v.aisle_bin_location,
          unit_of_measure: v.unit_of_measure,
          is_active: v.is_active,
        });
      }
    }
    refresh();
  };

  const handleBulkUpdate = async () => {
    if (!productId) return;
    const options: BulkPriceUpdateOptions = {
      mode: bulkMode,
      targetFields: bulkFields,
      value: bulkValue,
    };
    await HardwareStoreService.bulkUpdateProductVariantPrices(productId, options);
    // reload variants to reflect new prices
    const updated = await HardwareStoreService.getVariants(productId);
    setVariants(updated);
    refresh();
  };

  return (
    <div className="mt-4">
      <h3 className="font-bold text-sm text-slate-800 mb-2">Product Variants</h3>
      {variants.map((variant, idx) => (
        <div key={variant.id || idx} className="grid grid-cols-4 gap-2 mb-2 items-end">
          <input
            type="text"
            placeholder="Variant Name"
            value={variant.variant_name}
            onChange={(e) => {
              const newVar = { ...variant, variant_name: e.target.value };
              setVariants((prev) => prev.map((v, i) => (i === idx ? newVar : v)));
            }}
            className="col-span-1 p-1 border border-slate-200 rounded"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Cost"
            value={variant.cost_price}
            onChange={(e) => {
              const newVar = { ...variant, cost_price: parseFloat(e.target.value) || 0 };
              setVariants((prev) => prev.map((v, i) => (i === idx ? newVar : v)));
            }}
            className="col-span-1 p-1 border border-slate-200 rounded"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Retail"
            value={variant.retail_price}
            onChange={(e) => {
              const newVar = { ...variant, retail_price: parseFloat(e.target.value) || 0 };
              setVariants((prev) => prev.map((v, i) => (i === idx ? newVar : v)));
            }}
            className="col-span-1 p-1 border border-slate-200 rounded"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Stock"
            value={variant.current_stock}
            onChange={(e) => {
              const newVar = { ...variant, current_stock: parseFloat(e.target.value) || 0 };
              setVariants((prev) => prev.map((v, i) => (i === idx ? newVar : v)));
            }}
            className="col-span-1 p-1 border border-slate-200 rounded"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={handleAddVariant}
        className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded"
      >
        + Add Variant
      </button>

      {/* Bulk Price Update */}
      <div className="mt-4 p-3 bg-slate-100 rounded">
        <h4 className="font-semibold text-xs mb-1">Bulk Price Update</h4>
        <div className="grid grid-cols-5 gap-2 items-center mb-2">
          <select
            value={bulkMode}
            onChange={(e) => setBulkMode(e.target.value as any)}
            className="col-span-2 p-1 border border-slate-200 rounded text-xs"
          >
            <option value="percentage">% Change</option>
            <option value="fixed_add">Add Fixed</option>
            <option value="fixed_set">Set Fixed</option>
            <option value="margin_over_cost">Margin % over Cost</option>
          </select>
          <input
            type="number"
            placeholder="Value"
            value={bulkValue}
            onChange={(e) => setBulkValue(parseFloat(e.target.value) || 0)}
            className="col-span-1 p-1 border border-slate-200 rounded text-xs"
          />
          <div className="col-span-2 flex items-center gap-1">
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={bulkFields.includes("cost_price")}
                onChange={() => toggleBulkField("cost_price")}
              />
              Cost
            </label>
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={bulkFields.includes("retail_price")}
                onChange={() => toggleBulkField("retail_price")}
              />
              Retail
            </label>
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={bulkFields.includes("contractor_price")}
                onChange={() => toggleBulkField("contractor_price")}
              />
              Contractor
            </label>
          </div>
        </div>
        <button
          type="button"
          onClick={handleBulkUpdate}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded"
        >
          Apply Bulk Update
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleSaveVariants}
          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded"
        >
          Save Variants
        </button>
      </div>
    </div>
  );
};
