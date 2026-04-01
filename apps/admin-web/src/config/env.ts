/**
 * Vite exposes env vars prefixed with VITE_.
 * TODO: Add @supabase/supabase-js and createClient when connecting the Supabase project.
 */
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
export const hideAdminSidebar = String(import.meta.env.VITE_ADMIN_HIDE_SIDEBAR ?? "").toLowerCase() === "true";
