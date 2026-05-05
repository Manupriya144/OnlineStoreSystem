import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getProductImageUrl = (path) => {
  if (!path) return null;

  const { data } = supabase.storage
    .from("products")
    .getPublicUrl(path);

  return data.publicUrl;
};