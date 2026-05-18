import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/features/admin/schedule/lib/database.types";

const getEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return { url, anonKey };
};

export const supabase = (() => {
  const { url, anonKey } = getEnv();
  return createBrowserClient<any>(url, anonKey);
})();
