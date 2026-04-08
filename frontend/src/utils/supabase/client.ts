import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Cria o client do Supabase usando as variáveis do .env conectando o SSR para evitar loop
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
