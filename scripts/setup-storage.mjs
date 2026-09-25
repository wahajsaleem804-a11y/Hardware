// ==============================================================================
// Script to programmatically create and configure the Supabase Storage Bucket
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY="your-service-key" node scripts/setup-storage.mjs
// ==============================================================================

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 1. Read environment variables from .env.local
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim();
      if (key === "NEXT_PUBLIC_SUPABASE_URL" && !supabaseUrl) supabaseUrl = val;
      if (key === "SUPABASE_SERVICE_ROLE_KEY" && !serviceKey) serviceKey = val;
    }
  }
}

if (!supabaseUrl || !serviceKey) {
  console.error("❌ Error: Missing credentials.");
  console.log("To create storage buckets from code, Supabase requires the admin service role key.");
  console.log("Please run:");
  console.log('SUPABASE_SERVICE_ROLE_KEY="your_service_role_key" node scripts/setup-storage.mjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

async function setupBucket() {
  console.log(`Connecting to: ${supabaseUrl}`);
  const bucketName = "product-images";

  // Check if bucket already exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("❌ Failed to list buckets:", listError.message);
    process.exit(1);
  }

  const existing = buckets.find((b) => b.name === bucketName);
  if (existing) {
    console.log(`✅ Bucket "${bucketName}" already exists!`);
    return;
  }

  // Create the bucket programmatically
  console.log(`Creating public bucket "${bucketName}"...`);
  const { data, error } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ],
  });

  if (error) {
    console.error("❌ Failed to create bucket:", error.message);
    process.exit(1);
  }

  console.log(`🎉 Successfully created bucket "${bucketName}" via code!`);
  console.log("Product photos will now upload directly to Supabase Storage.");
}

setupBucket();
