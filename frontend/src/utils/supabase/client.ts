import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton: garante que apenas UMA instância do cliente exista no browser.
// Múltiplas instâncias competem pelo lock do auth token, causando o erro:
// "Lock was released because another request stole it"
let supabaseInstance: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabaseInstance;
}
