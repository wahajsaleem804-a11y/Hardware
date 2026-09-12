export type UnitOfMeasure = 'piece' | 'meter' | 'kg' | 'box' | 'liter' | 'bag' | 'roll' | 'feet';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  payment_terms_days: number;
  current_payable: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  category_id: string;
  category_name?: string;
  brand: string;
  specifications: string; // e.g. "1/2 inch", "M8 x 50mm", "100W"
  unit_of_measure: UnitOfMeasure;
  cost_price: number;
  retail_price: number;
  contractor_price: number;
  current_stock: number;
  min_reorder_level: number;
  aisle_bin_location: string; // e.g. "Aisle 3, Shelf B, Bin 14"
  supplier_id?: string;
  supplier_name?: string;
  is_active: boolean;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type CustomerType = 'retail' | 'contractor' | 'wholesale';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  customer_type: CustomerType;
  credit_limit: number;
  current_balance: number; // Positive means customer owes shop
  payment_terms_days: number;
  created_at?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'credit' | 'split';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface SaleItem {
  id?: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  total_price: number;
  unit_of_measure: UnitOfMeasure;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name?: string;
  cashier_name: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  paid_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes?: string;
  created_at: string;
}

export type LedgerTransactionType = 'invoice' | 'payment' | 'adjustment' | 'refund';

export interface CustomerLedgerEntry {
  id: string;
  customer_id: string;
  transaction_type: LedgerTransactionType;
  sale_id?: string;
  invoice_number?: string;
  debit: number; // increases debt
  credit: number; // decreases debt
  balance_after: number;
  payment_method?: string;
  notes?: string;
  created_at: string;
}

export type AdjustmentType = 'damage' | 'theft_shrinkage' | 'cutting_waste' | 'cycle_count' | 'return_restock';

export interface StockAdjustment {
  id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  adjustment_type: AdjustmentType;
  quantity_change: number; // -1 for loss, +2 for found
  previous_stock: number;
  new_stock: number;
  cost_impact: number;
  reason_notes: string;
  adjusted_by: string;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  total_cost: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  ordered_date: string;
  expected_delivery?: string;
  received_date?: string;
  notes?: string;
  items?: {
    product_id: string;
    product_name: string;
    quantity_ordered: number;
    quantity_received: number;
    unit_cost: number;
    total_cost: number;
  }[];
}

export type ExpenseCategory = 'rent' | 'utilities' | 'freight_transport' | 'wages' | 'maintenance' | 'packaging' | 'tea_refreshment' | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  payment_method: 'cash_drawer' | 'bank' | 'card';
  paid_to: string;
  description: string;
  receipt_ref?: string;
  created_at: string;
}

export interface CashDrawerSession {
  id: string;
  opened_by: string;
  opened_at: string;
  closed_at?: string;
  opening_float: number;
  cash_sales_total: number;
  cash_expenses_total: number;
  expected_cash: number;
  actual_cash_counted?: number;
  discrepancy?: number;
  status: 'open' | 'closed';
  closing_notes?: string;
}

export interface FinancialSummary {
  todayRevenue: number;
  monthRevenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: number;
  netProfit: number;
  totalReceivables: number; // Contractor debts owed to store
  totalPayables: number; // Store debts owed to suppliers
  lowStockItemsCount: number;
  inventoryValuationCost: number;
  inventoryValuationRetail: number;
}
