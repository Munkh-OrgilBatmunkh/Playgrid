import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(
  url && key && !url.includes('YOUR-PROJECT-REF'),
)

// Түлхүүр тавиагүй үед ч апп унахгүй (placeholder холболт үүснэ), харин дэлгэц дээр анхааруулга гарна.
export const supabase = createClient(
  isConfigured ? url : 'https://vrftiofxyorbtoezsync.supabase.co',
  isConfigured ? key : 'sb_publishable_XSN9iJe_ulR6SXzlayQKpg_1bjYf-Ky',
)
