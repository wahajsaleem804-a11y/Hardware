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
} from "lucide-react";
import { HardwareStoreService } from "@/lib/data/store";
import { Product, Customer, Category, SaleItem } from "@/lib/data/types";
import { formatCurrency, formatQty } from "@/lib/utils";

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Cart State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "credit" | "bank_transfer">("cash");

  // Modal State
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

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.specifications && p.specifications.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.barcode && p.barcode.includes(searchQuery)) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getProductPrice = (product: Product): number => {
    if (selectedCustomer && selectedCustomer.customer_type === "contractor") {
      return Number(product.contractor_price) || Number(product.retail_price);
    }
    return Number(product.retail_price);
  };

  const addToCart = (product: Product, defaultQty: number = 1) => {
    // Determine how many units of this product are already in the cart
    const existingItem = cart.find((item) => item.product_id === product.id);
    const alreadyQty = existingItem ? existingItem.quantity : 0;
    const available = Math.max(0, product.current_stock - alreadyQty);
    if (available <= 0) {
      alert(`No stock available for ${product.name}`);
      return;
    }
    const qtyToAdd = Math.min(defaultQty, available);
    if (qtyToAdd < defaultQty) {
      alert(`Only ${available} of ${product.name} in stock – adding ${available} units`);
    }

    const existingIndex = cart.findIndex((item) => item.product_id === product.id);
    const unitPrice = getProductPrice(product);

    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = Number((updated[existingIndex].quantity + qtyToAdd).toFixed(3));
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].total_price = Number((newQty * updated[existingIndex].unit_price).toFixed(2));
      setCart(updated);
    } else {
      const newItem: SaleItem = {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: qtyToAdd,
        unit_price: unitPrice,
        cost_price: Number(product.cost_price),
        total_price: Number((qtyToAdd * unitPrice).toFixed(2)),
        unit_of_measure: product.unit_of_measure,
      };
      setCart([newItem, ...cart]);
    }
  };

  const updateQuantity = (productId: string, newQty: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const maxQty = product.current_stock;
    if (newQty > maxQty) {
      alert(`Cannot exceed available stock (${maxQty}) for this product`);
      newQty = maxQty;
    }
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = cart.map((item) => {
      if (item.product_id === productId) {
        return {
          ...item,
          quantity: Number(newQty.toFixed(3)),
          total_price: Number((newQty * item.unit_price).toFixed(2)),
        };
      }
      return item;
    });
    setCart(updated);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.total_price, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const isContractor = selectedCustomer?.customer_type === "contractor";
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

      // Refresh real products & customers from Supabase
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
              placeholder="Search live SKU, barcode, size (e.g. 1/2'', M8), brand, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
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
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Hardware
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === c.id
                    ? "bg-amber-500 text-slate-950 shadow-xs"
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
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
              <p className="text-xs font-medium">Fetching live products from Supabase...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              <p className="text-sm font-semibold">No hardware items match your search.</p>
              <p className="text-xs text-slate-400 mt-1">Add items via the Inventory tab.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const price = getProductPrice(product);
              const isLowStock = Number(product.current_stock) <= Number(product.min_reorder_level);

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product, 1)}
                  className="group p-3.5 rounded-xl border border-slate-200 hover:border-amber-500/50 bg-white hover:bg-amber-50/20 transition-all cursor-pointer flex flex-col justify-between relative shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-400">{product.sku}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isLowStock
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Stock: {formatQty(Number(product.current_stock), product.unit_of_measure)}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 mt-1 leading-snug group-hover:text-amber-700 transition-colors line-clamp-2">
                      {product.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{product.specifications}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate max-w-[110px]">{product.aisle_bin_location || "Store"}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-slate-900">{formatCurrency(price)}</div>
                      {isContractor && Number(product.contractor_price) < Number(product.retail_price) && (
                        <span className="text-[10px] text-emerald-600 font-bold">Contractor Rate</span>
                      )}
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
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
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
            className="w-full p-2.5 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.customer_type === "contractor" ? `(Balance: ${formatCurrency(c.current_balance)})` : ""}
              </option>
            ))}
          </select>

          {isContractor && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div>
                <span className="font-semibold">Current Balance:</span> {formatCurrency(selectedCustomer?.current_balance)}
              </div>
              <div>
                <span className="font-semibold">Limit:</span> {formatCurrency(selectedCustomer?.credit_limit)}
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
            cart.map((item) => (
              <div key={item.product_id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 truncate">{item.product_name}</h5>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {formatCurrency(item.unit_price)} / {item.unit_of_measure}
                  </div>
                </div>

                {/* Fractional Quantity Stepper */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity - (item.unit_of_measure === "meter" || item.unit_of_measure === "kg" ? 0.5 : 1))}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.product_id, parseFloat(e.target.value) || 0)}
                    className="w-14 px-1 py-1 text-xs font-bold text-center border border-slate-200 rounded focus:outline-none"
                  />
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity + (item.unit_of_measure === "meter" || item.unit_of_measure === "kg" ? 0.5 : 1))}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right w-20">
                  <div className="text-xs font-black text-slate-900">{formatCurrency(item.total_price)}</div>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-[10px] text-rose-500 hover:text-rose-700 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
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
                <span className="text-base text-amber-600">{formatCurrency(totalAmount)}</span>
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
                    ? "bg-amber-500 text-slate-950 border-amber-500"
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
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

      {/* Printable Receipt Modal */}
      {showReceiptModal && completedInvoice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Sale Saved to Supabase!</span>
              </div>
              <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="printable-receipt" className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 space-y-3 font-mono text-xs">
              <div className="text-center space-y-1">
                <h2 className="font-bold text-base text-slate-900 font-sans">HARDWARE PRO SUPPLY</h2>
                <p className="text-[11px] text-slate-500">Fasteners, Plumbing, Electrical & Tools</p>
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
                    <span className="truncate max-w-[180px]">
                      {it.quantity}x {it.product_name}
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
                  <div className="text-[11px] text-amber-700 pt-1">
                    * Charged to Contractor Credit Ledger
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Receipt</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
