import { 
  Product, 
  Category, 
  Customer, 
  Supplier, 
  Sale, 
  SaleItem, 
  CustomerLedgerEntry, 
  StockAdjustment, 
  Expense, 
  CashDrawerSession,
  FinancialSummary,
  ProductVariant,
  BulkPriceUpdateOptions
} from "./types";
import { supabase } from "../supabase/client";



export function getProductImage(product: Partial<Product>): string {
  return product.image_url?.trim() || "";
}

export class HardwareStoreService {
  // 1. PRODUCTS
  static async getProducts(): Promise<Product[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name), product_variants(*)")
      .order("name", { ascending: true });
    
    if (error || !data || data.length === 0) {
      if (error) console.error("Error fetching products from Supabase:", error);
      return [];
    }
    return (data || []).map((p: any) => {
      const vars: ProductVariant[] = (p.product_variants || []).sort((a: any, b: any) =>
        (a.variant_name || "").localeCompare(b.variant_name || "")
      );
      // Aggregate stock from variants if variants exist
      const totalStock = vars.length > 0 
        ? vars.reduce((sum, v) => sum + (Number(v.current_stock) || 0), 0)
        : Number(p.current_stock) || 0;

      return {
        ...p,
        category_name: p.categories?.name || "General",
        image_url: p.image_url || "",
        current_stock: totalStock,
        variants: vars,
      };
    });
  }

  static async addProduct(
    product: Omit<Product, "id">,
    initialVariants?: Omit<ProductVariant, "id" | "product_id">[]
  ): Promise<Product | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("products")
      .insert([{
        sku: product.sku,
        barcode: product.barcode || null,
        name: product.name,
        category_id: product.category_id || null,
        brand: product.brand || "",
        specifications: product.specifications || "",
        unit_of_measure: product.unit_of_measure || "piece",
        cost_price: Number(product.cost_price) || 0,
        retail_price: Number(product.retail_price) || 0,
        contractor_price: Number(product.contractor_price) || 0,
        current_stock: Number(product.current_stock) || 0,
        min_reorder_level: Number(product.min_reorder_level) || 5,
        aisle_bin_location: product.aisle_bin_location || "",
        supplier_id: product.supplier_id || null,
        image_url: product.image_url || null,
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding product to Supabase:", error);
      throw error;
    }

    if (data) {
      if (initialVariants && initialVariants.length > 0) {
        const varInserts = initialVariants.map((v, idx) => ({
          product_id: data.id,
          variant_name: v.variant_name || `Variant ${idx + 1}`,
          sku: v.sku || `${data.sku}-V${idx + 1}`,
          barcode: v.barcode || null,
          cost_price: Number(v.cost_price) || Number(data.cost_price) || 0,
          retail_price: Number(v.retail_price) || Number(data.retail_price) || 0,
          contractor_price: Number(v.contractor_price) || Number(data.contractor_price) || 0,
          current_stock: Number(v.current_stock) || 0,
          min_reorder_level: Number(v.min_reorder_level) || Number(data.min_reorder_level) || 5,
          aisle_bin_location: v.aisle_bin_location || data.aisle_bin_location || "",
          unit_of_measure: v.unit_of_measure || data.unit_of_measure || "piece",
          is_active: true,
        }));
        await supabase.from("product_variants").insert(varInserts);
      } else {
        await supabase.from("product_variants").insert([{
          product_id: data.id,
          variant_name: data.specifications?.trim() || "Standard",
          sku: data.sku,
          barcode: data.barcode || null,
          cost_price: Number(data.cost_price) || 0,
          retail_price: Number(data.retail_price) || 0,
          contractor_price: Number(data.contractor_price) || 0,
          current_stock: Number(data.current_stock) || 0,
          min_reorder_level: Number(data.min_reorder_level) || 5,
          aisle_bin_location: data.aisle_bin_location || "",
          unit_of_measure: data.unit_of_measure || "piece",
          is_active: true,
        }]);
      }
    }

    return data;
  }

  static async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("products")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product in Supabase:", error);
      throw error;
    }
    return data;
  }

  static async uploadProductImage(file: File, sku: string): Promise<string> {
    if (!supabase) {
      throw new Error(
        "Supabase client is not configured. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file."
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const cleanSku = (sku || "prod").replace(/[^a-zA-Z0-9_-]/g, "");
    const path = `${cleanSku}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      console.error("Supabase Storage bucket upload error:", uploadError);
      throw new Error(
        `Failed to upload image to Supabase Storage bucket 'product-images': ${uploadError.message}. Make sure the bucket exists and public upload policy is enabled.`
      );
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(path);

    if (!urlData?.publicUrl) {
      throw new Error("Could not retrieve public CDN URL for the uploaded image from Supabase.");
    }

    return urlData.publicUrl;
  }

  static async deleteProduct(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("Error deleting product from Supabase:", error);
      throw error;
    }
    return true;
  }

  // 1.1 VARIANTS
  static async getVariants(productId: string): Promise<ProductVariant[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("variant_name", { ascending: true });

    if (error) {
      console.error("Error fetching product variants:", error);
      return [];
    }
    return data || [];
  }

  static async addVariant(variant: Omit<ProductVariant, "id">): Promise<ProductVariant | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("product_variants")
      .insert([{
        product_id: variant.product_id,
        variant_name: variant.variant_name || "Standard",
        sku: variant.sku,
        barcode: variant.barcode || null,
        cost_price: Number(variant.cost_price) || 0,
        retail_price: Number(variant.retail_price) || 0,
        contractor_price: Number(variant.contractor_price) || 0,
        current_stock: Number(variant.current_stock) || 0,
        min_reorder_level: Number(variant.min_reorder_level) || 5,
        aisle_bin_location: variant.aisle_bin_location || "",
        unit_of_measure: variant.unit_of_measure || "piece",
        is_active: variant.is_active !== false,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding product variant:", error);
      throw error;
    }
    return data;
  }

  static async updateVariant(id: string, updates: Partial<ProductVariant>): Promise<ProductVariant | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("product_variants")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating variant:", error);
      throw error;
    }
    return data;
  }

  static async deleteVariant(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from("product_variants").delete().eq("id", id);
    if (error) {
      console.error("Error deleting variant:", error);
      throw error;
    }
    return true;
  }

  // Update prices for an individual variant separately
  static async updateVariantPrice(
    variantId: string, 
    prices: { cost_price?: number; retail_price?: number; contractor_price?: number }
  ): Promise<ProductVariant | null> {
    if (!supabase) return null;
    const updates: any = { updated_at: new Date().toISOString() };
    if (prices.cost_price !== undefined) updates.cost_price = Number(prices.cost_price);
    if (prices.retail_price !== undefined) updates.retail_price = Number(prices.retail_price);
    if (prices.contractor_price !== undefined) updates.contractor_price = Number(prices.contractor_price);

    const { data, error } = await supabase
      .from("product_variants")
      .update(updates)
      .eq("id", variantId)
      .select()
      .single();

    if (error) {
      console.error("Error updating variant price:", error);
      throw error;
    }
    return data;
  }

  // Bulk update prices for ALL variants of a product at once
  static async bulkUpdateProductVariantPrices(
    productId: string,
    options: BulkPriceUpdateOptions
  ): Promise<ProductVariant[]> {
    if (!supabase) return [];
    
    // Fetch all current variants
    const variants = await this.getVariants(productId);
    if (!variants || variants.length === 0) return [];

    const updatedVariants: ProductVariant[] = [];

    for (const v of variants) {
      const updates: Partial<ProductVariant> = {
        updated_at: new Date().toISOString(),
      };

      for (const field of options.targetFields) {
        const currentVal = Number(v[field]) || 0;
        let newVal = currentVal;

        if (options.mode === "percentage") {
          // e.g. +10% or -5%
          newVal = Math.round((currentVal * (1 + options.value / 100)) * 100) / 100;
        } else if (options.mode === "fixed_add") {
          // e.g. +100 or -50
          newVal = Math.max(0, Math.round((currentVal + options.value) * 100) / 100);
        } else if (options.mode === "fixed_set") {
          // e.g. set all to 2500
          newVal = Math.max(0, Math.round(options.value * 100) / 100);
        } else if (options.mode === "margin_over_cost") {
          // markup over variant cost price
          const cost = Number(v.cost_price) || 0;
          newVal = Math.round((cost * (1 + options.value / 100)) * 100) / 100;
        }

        updates[field] = newVal;
      }

      const { data, error } = await supabase
        .from("product_variants")
        .update(updates)
        .eq("id", v.id)
        .select()
        .single();

      if (error) {
        console.error(`Error bulk updating variant ${v.id}:`, error);
      } else if (data) {
        updatedVariants.push(data);
      }
    }

    // Also update parent product prices to match the primary variant so catalog stays aligned
    if (updatedVariants.length > 0) {
      const first = updatedVariants[0];
      await supabase
        .from("products")
        .update({
          retail_price: first.retail_price,
          contractor_price: first.contractor_price,
          cost_price: first.cost_price,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId);
    }

    return updatedVariants;
  }

  // 2. CATEGORIES
  static async getCategories(): Promise<Category[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });
    
    if (error || !data || data.length === 0) {
      if (error) console.error("Error fetching categories from Supabase:", error);
      return [];
    }
    return data;
  }

  static async addCategory(name: string, description?: string): Promise<Category | null> {
    if (!supabase) return null;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name, slug, description }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 3. SUPPLIERS (AP)
  static async getSuppliers(): Promise<Supplier[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching suppliers from Supabase:", error);
      return [];
    }
    return data || [];
  }

  static async addSupplier(supplier: Omit<Supplier, "id">): Promise<Supplier | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("suppliers")
      .insert([{
        name: supplier.name,
        contact_person: supplier.contact_person || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        payment_terms_days: Number(supplier.payment_terms_days) || 30,
        current_payable: Number(supplier.current_payable) || 0,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 4. CUSTOMERS & CONTRACTORS (AR)
  static async getCustomers(): Promise<Customer[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching customers from Supabase:", error);
      return [];
    }
    return data || [];
  }

  static async addCustomer(customer: Omit<Customer, "id">): Promise<Customer | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("customers")
      .insert([{
        name: customer.name,
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        customer_type: customer.customer_type || "contractor",
        credit_limit: Number(customer.credit_limit) || 0,
        current_balance: Number(customer.current_balance) || 0,
        payment_terms_days: Number(customer.payment_terms_days) || 30,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 5. CUSTOMER LEDGER & PAYMENTS
  static async getCustomerLedger(customerId: string): Promise<CustomerLedgerEntry[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("customer_ledger")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching ledger from Supabase:", error);
      return [];
    }
    return data || [];
  }

  static async recordCustomerPayment(
    customerId: string,
    amount: number,
    method: "cash" | "bank_transfer" | "check",
    notes?: string
  ): Promise<boolean> {
    if (!supabase) return false;

    // 1. Fetch current customer
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .select("current_balance")
      .eq("id", customerId)
      .single();

    if (custErr || !customer) return false;

    const newBalance = Math.max(0, Number(customer.current_balance) - amount);

    // 2. Update customer balance in Supabase
    await supabase
      .from("customers")
      .update({ current_balance: newBalance })
      .eq("id", customerId);

    // 3. Insert ledger entry in Supabase
    await supabase
      .from("customer_ledger")
      .insert([{
        customer_id: customerId,
        transaction_type: "payment",
        debit: 0,
        credit: amount,
        balance_after: newBalance,
        payment_method: method,
        notes: notes || `Payment received via ${method}`,
      }]);

    // 4. If paid via cash, update active till in Supabase
    if (method === "cash") {
      const drawer = await this.getCashDrawer();
      if (drawer && drawer.status === "open") {
        await supabase
          .from("cash_drawer_sessions")
          .update({
            cash_sales_total: Number(drawer.cash_sales_total) + amount,
            expected_cash: Number(drawer.expected_cash) + amount,
          })
          .eq("id", drawer.id);
      }
    }

    return true;
  }

  // 6. SALES & POS CHECKOUT
  static async getSales(): Promise<Sale[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("sales")
      .select("*, sale_items(*), customers(name)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching sales from Supabase:", error);
      return [];
    }

    return (data || []).map((s: any) => ({
      ...s,
      customer_name: s.customers?.name || "Walk-in Retail",
      items: (s.sale_items || []).map((it: any) => ({
        ...it,
        product_name: it.product_id, // can be joined
      })),
    }));
  }

  static async completeSale(saleData: Omit<Sale, "id" | "created_at">): Promise<Sale> {
    if (!supabase) throw new Error("Supabase is not configured");

    // 1. Insert into sales table
    const { data: sale, error: saleErr } = await supabase
      .from("sales")
      .insert([{
        invoice_number: saleData.invoice_number,
        customer_id: saleData.customer_id || null,
        cashier_name: saleData.cashier_name || "Counter Staff",
        subtotal: saleData.subtotal,
        discount: saleData.discount,
        tax: saleData.tax,
        total_amount: saleData.total_amount,
        paid_amount: saleData.paid_amount,
        payment_method: saleData.payment_method,
        payment_status: saleData.payment_status,
        notes: saleData.notes || null,
      }])
      .select()
      .single();

    if (saleErr || !sale) throw saleErr || new Error("Failed to insert sale");

    // 2. Insert line items
    const saleItems = saleData.items.map((it) => ({
      sale_id: sale.id,
      product_id: it.product_id,
      variant_id: it.variant_id || null,
      variant_name: it.variant_name || null,
      quantity: it.quantity,
      unit_price: it.unit_price,
      cost_price: it.cost_price,
      total_price: it.total_price,
      unit_of_measure: it.unit_of_measure,
    }));

    await supabase.from("sale_items").insert(saleItems);

    // 3. Decrement product and variant stock directly in Supabase
    for (const it of saleData.items) {
      if (it.variant_id) {
        const { data: v } = await supabase
          .from("product_variants")
          .select("current_stock")
          .eq("id", it.variant_id)
          .single();

        if (v) {
          const newVarStock = Math.max(0, Number(v.current_stock) - Number(it.quantity));
          await supabase
            .from("product_variants")
            .update({ current_stock: newVarStock, updated_at: new Date().toISOString() })
            .eq("id", it.variant_id);
        }
      }

      const { data: prod } = await supabase
        .from("products")
        .select("current_stock")
        .eq("id", it.product_id)
        .single();

      if (prod) {
        const newStock = Math.max(0, Number(prod.current_stock) - Number(it.quantity));
        await supabase
          .from("products")
          .update({ current_stock: newStock, updated_at: new Date().toISOString() })
          .eq("id", it.product_id);
      }
    }

    // 4. If charged to contractor on credit, update customer balance & ledger in Supabase
    if (saleData.payment_method === "credit" && saleData.customer_id) {
      const unpaidAmount = saleData.total_amount - (saleData.paid_amount || 0);
      const { data: cust } = await supabase
        .from("customers")
        .select("current_balance")
        .eq("id", saleData.customer_id)
        .single();

      if (cust) {
        const newBalance = Number(cust.current_balance) + unpaidAmount;
        await supabase
          .from("customers")
          .update({ current_balance: newBalance })
          .eq("id", saleData.customer_id);

        await supabase
          .from("customer_ledger")
          .insert([{
            customer_id: saleData.customer_id,
            transaction_type: "invoice",
            sale_id: sale.id,
            invoice_number: sale.invoice_number,
            debit: unpaidAmount,
            credit: 0,
            balance_after: newBalance,
            payment_method: "credit",
            notes: `Invoice ${sale.invoice_number} on credit`,
          }]);
      }
    }

    // 5. If cash received, update active cash register till
    if (saleData.payment_method === "cash" || (saleData.paid_amount > 0 && saleData.payment_method !== "credit")) {
      const cashReceived = saleData.payment_method === "cash" ? saleData.total_amount : saleData.paid_amount;
      const drawer = await this.getCashDrawer();
      if (drawer && drawer.status === "open") {
        await supabase
          .from("cash_drawer_sessions")
          .update({
            cash_sales_total: Number(drawer.cash_sales_total) + cashReceived,
            expected_cash: Number(drawer.expected_cash) + cashReceived,
          })
          .eq("id", drawer.id);
      }
    }

    return {
      ...saleData,
      id: sale.id,
      created_at: sale.created_at,
    };
  }

  // 7. STOCK ADJUSTMENTS & CUTTING SCRAP
  static async getStockAdjustments(): Promise<StockAdjustment[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("stock_adjustments")
      .select("*, products(name, sku)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stock adjustments from Supabase:", error);
      return [];
    }
    return (data || []).map((a: any) => ({
      ...a,
      product_name: a.products?.name || "Product",
      sku: a.products?.sku || "",
    }));
  }

  static async recordStockAdjustment(
    adjustment: Omit<StockAdjustment, "id" | "created_at">
  ): Promise<StockAdjustment | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("stock_adjustments")
      .insert([{
        product_id: adjustment.product_id,
        adjustment_type: adjustment.adjustment_type,
        quantity_change: adjustment.quantity_change,
        previous_stock: adjustment.previous_stock,
        new_stock: adjustment.new_stock,
        cost_impact: adjustment.cost_impact,
        reason_notes: adjustment.reason_notes,
        adjusted_by: adjustment.adjusted_by || "Store Manager",
      }])
      .select()
      .single();

    if (error) throw error;

    // Update product stock directly in Supabase
    await supabase
      .from("products")
      .update({
        current_stock: adjustment.new_stock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", adjustment.product_id);

    return data;
  }

  // 8. EXPENSES
  static async getExpenses(): Promise<Expense[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching expenses from Supabase:", error);
      return [];
    }
    return data || [];
  }

  static async addExpense(expense: Omit<Expense, "id" | "created_at">): Promise<Expense | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("expenses")
      .insert([{
        category: expense.category,
        amount: expense.amount,
        payment_method: expense.payment_method,
        paid_to: expense.paid_to || "",
        description: expense.description,
        receipt_ref: expense.receipt_ref || null,
      }])
      .select()
      .single();

    if (error) throw error;

    // If paid from cash drawer, deduct from active till
    if (expense.payment_method === "cash_drawer") {
      const drawer = await this.getCashDrawer();
      if (drawer && drawer.status === "open") {
        await supabase
          .from("cash_drawer_sessions")
          .update({
            cash_expenses_total: Number(drawer.cash_expenses_total) + Number(expense.amount),
            expected_cash: Number(drawer.expected_cash) - Number(expense.amount),
          })
          .eq("id", drawer.id);
      }
    }

    return data;
  }

  // 9. CASH DRAWER
  static async getCashDrawer(): Promise<CashDrawerSession | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("cash_drawer_sessions")
      .select("*")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching cash drawer from Supabase:", error);
      return null;
    }
    return data;
  }

  static async openCashDrawer(openingFloat: number, openedBy: string = "Cashier"): Promise<CashDrawerSession | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("cash_drawer_sessions")
      .insert([{
        opened_by: openedBy,
        opening_float: openingFloat,
        cash_sales_total: 0,
        cash_expenses_total: 0,
        expected_cash: openingFloat,
        status: "open",
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async closeCashDrawer(actualCount: number, notes?: string): Promise<CashDrawerSession | null> {
    if (!supabase) return null;
    const drawer = await this.getCashDrawer();
    if (!drawer) return null;

    const discrepancy = actualCount - Number(drawer.expected_cash);
    const { data, error } = await supabase
      .from("cash_drawer_sessions")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        actual_cash_counted: actualCount,
        discrepancy: discrepancy,
        closing_notes: notes || null,
      })
      .eq("id", drawer.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 10. REAL FINANCIAL SUMMARY (Computed from Live PostgreSQL Records)
  static async getFinancialSummary(): Promise<FinancialSummary> {
    if (!supabase) {
      return {
        todayRevenue: 0,
        monthRevenue: 0,
        cogs: 0,
        grossProfit: 0,
        grossMarginPercent: 0,
        operatingExpenses: 0,
        netProfit: 0,
        totalReceivables: 0,
        totalPayables: 0,
        lowStockItemsCount: 0,
        inventoryValuationCost: 0,
        inventoryValuationRetail: 0,
      };
    }

    // Parallel fetch real database tables
    const [
      { data: products },
      { data: sales },
      { data: saleItems },
      { data: expenses },
      { data: customers },
      { data: suppliers },
    ] = await Promise.all([
      supabase.from("products").select("cost_price, retail_price, current_stock, min_reorder_level"),
      supabase.from("sales").select("total_amount, created_at"),
      supabase.from("sale_items").select("cost_price, quantity"),
      supabase.from("expenses").select("amount"),
      supabase.from("customers").select("current_balance"),
      supabase.from("suppliers").select("current_payable"),
    ]);

    const prods = products || [];
    const sls = sales || [];
    const items = saleItems || [];
    const exps = expenses || [];
    const custs = customers || [];
    const sups = suppliers || [];

    // 1. Inventory Valuations
    const inventoryValuationCost = prods.reduce(
      (acc, p) => acc + (Number(p.current_stock) || 0) * (Number(p.cost_price) || 0), 0
    );
    const inventoryValuationRetail = prods.reduce(
      (acc, p) => acc + (Number(p.current_stock) || 0) * (Number(p.retail_price) || 0), 0
    );
    const lowStockItemsCount = prods.filter(
      (p) => Number(p.current_stock) <= Number(p.min_reorder_level)
    ).length;

    // 2. Real Revenue (sum of all sales)
    const totalRevenue = sls.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);

    // 3. Real COGS (sum of item acquisition cost * qty sold)
    const realCogs = items.reduce(
      (acc, it) => acc + (Number(it.cost_price) || 0) * (Number(it.quantity) || 0), 0
    );
    const grossProfit = totalRevenue - realCogs;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // 4. Real Operating Overheads
    const operatingExpenses = exps.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const netProfit = grossProfit - operatingExpenses;

    // 5. Real Receivables (Owed to store by contractors)
    const totalReceivables = custs.reduce((acc, c) => acc + (Number(c.current_balance) || 0), 0);

    // 6. Real Payables (Owed to suppliers by store)
    const totalPayables = sups.reduce((acc, s) => acc + (Number(s.current_payable) || 0), 0);

    return {
      todayRevenue: totalRevenue,
      monthRevenue: totalRevenue,
      cogs: realCogs,
      grossProfit,
      grossMarginPercent,
      operatingExpenses,
      netProfit,
      totalReceivables,
      totalPayables,
      lowStockItemsCount,
      inventoryValuationCost,
      inventoryValuationRetail,
    };
  }
}
