# Alkaram Traders - Inventory, Hardware, POS & Accounting System

An enterprise-grade, high-speed retail and wholesale management application built specifically for **Alkaram Traders** (timber yards, hardware, tools, sheet materials, and architectural hardware).

---

## 🛠️ Key Hardware Store Solutions Built-In

1. **Fractional & Multi-Unit Inventory Engine (UoM)**
   - Sell items by **Piece**, **Meter** (wires, pipes, garden hose, chains), **Kilogram** (concrete nails, bulk bolts), **Box** (screws), **Bag** (cement), or **Liter** (paints, solvents).
   - Decimal quantity support with fast +/- step increments.

2. **Aisle & Bin Coordinates Tracking**
   - Every hardware SKU stores physical coordinates: e.g. `Aisle 1, Shelf B, Bin 4`.
   - Directly visible on the POS checkout screen and inventory table so counter staff can find items in seconds.

3. **Contractor Credit Ledger ("Udhar / Khata" - Accounts Receivable)**
   - Set contractor-specific credit lines (e.g. $10,000 limit) and payment terms (Net 15, 30, 60 days).
   - Fast toggle to Contractor Wholesale Pricing at POS.
   - Chronological ledger statements with running balance after every invoice and payment.
   - One-click PDF/Thermal statement printing.

4. **Cutting Wastage & Offcuts Management**
   - Record pipe and wire scrap offcuts, damaged store stock, shrinkage/theft, and cycle-count audits.
   - Automatically computes financial COGS loss.

5. **Daily Cash Register (Till) Reconciliation**
   - Shift opening float tracking.
   - Cash sales added to till, petty cash payouts deducted from till.
   - End-of-shift physical cash counting with automatic discrepancy calculation (Over/Short audit).

6. **Real-Time Profit & Loss (P&L) Reporting**
   - Direct Cost of Goods Sold (COGS) calculation based on item acquisition costs.
   - Real-time Gross Margin %, itemized store overheads, and Net Operating Income.

---

## 🚀 Getting Started

### 1. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Connect Supabase
The app is pre-configured with your Supabase project (`owofuyhihrjbwkdvfgzp`).
- SQL Schema: [`supabase/schema.sql`](./supabase/schema.sql)
- Seed Data: [`supabase/seed.sql`](./supabase/seed.sql)

To execute:
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard/project/owofuyhihrjbwkdvfgzp).
2. Go to the **SQL Editor**.
3. Paste and run [`supabase/schema.sql`](./supabase/schema.sql).
4. Paste and run [`supabase/seed.sql`](./supabase/seed.sql).
5. Add your `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.

---

## 📁 Application Architecture

- `/src/app/page.tsx`: Executive dashboard with financial KPIs, low-stock reorder warnings, and contractor balances.
- `/src/app/pos/page.tsx`: Fast counter POS terminal with fractional units, contractor pricing, and printable receipt.
- `/src/app/inventory/page.tsx`: Full catalog with search by SKU, barcode, brand, dimensions, and bin locations.
- `/src/app/inventory/adjustments/page.tsx`: Scrap offcuts, breakage, and stock audits.
- `/src/app/contractors/page.tsx`: Contractor credit limits, aging receivables, and payment recording.
- `/src/app/contractors/[id]/page.tsx`: Individual customer ledger statement.
- `/src/app/suppliers/page.tsx`: Material wholesalers, payment terms, and purchase orders.
- `/src/app/accounting/page.tsx`: Profit & Loss income statement and balance sheet snapshot.
- `/src/app/accounting/register/page.tsx`: Shift cash drawer reconciliation.
- `/src/app/accounting/expenses/page.tsx`: Categorized store expenses paid from till or bank.
