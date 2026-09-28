"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  AlertTriangle,
  MapPin,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Layers,
  Image as ImageIcon,
  Upload,
  FolderPlus,
  Check,
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import { Product, Category, UnitOfMeasure, ProductVariant, BulkPriceUpdateOptions } from "@/lib/data/types";
import { VariantSection } from "./VariantSection";
import { formatCurrency, formatQty } from "@/lib/utils";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Variant management state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [bulkMode, setBulkMode] = useState<BulkPriceUpdateOptions["mode"]>('percentage');
  const [bulkValue, setBulkValue] = useState(0);
  const [bulkFields, setBulkFields] = useState<("cost_price" | "retail_price" | "contractor_price")[]>([]);

  // Form fields
  const [formData, setFormData] = useState({
    sku: "",
    barcode: "",
    name: "",
    category_id: "",
    brand: "",
    specifications: "",
    unit_of_measure: "piece" as UnitOfMeasure,
    cost_price: 0,
    retail_price: 0,
    contractor_price: 0,
    current_stock: 0,
    min_reorder_level: 5,
    aisle_bin_location: "",
    image_url: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        HardwareStoreService.getProducts(),
        HardwareStoreService.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error("Inventory load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("filter") === "low") {
        setFilterLowStockOnly(true);
      }
    }
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "all" || p.category_id === selectedCategory;
    const matchesLow = !filterLowStockOnly || Number(p.current_stock) <= Number(p.min_reorder_level);
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.specifications && p.specifications.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.aisle_bin_location && p.aisle_bin_location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesLow && matchesSearch;
  });

  const handleOpenDrawer = (product?: Product) => {
    setShowInlineCat(false);
    if (product) {
      setEditingProduct(product);
      setFormData({
        sku: product.sku,
        barcode: product.barcode || "",
        name: product.name,
        category_id: product.category_id || categories[0]?.id || "",
        brand: product.brand || "",
        specifications: product.specifications || "",
        unit_of_measure: product.unit_of_measure || "piece",
        cost_price: Number(product.cost_price) || 0,
        retail_price: Number(product.retail_price) || 0,
        contractor_price: Number(product.contractor_price) || 0,
        current_stock: Number(product.current_stock) || 0,
        min_reorder_level: Number(product.min_reorder_level) || 5,
        aisle_bin_location: product.aisle_bin_location || "",
        image_url: product.image_url || "",
      });
      // Load existing variants for the product being edited
      const loaded = await HardwareStoreService.getVariants(product.id);
      setVariants(loaded);
    } else {
      setEditingProduct(null);
      setFormData({
        sku: `SKU-${Date.now().toString().slice(-5)}`,
        barcode: "",
        name: "",
        category_id: categories[0]?.id || "",
        brand: "",
        specifications: "",
        unit_of_measure: "piece",
        cost_price: 0,
        retail_price: 0,
        contractor_price: 0,
        current_stock: 0,
        min_reorder_level: 10,
        aisle_bin_location: "Aisle 1, Shelf A",
        image_url: "",
      });
    }
    setIsDrawerOpen(true);
  };

  // Inline Category Creator
  const handleCreateCategoryInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      alert("Category name is required");
      return;
    }
    setIsAddingCat(true);
    try {
      const newCat = await HardwareStoreService.addCategory(newCatName.trim(), newCatDesc.trim());
      if (newCat) {
        setCategories((prev) => [...prev, newCat]);
        setFormData((prev) => ({ ...prev, category_id: newCat.id }));
        setNewCatName("");
        setNewCatDesc("");
        setShowInlineCat(false);
      }
    } catch (err: any) {
      console.error("Add category error:", err);
      alert("Failed to add category: " + (err.message || ""));
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }

    setIsUploadingImage(true);
    try {
      const publicUrl = await HardwareStoreService.uploadProductImage(file, formData.sku);
      if (publicUrl) {
        setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingProduct) {
        await HardwareStoreService.updateProduct(editingProduct.id, {
          sku: formData.sku,
          barcode: formData.barcode,
          name: formData.name,
          category_id: formData.category_id,
          brand: formData.brand,
          specifications: formData.specifications,
          unit_of_measure: formData.unit_of_measure,
          cost_price: Number(formData.cost_price),
          retail_price: Number(formData.retail_price),
          contractor_price: Number(formData.contractor_price),
          current_stock: Number(formData.current_stock),
          min_reorder_level: Number(formData.min_reorder_level),
          aisle_bin_location: formData.aisle_bin_location,
          image_url: formData.image_url,
        });
      } else {
        await HardwareStoreService.addProduct({
          sku: formData.sku,
          barcode: formData.barcode,
          name: formData.name,
          category_id: formData.category_id,
          brand: formData.brand,
          specifications: formData.specifications,
          unit_of_measure: formData.unit_of_measure,
          cost_price: Number(formData.cost_price),
          retail_price: Number(formData.retail_price),
          contractor_price: Number(formData.contractor_price),
          current_stock: Number(formData.current_stock),
          min_reorder_level: Number(formData.min_reorder_level),
          aisle_bin_location: formData.aisle_bin_location,
          image_url: formData.image_url,
          is_active: true,
        });
      }
      setIsDrawerOpen(false);
      await loadData();
    } catch (err: any) {
      console.error("Save product error:", err);
      alert("Error saving product: " + (err.message || ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`Are you sure you want to delete "${p.name}" (${p.sku})?`)) return;
    try {
      await HardwareStoreService.deleteProduct(p.id);
      await loadData();
    } catch (err: any) {
      alert("Delete failed: " + (err.message || ""));
    }
  };

  const lowStockCount = products.filter((p) => Number(p.current_stock) <= Number(p.min_reorder_level)).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory & SKU Catalog</h1>
          <p className="text-sm text-slate-500">
            Real-time timber, sheets, doors & architectural hardware inventory management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-xs"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/inventory/adjustments"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Offcuts & Wastage</span>
          </Link>
          <button
            onClick={() => handleOpenDrawer()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product SKU</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search live SKU, dimensions, brand, bin coordinates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
              filterLowStockOnly
                ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${filterLowStockOnly ? "text-white" : "text-rose-500"}`} />
            <span>Low Stock ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Hardware Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-14">Image</th>
                <th className="py-3.5 px-4">Item Details & Specs</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">UoM</th>
                <th className="py-3.5 px-4">Stock Level</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Cost</th>
                <th className="py-3.5 px-4">Retail</th>
                <th className="py-3.5 px-4">Contractor</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading inventory records...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No products found. Click &quot;Add Product SKU&quot; above to insert a new item.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = Number(p.current_stock) <= Number(p.min_reorder_level);
                  const margin =
                    Number(p.retail_price) > 0
                      ? (((Number(p.retail_price) - Number(p.cost_price)) / Number(p.retail_price)) * 100).toFixed(0)
                      : "0";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative group shrink-0 shadow-xs flex items-center justify-center">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400 stroke-1" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{p.brand || "Alkaram"}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-600 font-semibold">{p.specifications}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                        <div>{p.sku}</div>
                        {p.barcode && <div className="text-[10px] text-slate-400">{p.barcode}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700 uppercase">
                          {p.unit_of_measure}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-xs ${isLow ? "text-rose-600" : "text-slate-900"}`}>
                            {formatQty(Number(p.current_stock), p.unit_of_measure)}
                          </span>
                          {isLow && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded">
                              LOW (&lt;{p.min_reorder_level})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold">{p.aisle_bin_location || "Not assigned"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{formatCurrency(p.cost_price)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div>{formatCurrency(p.retail_price)}</div>
                        <div className="text-[10px] text-emerald-600 font-normal">{margin}% margin</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {formatCurrency(p.contractor_price)}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenDrawer(p)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete SKU"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Slide-over Drawer for Add/Edit SKU (Replaces blocking modal) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop with soft blur */}
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingProduct ? "Edit Product SKU" : "Add New Product SKU"}
                </h3>
                <p className="text-xs text-slate-500">Configure SKU details, pricing & stock thresholds</p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Form */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Product Image & Upload Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>Product Image & Photography</span>
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-xs transition-colors">
                    {isUploadingImage ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingImage}
                      onChange={handleImageFileUpload}
                    />
                  </label>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs relative">
                    {formData.image_url ? (
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400 stroke-1" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-500">Image CDN Link (Supabase Storage):</span>
                      {formData.image_url && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: "" })}
                          className="text-rose-500 hover:text-rose-700 text-[10px] font-bold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="https://...supabase.co/storage/v1/object/public/product-images/..."
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Product Basic Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Solid Teak Planks"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Specifications / Dimensions *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1/2 inch x 4m Class 9"
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Barcode</label>
                  <input
                    type="text"
                    placeholder="Scan barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Durapipe"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Category (With Seamless Inline Creator - No Modal) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Category *</label>
                  <button
                    type="button"
                    onClick={() => setShowInlineCat(!showInlineCat)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>{showInlineCat ? "Cancel" : "+ New Category"}</span>
                  </button>
                </div>

                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Inline Category Creation Box */}
                {showInlineCat && (
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2.5 mt-2">
                    <p className="font-bold text-blue-900 text-xs">Create New Category</p>
                    <input
                      type="text"
                      placeholder="Category Name (e.g. Hardwood Lumber) *"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full p-2 border border-blue-200 rounded-lg bg-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full p-2 border border-blue-200 rounded-lg bg-white text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreateCategoryInline}
                        disabled={isAddingCat}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-xs"
                      >
                        {isAddingCat ? "Adding..." : "Save Category"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInlineCat(false)}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* UoM and Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit of Measure (UoM)</label>
                  <select
                    value={formData.unit_of_measure}
                    onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value as UnitOfMeasure })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold bg-white"
                  >
                    <option value="piece">Piece (each)</option>
                    <option value="meter">Meter (wire / pipe / length)</option>
                    <option value="kg">Kilogram (nails / bulk)</option>
                    <option value="box">Box (screws / packs)</option>
                    <option value="bag">Bag (cement / sand)</option>
                    <option value="liter">Liter (paint / solvents)</option>
                    <option value="roll">Roll (tape / membrane)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Physical Location (Aisle & Bin)</label>
                  <input
                    type="text"
                    placeholder="e.g. Aisle 2, Shelf B, Bin 4"
                    value={formData.aisle_bin_location}
                    onChange={(e) => setFormData({ ...formData, aisle_bin_location: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.retail_price}
                    onChange={(e) => setFormData({ ...formData, retail_price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-indigo-700 block mb-1">Contractor Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.contractor_price}
                    onChange={(e) => setFormData({ ...formData, contractor_price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white font-bold text-indigo-700"
                  />
                </div>
              </div>

              {/* Stock Thresholds */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Current Stock Qty</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Reorder Alert Level</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.min_reorder_level}
                    onChange={(e) => setFormData({ ...formData, min_reorder_level: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Drawer Actions Footer */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 sticky bottom-0 bg-white">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs disabled:opacity-50 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? "Saving SKU..." : editingProduct ? "Update Product SKU" : "Save Product SKU"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
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
