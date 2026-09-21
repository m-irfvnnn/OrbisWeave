'use client'

import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/firebase'
import type { Database } from '@/lib/supabase/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required public Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => auth.currentUser?.getIdToken() ?? null,
})
