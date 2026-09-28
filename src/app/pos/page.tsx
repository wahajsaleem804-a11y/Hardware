"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Check,
  User,
  CreditCard,
  Banknote,
  Send,
  Printer,
  X,
  AlertCircle,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Package,
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import { Product, Customer, Category, SaleItem, ProductVariant } from "@/lib/data/types";
import { formatCurrency, formatQty } from "@/lib/utils";
import AlkaramLogo from "@/components/brand/AlkaramLogo";

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Cart State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "credit" | "bank_transfer">("cash");

  // Variant Selection Modal State
  const [selectedProductForVariantPicker, setSelectedProductForVariantPicker] = useState<Product | null>(null);

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [completedInvoice, setCompletedInvoice] = useState<any>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats, custs] = await Promise.all([
        HardwareStoreService.getProducts(),
        HardwareStoreService.getCategories(),
        HardwareStoreService.getCustomers(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setCustomers(custs);

      // Default to Walk-in customer or first customer
      const walkin = custs.find((c) => c.customer_type === "retail") || custs[0];
      setSelectedCustomer(walkin || null);
    } catch (err) {
      console.error("POS load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isContractor = selectedCustomer?.customer_type === "contractor";

  // Filter products (searches parent name, spec, barcode, SKU AND variant names/SKUs/barcodes)
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesVariant = p.variants?.some(
      (v) =>
        v.variant_name.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        (v.barcode && v.barcode.toLowerCase().includes(q))
    );

    const matchesSearch =
      q === "" ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.specifications && p.specifications.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      Boolean(matchesVariant);

    return matchesCategory && matchesSearch;
  });

  const getProductPrice = (product: Product, variant?: ProductVariant): number => {
    if (variant) {
      if (isContractor) {
        return Number(variant.contractor_price) || Number(variant.retail_price);
      }
      return Number(variant.retail_price);
    }
    if (isContractor) {
      return Number(product.contractor_price) || Number(product.retail_price);
    }
    return Number(product.retail_price);
  };

  const addToCart = (product: Product, variant?: ProductVariant, defaultQty: number = 1) => {
    const maxAvailable = variant ? Number(variant.current_stock) : Number(product.current_stock);
    const existingItem = cart.find((item) =>
      variant
        ? item.product_id === product.id && item.variant_id === variant.id
        : item.product_id === product.id && !item.variant_id
    );
    const alreadyQty = existingItem ? existingItem.quantity : 0;
    const available = Math.max(0, maxAvailable - alreadyQty);

    if (available <= 0) {
      alert(`No stock available for ${product.name}${variant ? ` (${variant.variant_name})` : ""}`);
      return;
    }

    const qtyToAdd = Math.min(defaultQty, available);
    if (qtyToAdd < defaultQty) {
      alert(`Only ${available} available in stock – adding ${available} units`);
    }

    const unitPrice = getProductPrice(product, variant);
    const costPrice = variant ? Number(variant.cost_price) : Number(product.cost_price);

    if (existingItem) {
      setCart((prev) =>
        prev.map((item) => {
          const isMatch = variant
            ? item.product_id === product.id && item.variant_id === variant.id
            : item.product_id === product.id && !item.variant_id;

          if (!isMatch) return item;
          const newQty = Number((item.quantity + qtyToAdd).toFixed(3));
          return {
            ...item,
            quantity: newQty,
            total_price: Number((newQty * item.unit_price).toFixed(2)),
          };
        })
      );
    } else {
      const newItem: SaleItem = {
        product_id: product.id,
        variant_id: variant?.id,
        variant_name: variant?.variant_name,
        product_name: product.name,
        sku: variant?.sku || product.sku,
        quantity: qtyToAdd,
        unit_price: unitPrice,
        cost_price: costPrice,
        total_price: Number((qtyToAdd * unitPrice).toFixed(2)),
        unit_of_measure: variant?.unit_of_measure || product.unit_of_measure,
      };
      setCart((prev) => [newItem, ...prev]);
    }
  };

  const updateQuantity = (productId: string, variantId?: string, newQty: number = 1) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const variant = variantId ? product.variants?.find((v) => v.id === variantId) : undefined;
    const maxQty = variant ? Number(variant.current_stock) : Number(product.current_stock);

    if (newQty > maxQty) {
      alert(`Cannot exceed available stock (${maxQty})`);
      newQty = maxQty;
    }
    if (newQty <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        const isMatch = variantId
          ? item.product_id === productId && item.variant_id === variantId
          : item.product_id === productId && !item.variant_id;

        if (!isMatch) return item;
        return {
          ...item,
          quantity: Number(newQty.toFixed(3)),
          total_price: Number((newQty * item.unit_price).toFixed(2)),
        };
      })
    );
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart((prev) =>
      prev.filter((item) => {
        const isMatch = variantId
          ? item.product_id === productId && item.variant_id === variantId
          : item.product_id === productId && !item.variant_id;
        return !isMatch;
      })
    );
  };

  // Direct Barcode or SKU Scanner Key Handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const q = searchQuery.trim();
      if (!q) return;

      // 1. Exact variant barcode / SKU match
      for (const p of products) {
        if (p.variants && p.variants.length > 0) {
          const matchedVar = p.variants.find(
            (v) => (v.barcode && v.barcode === q) || v.sku.toLowerCase() === q.toLowerCase()
          );
          if (matchedVar) {
            addToCart(p, matchedVar);
            setSearchQuery("");
            return;
          }
        }
        // 2. Exact parent barcode / SKU match
        if ((p.barcode && p.barcode === q) || p.sku.toLowerCase() === q.toLowerCase()) {
          if (p.variants && p.variants.length > 0) {
            setSelectedProductForVariantPicker(p);
          } else {
            addToCart(p);
          }
          setSearchQuery("");
          return;
        }
      }
    }
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.total_price, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const remainingCredit = isContractor
    ? Math.max(0, Number(selectedCustomer?.credit_limit || 0) - Number(selectedCustomer?.current_balance || 0))
    : 0;
  const exceedsCreditLimit = paymentMethod === "credit" && isContractor && totalAmount > remainingCredit;

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;
    if (paymentMethod === "credit" && !isContractor) {
      alert("Only registered contractors can charge on account credit.");
      return;
    }

    setIsProcessing(true);
    try {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      const isCredit = paymentMethod === "credit";

      const completed = await HardwareStoreService.completeSale({
        invoice_number: invoiceNumber,
        customer_id: selectedCustomer?.id,
        customer_name: selectedCustomer?.name,
        cashier_name: "Counter Cashier",
        items: cart,
        subtotal,
        discount: discountAmount,
        tax: 0,
        total_amount: totalAmount,
        paid_amount: isCredit ? 0 : totalAmount,
        payment_method: paymentMethod,
        payment_status: isCredit ? "unpaid" : "paid",
        notes: isCredit ? "Charged to contractor ledger" : "Counter Cashier Checkout",
      });

      setCompletedInvoice(completed);
      setShowReceiptModal(true);
      clearCart();

      await loadData();
    } catch (err: any) {
      console.error("Checkout failed:", err);
      alert("Checkout failed: " + (err.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col lg:flex-row gap-6">
      {/* LEFT: Product Catalog & Fast Search */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Scan barcode or search timber, boards, finishes, SKU (Press Enter to auto-add)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Category Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Products
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === c.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 content-start">
          {isLoading ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs font-medium">Loading catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              <p className="text-sm font-semibold">No items match your search.</p>
              <p className="text-xs text-slate-400 mt-1">Add items via the Inventory tab.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const hasVariants = Boolean(product.variants && product.variants.length > 0);
              const isLowStock = Number(product.current_stock) <= Number(product.min_reorder_level);

              let priceDisplay = formatCurrency(getProductPrice(product));
              if (hasVariants && product.variants && product.variants.length > 0) {
                const vPrices = product.variants.map((v) => getProductPrice(product, v));
                const minP = Math.min(...vPrices);
                const maxP = Math.max(...vPrices);
                priceDisplay = minP === maxP ? formatCurrency(minP) : `${formatCurrency(minP)} – ${formatCurrency(maxP)}`;
              }

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (hasVariants) {
                      setSelectedProductForVariantPicker(product);
                    } else {
                      addToCart(product, undefined, 1);
                    }
                  }}
                  className={`group p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative shadow-xs hover:shadow-md ${
                    hasVariants
                      ? "border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/10"
                      : "border-slate-200 hover:border-blue-500/60 bg-white hover:bg-blue-50/10"
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative flex items-center justify-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-slate-400 stroke-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400 truncate">{product.sku}</span>
                        {hasVariants ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                            {product.variants!.length} Options
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              isLowStock
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {formatQty(Number(product.current_stock), product.unit_of_measure)}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 mt-1 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{product.specifications}</p>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[100px]">{product.aisle_bin_location || "Showroom"}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-black text-slate-900">{priceDisplay}</div>
                      {hasVariants ? (
                        <span className="text-[9px] text-blue-600 font-bold block">Select Spec/Size</span>
                      ) : isContractor && Number(product.contractor_price) < Number(product.retail_price) ? (
                        <span className="text-[9px] text-emerald-600 font-bold block">Contractor Rate</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Cart, Customer & Checkout Sidebar */}
      <div className="w-full lg:w-[420px] bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        {/* Customer Selector */}
        <div className="p-4 border-b border-slate-200 space-y-2 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer / Contractor</span>
            {isContractor && (
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                Contractor Wholesale Active
              </span>
            )}
          </div>
          <select
            value={selectedCustomer?.id || ""}
            onChange={(e) => {
              const cust = customers.find((c) => c.id === e.target.value);
              setSelectedCustomer(cust || null);
            }}
            className="w-full p-2.5 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.customer_type === "contractor" ? `(Balance: ${formatCurrency(c.current_balance)})` : ""}
              </option>
            ))}
          </select>

          {isContractor && (
            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-center justify-between">
              <div>
                <span className="font-semibold">Current Balance:</span> {formatCurrency(selectedCustomer?.current_balance)}
              </div>
              <div>
                <span className="font-semibold">Credit Limit:</span> {formatCurrency(selectedCustomer?.credit_limit)}
              </div>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-12">
              <ShoppingCart className="w-12 h-12 text-slate-300 stroke-1 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Cart is Empty</p>
              <p className="text-xs text-slate-400 max-w-[200px]">Click any hardware item to begin checkout.</p>
            </div>
          ) : (
            cart.map((item) => {
              const itemKey = item.variant_id ? `${item.product_id}-${item.variant_id}` : item.product_id;
              return (
                <div key={itemKey} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{item.product_name}</h5>
                      {item.variant_name && (
                        <span className="px-1.5 py-0.2 rounded font-bold text-[9px] bg-blue-50 text-blue-700 border border-blue-200">
                          {item.variant_name}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{item.sku}</div>
                    <div className="text-[11px] text-slate-500">
                      {formatCurrency(item.unit_price)} / {item.unit_of_measure}
                    </div>
                  </div>

                  {/* Fractional Quantity Stepper */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product_id,
                          item.variant_id,
                          item.quantity - (item.unit_of_measure === "meter" || item.unit_of_measure === "kg" ? 0.5 : 1)
                        )
                      }
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      step="any"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.product_id, item.variant_id, parseFloat(e.target.value) || 0)
                      }
                      className="w-14 px-1 py-1 text-xs font-bold text-center border border-slate-200 rounded focus:outline-none"
                    />
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product_id,
                          item.variant_id,
                          item.quantity + (item.unit_of_measure === "meter" || item.unit_of_measure === "kg" ? 0.5 : 1)
                        )
                      }
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right w-20">
                    <div className="text-xs font-black text-slate-900">{formatCurrency(item.total_price)}</div>
                    <button
                      onClick={() => removeFromCart(item.product_id, item.variant_id)}
                      className="text-[10px] text-rose-500 hover:text-rose-700 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Checkout Controls */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Discount ($):</span>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 p-1 text-right text-xs font-bold border border-slate-200 rounded bg-white"
                />
              </div>
              <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-base text-slate-900">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`py-2 px-1 text-xs font-bold rounded-lg border flex items-center justify-center gap-1 transition-all ${
                  paymentMethod === "cash"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>
              <button
                onClick={() => setPaymentMethod("card")}
                className={`py-2 px-1 text-xs font-bold rounded-lg border flex items-center justify-center gap-1 transition-all ${
                  paymentMethod === "card"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
              <button
                onClick={() => setPaymentMethod("credit")}
                disabled={!isContractor}
                className={`py-2 px-1 text-xs font-bold rounded-lg border flex items-center justify-center gap-1 transition-all ${
                  paymentMethod === "credit"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : !isContractor
                    ? "opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Credit (AR)</span>
              </button>
            </div>

            {exceedsCreditLimit && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 text-[11px] flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Warning: Order exceeds contractor available credit limit!</span>
              </div>
            )}

            {/* Complete Sale Button */}
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Sale...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Complete Sale ({formatCurrency(totalAmount)})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Printable Receipt Overlay (Clean modern preview) */}
      {showReceiptModal && completedInvoice && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Sale Completed Successfully!</span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="printable-receipt" className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 space-y-3 font-mono text-xs">
              <div className="text-center space-y-1 flex flex-col items-center">
                <AlkaramLogo size={40} variant="badge" />
                <h2 className="font-extrabold text-base text-slate-900 tracking-wide mt-1">
                  ALKARAM TRADERS
                </h2>
                <p className="text-[11px] text-slate-600 font-sans">Hardware, Timber & Building Materials</p>
                <p className="text-[10px] text-slate-400">Invoice: {completedInvoice.invoice_number}</p>
                <p className="text-[10px] text-slate-400">Date: {new Date().toLocaleString()}</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Customer:</span>
                  <span>{completedInvoice.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span className="uppercase font-bold">{completedInvoice.payment_method}</span>
                </div>
              </div>

              <div className="space-y-1 py-1">
                {completedInvoice.items.map((it: SaleItem, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[220px]">
                      {it.quantity}x {it.product_name}
                      {it.variant_name ? ` (${it.variant_name})` : ""}
                    </span>
                    <span>{formatCurrency(it.total_price)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 font-bold">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(completedInvoice.total_amount)}</span>
                </div>
                {completedInvoice.payment_method === "credit" && (
                  <div className="text-[11px] text-blue-700 pt-1">
                    * Charged to Contractor Credit Ledger
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Receipt</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
              >
                New Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cashier Variant Selection Modal */}
      {selectedProductForVariantPicker && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                  {selectedProductForVariantPicker.image_url ? (
                    <img
                      src={selectedProductForVariantPicker.image_url}
                      alt={selectedProductForVariantPicker.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-slate-400 stroke-1" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">
                    {selectedProductForVariantPicker.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedProductForVariantPicker.specifications || selectedProductForVariantPicker.brand || "Hardware"} •{" "}
                    <span className="font-mono text-slate-600">{selectedProductForVariantPicker.sku}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForVariantPicker(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer pricing status hint */}
            <div className="flex items-center justify-between text-[11px] px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">
                Customer: <strong className="text-slate-800">{selectedCustomer?.name || "Retail Walk-in"}</strong>
              </span>
              {isContractor && (
                <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[10px]">
                  Contractor Wholesale Rates Active
                </span>
              )}
            </div>

            {/* Variant List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {selectedProductForVariantPicker.variants && selectedProductForVariantPicker.variants.length > 0 ? (
                selectedProductForVariantPicker.variants.map((v) => {
                  const vPrice = getProductPrice(selectedProductForVariantPicker, v);
                  const inCartItem = cart.find(
                    (it) => it.product_id === selectedProductForVariantPicker.id && it.variant_id === v.id
                  );
                  const inCartQty = inCartItem?.quantity || 0;
                  const available = Math.max(0, Number(v.current_stock) - inCartQty);
                  const isOutOfStock = available <= 0;

                  return (
                    <div
                      key={v.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isOutOfStock
                          ? "bg-slate-50 border-slate-200 opacity-60"
                          : "bg-white border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 shadow-2xs"
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">{v.variant_name}</span>
                          {inCartQty > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                              {inCartQty} in cart
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{v.sku}</span>
                          {v.barcode && <span>• Barcode: {v.barcode}</span>}
                          <span>•</span>
                          <span
                            className={
                              Number(v.current_stock) <= Number(v.min_reorder_level)
                                ? "text-rose-600 font-bold"
                                : "text-slate-600"
                            }
                          >
                            {formatQty(
                              Number(v.current_stock),
                              v.unit_of_measure || selectedProductForVariantPicker.unit_of_measure
                            )}{" "}
                            in stock
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono">
                          <div className="font-black text-sm text-slate-900">{formatCurrency(vPrice)}</div>
                          {isContractor && Number(v.contractor_price) < Number(v.retail_price) && (
                            <span className="text-[9px] text-emerald-600 font-bold block">Wholesale</span>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => addToCart(selectedProductForVariantPicker, v, 1)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">No variants found for this product.</div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProductForVariantPicker(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
