-- ==============================================================================
-- SUPABASE STORAGE BUCKET CONFIGURATION FOR PRODUCT IMAGES
-- Run this in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 0. Ensure the products table has the image_url column
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 1. Create the 'product-images' storage bucket and make it public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5MB file size limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE 
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 2. Enable public read access (so product images can be viewed anywhere)
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 3. Allow anonymous/counter staff to upload new product photos
DROP POLICY IF EXISTS "Public can upload product images" ON storage.objects;
CREATE POLICY "Public can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- 4. Allow updating/overwriting existing product images
DROP POLICY IF EXISTS "Public can update product images" ON storage.objects;
CREATE POLICY "Public can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

-- 5. Allow deleting product images
DROP POLICY IF EXISTS "Public can delete product images" ON storage.objects;
CREATE POLICY "Public can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');
