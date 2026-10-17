import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  'https://rtlhckntjrhdhbaqzxoy.supabase.co',
  'sb_publishable_Ayy3iLaAoQcTu0Kr0tQGbg_LUEFF7O8'
)
// Auto sign-in test patient for demo
supabase.auth.signInWithPassword({
  email: 'amina@patient.epi',
  password: 'Patient123!'
}).catch(() => {/* silent fail in demo */})
