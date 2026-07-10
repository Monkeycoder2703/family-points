import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[FamilyPoints] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY fehlen. ' +
      'Lege eine .env-Datei an (siehe .env.example) oder setze die GitHub-Actions-Secrets.'
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')
