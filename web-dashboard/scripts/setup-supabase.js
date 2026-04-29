const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

/**
 * SETUP SCRIPT FOR VULTACORE STORAGE
 * This script creates the 'avatars' bucket and sets up public access policies.
 * 
 * REQUIRES: SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is missing from .env.local");
  console.log("Please add your Service Role Key from Project Settings > API to .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setup() {
  console.log("🚀 Starting VultaCore Storage Setup...");

  // 1. Create the bucket
  const { data: bucket, error: bucketError } = await supabase.storage.createBucket('avatars', {
    public: true,
    allowedMimeTypes: ['image/*'],
    fileSizeLimit: 5242880 // 5MB
  });

  if (bucketError) {
    if (bucketError.message.includes('already exists')) {
      console.log("✅ Bucket 'avatars' already exists.");
    } else {
      console.error("❌ Failed to create bucket:", bucketError.message);
    }
  } else {
    console.log("✅ Created bucket 'avatars'.");
  }

  // Note: Policies are usually set via SQL in the dashboard for better security control.
  // However, with the service role key, we can now upload/download files.
  
  console.log("\n✨ Storage setup complete!");
  console.log("Next Step: Ensure you have added RLS policies in the Supabase Dashboard to allow users to update their own folders.");
}

setup();
