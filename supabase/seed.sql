-- ==============================================================================
-- HARDWARE SHOP SEED DATA
-- Realistic real-world products, fractional units, contractors, and ledger history
-- ==============================================================================

-- 1. Insert Categories
INSERT INTO categories (id, name, slug, description, icon) VALUES
('a1000000-0000-0000-0000-000000000001', 'Plumbing & Pipe Fittings', 'plumbing', 'Pipes, valves, elbows, brass fittings, adhesives', 'Wrench'),
('a1000000-0000-0000-0000-000000000002', 'Electrical & Lighting', 'electrical', 'Wires, conduits, switches, breakers, LED bulbs', 'Zap'),
('a1000000-0000-0000-0000-000000000003', 'Fasteners & Hardware', 'fasteners', 'Screws, nuts, bolts, washers, anchors, nails', 'Nut'),
('a1000000-0000-0000-0000-000000000004', 'Tools & Equipment', 'tools', 'Power drills, hammers, saws, levels, measuring tapes', 'Hammer'),
('a1000000-0000-0000-0000-000000000005', 'Paints & Chemicals', 'paints', 'Wall paints, primers, solvents, brushes, sealants', 'Paintbrush'),
('a1000000-0000-0000-0000-000000000006', 'Building Materials', 'building', 'Cement, sand, rebar, drywall sheets, wire mesh', 'Blocks')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Suppliers
INSERT INTO suppliers (id, name, contact_person, phone, email, address, payment_terms_days, current_payable) VALUES
('b1000000-0000-0000-0000-000000000001', 'Apex Fasteners & Steel Supply', 'Michael Vance', '+1 (555) 234-5678', 'orders@apexfasteners.com', '104 Industrial Parkway, Sector 4', 30, 1420.00),
('b1000000-0000-0000-0000-000000000002', 'National Pipe & Plumbing Wholesalers', 'Robert Chen', '+1 (555) 345-6789', 'robert@natpipe.com', '52 Logistics Way, Suite 12', 45, 2150.50),
('b1000000-0000-0000-0000-000000000003', 'BrightLine Electrical Distributors', 'Sarah Jenkins', '+1 (555) 456-7890', 'sales@brightline.com', '88 Powerhouse Rd', 30, 890.00),
('b1000000-0000-0000-0000-000000000004', 'Titan Industrial Tools Ltd', 'Dave Miller', '+1 (555) 567-8901', 'dave@titantools.com', '12 Toolmaker Way', 60, 3400.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Customers (Retail & Contractors with Credit Lines)
INSERT INTO customers (id, name, phone, email, address, customer_type, credit_limit, current_balance, payment_terms_days) VALUES
('c1000000-0000-0000-0000-000000000001', 'Walk-in Retail Customer', '+1 (000) 000-0000', 'cashier@hardware.com', 'In Store', 'retail', 0.00, 0.00, 0),
('c1000000-0000-0000-0000-000000000002', 'Horizon Builders & Construction', '+1 (555) 789-0123', 'accounts@horizonbuilders.com', 'Site 44, Metro Highway', 'contractor', 10000.00, 3240.50, 30),
('c1000000-0000-0000-0000-000000000003', 'SparkRight Electrical Works', '+1 (555) 890-1234', 'mark@sparkright.com', '21 Elm St, Downtown', 'contractor', 4000.00, 860.00, 15),
('c1000000-0000-0000-0000-000000000004', 'ProFix Plumbing Services', '+1 (555) 901-2345', 'jason@profixplumbing.com', 'Unit 8, Riverside Trade Park', 'contractor', 3500.00, 1420.00, 30),
('c1000000-0000-0000-0000-000000000005', 'Greenfield Renovation Co.', '+1 (555) 123-4567', 'sarah@greenfieldreno.com', '77 Oak Ridge Blvd', 'contractor', 6000.00, 480.00, 30)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Products (with UoM, Bin/Aisle, Cost, Retail, and Contractor Prices)
INSERT INTO products (id, sku, barcode, name, category_id, brand, specifications, unit_of_measure, cost_price, retail_price, contractor_price, current_stock, min_reorder_level, aisle_bin_location, supplier_id) VALUES
-- Plumbing
('d1000000-0000-0000-0000-000000000001', 'PLM-PVC-050', '89012345001', 'PVC Pressure Pipe 1/2" Class 9', 'a1000000-0000-0000-0000-000000000001', 'Durapipe', '1/2" x 4m length', 'meter', 1.20, 2.50, 1.95, 145.500, 30.000, 'Aisle 1, Rack A, Bay 1', 'b1000000-0000-0000-0000-000000000002'),
('d1000000-0000-0000-0000-000000000002', 'PLM-VAL-050', '89012345002', 'Heavy Duty Brass Ball Valve 1/2"', 'a1000000-0000-0000-0000-000000000001', 'ValvPro', '1/2" Female Threaded', 'piece', 4.50, 8.50, 6.80, 42.000, 15.000, 'Aisle 1, Shelf B, Bin 4', 'b1000000-0000-0000-0000-000000000002'),
('d1000000-0000-0000-0000-000000000003', 'PLM-ELB-075', '89012345003', 'PVC 90° Elbow 3/4"', 'a1000000-0000-0000-0000-000000000001', 'Durapipe', '3/4" Solvent Socket', 'piece', 0.40, 1.10, 0.85, 120.000, 25.000, 'Aisle 1, Shelf C, Bin 12', 'b1000000-0000-0000-0000-000000000002'),
('d1000000-0000-0000-0000-000000000004', 'PLM-TEF-010', '89012345004', 'PTFE Thread Seal Teflon Tape', 'a1000000-0000-0000-0000-000000000001', 'SealMax', '12mm x 10m x 0.075mm', 'piece', 0.35, 1.20, 0.80, 8.000, 20.000, 'Aisle 1, Shelf A, Bin 2', 'b1000000-0000-0000-0000-000000000002'),

-- Electrical
('d1000000-0000-0000-0000-000000000005', 'ELE-WIR-250', '89012345005', 'Twin & Earth Cable 2.5mm Copper', 'a1000000-0000-0000-0000-000000000002', 'VoltMaster', '2.5mm² Grey Sheathed', 'meter', 1.15, 2.20, 1.75, 88.000, 50.000, 'Aisle 2, Spool Rack 3', 'b1000000-0000-0000-0000-000000000003'),
('d1000000-0000-0000-0000-000000000006', 'ELE-BRK-016', '89012345006', 'Miniature Circuit Breaker (MCB) 16A', 'a1000000-0000-0000-0000-000000000002', 'SchneiderX', 'Single Pole Type B 6kA', 'piece', 3.80, 7.50, 5.90, 28.000, 10.000, 'Aisle 2, Shelf B, Bin 8', 'b1000000-0000-0000-0000-000000000003'),
('d1000000-0000-0000-0000-000000000007', 'ELE-BULB-012', '89012345007', 'LED Bulb 12W DayLight E27', 'a1000000-0000-0000-0000-000000000002', 'LumiGlow', '6500K Cool DayLight 1200lm', 'piece', 1.80, 4.20, 3.20, 65.000, 15.000, 'Aisle 2, Shelf D, Bin 1', 'b1000000-0000-0000-0000-000000000003'),

-- Fasteners (Units: box, kg, piece)
('d1000000-0000-0000-0000-000000000008', 'FST-DRY-125', '89012345008', 'Black Phosphate Drywall Screws #6', 'a1000000-0000-0000-0000-000000000003', 'ApexFast', '3.5 x 32mm (Box of 500)', 'box', 4.50, 9.00, 7.20, 14.000, 10.000, 'Aisle 3, Shelf A, Bin 15', 'b1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000009', 'FST-BLT-M08', '89012345009', 'Stainless Steel Hex Bolt & Nut M8', 'a1000000-0000-0000-0000-000000000003', 'ApexFast', 'M8 x 50mm Grade 304', 'piece', 0.25, 0.70, 0.50, 450.000, 100.000, 'Aisle 3, Bin Carousel 7', 'b1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000010', 'FST-NAL-030', '89012345010', 'Fluted Steel Concrete Nails 3"', 'a1000000-0000-0000-0000-000000000003', 'ApexFast', '75mm Hardened Steel', 'kg', 2.10, 4.50, 3.40, 35.500, 15.000, 'Aisle 3, Bulk Floor Tub 2', 'b1000000-0000-0000-0000-000000000001'),

-- Tools
('d1000000-0000-0000-0000-000000000011', 'TOL-DRL-020', '89012345011', 'Brushless 20V Cordless Hammer Drill', 'a1000000-0000-0000-0000-000000000004', 'TitanForce', '2x 4.0Ah Li-ion + Charger Kit', 'piece', 85.00, 149.00, 125.00, 6.000, 3.000, 'Aisle 4, Display Case A', 'b1000000-0000-0000-0000-000000000004'),
('d1000000-0000-0000-0000-000000000012', 'TOL-HAM-016', '89012345012', 'Fiberglass Claw Hammer 16oz', 'a1000000-0000-0000-0000-000000000004', 'TitanForce', 'Anti-vibe comfort rubber grip', 'piece', 6.50, 14.50, 11.50, 18.000, 5.000, 'Aisle 4, Wall Rack 2', 'b1000000-0000-0000-0000-000000000004'),
('d1000000-0000-0000-0000-000000000013', 'TOL-TAP-008', '89012345013', 'Heavy Duty Measuring Tape 8m / 26ft', 'a1000000-0000-0000-0000-000000000004', 'ProRule', 'Nylon coated 28mm wide blade', 'piece', 4.00, 9.99, 7.50, 22.000, 8.000, 'Aisle 4, Counter Endcap', 'b1000000-0000-0000-0000-000000000004'),

-- Building Materials
('d1000000-0000-0000-0000-000000000014', 'BLD-CEM-050', '89012345014', 'Portland Cement 50kg', 'a1000000-0000-0000-0000-000000000006', 'UltraCrete', 'Grade 42.5R All-purpose', 'bag', 6.80, 9.50, 8.20, 85.000, 20.000, 'Yard / Pallet Bay 1', 'b1000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Customer Ledger History (for Contractors)
INSERT INTO customer_ledger (id, customer_id, transaction_type, invoice_number, debit, credit, balance_after, payment_method, notes, created_at) VALUES
('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'invoice', 'INV-2026-0089', 2450.00, 0.00, 2450.00, 'credit', 'Plumbing & electrical supplies for commercial site', now() - interval '25 days'),
('e1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'payment', NULL, 0.00, 1000.00, 1450.00, 'bank_transfer', 'Partial payment via Wire #WT9921', now() - interval '10 days'),
('e1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'invoice', 'INV-2026-0104', 1790.50, 0.00, 3240.50, 'credit', 'Cement bags and cordless power tools', now() - interval '2 days'),
('e1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 'invoice', 'INV-2026-0092', 1420.00, 0.00, 1420.00, 'credit', 'Copper wire spools and brass valves', now() - interval '38 days')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Recent Expenses
INSERT INTO expenses (id, category, amount, payment_method, paid_to, description, receipt_ref, created_at) VALUES
('f1000000-0000-0000-0000-000000000001', 'utilities', 145.00, 'cash_drawer', 'City Electric Co.', 'Monthly shop power bill', 'ELEC-9912', now() - interval '3 days'),
('f1000000-0000-0000-0000-000000000002', 'freight_transport', 65.00, 'cash_drawer', 'Express Trucking', 'Freight delivery surcharge for cement pallets', 'TRK-441', now() - interval '1 day'),
('f1000000-0000-0000-0000-000000000003', 'tea_refreshment', 18.50, 'cash_drawer', 'Corner Bakery & Cafe', 'Staff refreshments & client tea', 'CSH-102', now() - interval '4 hours')
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Today’s Cash Register Session
INSERT INTO cash_drawer_sessions (id, opened_by, opened_at, opening_float, cash_sales_total, cash_expenses_total, expected_cash, status) VALUES
('f2000000-0000-0000-0000-000000000001', 'Alex (Morning Cashier)', now() - interval '6 hours', 200.00, 840.00, 83.50, 956.50, 'open')
ON CONFLICT (id) DO NOTHING;
