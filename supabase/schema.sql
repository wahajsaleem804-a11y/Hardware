-- ==============================================================================
-- HARDWARE SHOP INVENTORY & ACCOUNTING SYSTEM SCHEMA
-- Designed for Supabase (PostgreSQL)
-- Supports: Fractional UoM, Bin Tracking, Contractor Ledgers, Cash Drawer, P&L
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    payment_terms_days INTEGER DEFAULT 30,
    current_payable NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PRODUCTS (Hardware Items)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT NOT NULL UNIQUE,
    barcode TEXT,
    name TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand TEXT,
    specifications TEXT, -- e.g., '1/2 inch', 'M8 x 50mm', '100W Warm White'
    unit_of_measure TEXT NOT NULL DEFAULT 'piece', -- 'piece', 'meter', 'kg', 'box', 'liter', 'bag', 'roll'
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    retail_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    contractor_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    current_stock NUMERIC(12,3) NOT NULL DEFAULT 0.000, -- supports decimal for meters, kg
    min_reorder_level NUMERIC(12,3) NOT NULL DEFAULT 5.000,
    aisle_bin_location TEXT, -- e.g., 'Aisle 3, Rack B, Bin 12'
    image_url TEXT, -- Supabase Storage CDN URL for product photo
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Index for instant multi-field search
CREATE INDEX IF NOT EXISTS idx_products_search ON products (sku, barcode, name, specifications, brand);

-- 4. CUSTOMERS & CONTRACTORS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    customer_type TEXT NOT NULL DEFAULT 'retail', -- 'retail', 'contractor', 'wholesale'
    credit_limit NUMERIC(12,2) DEFAULT 0.00,
    current_balance NUMERIC(12,2) DEFAULT 0.00, -- amount owed by customer to shop
    payment_terms_days INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SALES (Invoices)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    cashier_name TEXT DEFAULT 'Counter Staff',
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'cash', -- 'cash', 'card', 'bank_transfer', 'credit', 'split'
    payment_status TEXT NOT NULL DEFAULT 'paid', -- 'paid', 'partial', 'unpaid'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. SALE ITEMS
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity NUMERIC(12,3) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00, -- COGS snapshot
    total_price NUMERIC(12,2) NOT NULL,
    unit_of_measure TEXT NOT NULL
);

-- 7. CUSTOMER LEDGER (Contractor Credit / Udhar Account)
CREATE TABLE IF NOT EXISTS customer_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL, -- 'invoice', 'payment', 'adjustment', 'refund'
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    invoice_number TEXT,
    debit NUMERIC(12,2) DEFAULT 0.00,  -- increases customer debt (purchases on credit)
    credit NUMERIC(12,2) DEFAULT 0.00, -- decreases customer debt (payment received)
    balance_after NUMERIC(12,2) NOT NULL,
    payment_method TEXT, -- 'cash', 'bank_transfer', 'check'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. STOCK ADJUSTMENTS (Shrinkage, Damage, Cutting Waste, Audits)
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    adjustment_type TEXT NOT NULL, -- 'damage', 'theft_shrinkage', 'cutting_waste', 'cycle_count', 'return_restock'
    quantity_change NUMERIC(12,3) NOT NULL,
    previous_stock NUMERIC(12,3) NOT NULL,
    new_stock NUMERIC(12,3) NOT NULL,
    cost_impact NUMERIC(12,2) DEFAULT 0.00,
    reason_notes TEXT,
    adjusted_by TEXT DEFAULT 'Manager',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. PURCHASE ORDERS & SUPPLIER BILLS
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number TEXT NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ordered', -- 'draft', 'ordered', 'received', 'cancelled'
    total_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid'
    ordered_date TIMESTAMPTZ DEFAULT now(),
    expected_delivery TIMESTAMPTZ,
    received_date TIMESTAMPTZ,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_ordered NUMERIC(12,3) NOT NULL,
    quantity_received NUMERIC(12,3) DEFAULT 0.000,
    unit_cost NUMERIC(12,2) NOT NULL,
    total_cost NUMERIC(12,2) NOT NULL
);

-- 10. EXPENSES (Store Overhead & Daily Operations)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL, -- 'rent', 'utilities', 'freight_transport', 'wages', 'maintenance', 'packaging', 'tea_refreshment', 'other'
    amount NUMERIC(12,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash_drawer', -- 'cash_drawer', 'bank', 'card'
    paid_to TEXT,
    description TEXT,
    receipt_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. CASH DRAWER SESSIONS (Daily Register Closeout)
CREATE TABLE IF NOT EXISTS cash_drawer_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opened_by TEXT NOT NULL DEFAULT 'Cashier',
    opened_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ,
    opening_float NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cash_sales_total NUMERIC(12,2) DEFAULT 0.00,
    cash_expenses_total NUMERIC(12,2) DEFAULT 0.00,
    expected_cash NUMERIC(12,2) DEFAULT 0.00,
    actual_cash_counted NUMERIC(12,2),
    discrepancy NUMERIC(12,2),
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'closed'
    closing_notes TEXT
);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Configured for easy access and Supabase MCP compatibility
-- -----------------------------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_drawer_sessions ENABLE ROW LEVEL SECURITY;

-- Allow read & write access for authenticated users & anon key for local/demo setup
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public access policy" ON %I', tbl);
        EXECUTE format('CREATE POLICY "Public access policy" ON %I FOR ALL USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END $$;
