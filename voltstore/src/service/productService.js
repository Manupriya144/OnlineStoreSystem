import { supabase } from "../lib/supabaseClient";

export async function getActiveProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories(id, name, slug),
      brands(id, name, slug),
      product_images(id, image_path, is_primary),
      product_specs(id, spec_name, spec_value)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getProductBySlug(slug) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories(id, name, slug),
      brands(id, name, slug),
      product_images(id, image_path, is_primary),
      product_specs(id, spec_name, spec_value)
    `)
    .eq("slug", slug)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");

  if (error) throw new Error(error.message);

  return data;
}