import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required public Supabase environment variables')
}

const configuredSupabaseUrl: string = supabaseUrl
const configuredSupabaseAnonKey: string = supabaseAnonKey

/**
 * Creates a request-scoped server client. Pass the Firebase ID token from the
 * incoming request so Supabase can verify it and apply the caller's RLS rules.
 */
export function createServerSupabaseClient(firebaseIdToken: string | null = null) {
  return createClient<Database>(configuredSupabaseUrl, configuredSupabaseAnonKey, {
    accessToken: async () => firebaseIdToken,
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}
