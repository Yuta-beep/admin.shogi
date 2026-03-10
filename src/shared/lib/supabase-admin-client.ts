import { createClient, SupabaseClient } from "@supabase/supabase-js";

type GenericSchema = {
  Tables: Record<string, unknown>;
  Views: Record<string, unknown>;
  Functions: Record<string, unknown>;
  Enums: Record<string, unknown>;
  CompositeTypes: Record<string, unknown>;
};

type AdminDatabase = {
  public: GenericSchema;
  master: GenericSchema;
  game: GenericSchema;
};

let cached: SupabaseClient<AdminDatabase> | null = null;

export function getSupabaseAdminClient() {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("SUPABASE_URL is required");
  }
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  }

  cached = createClient<AdminDatabase>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}
