import { createClient } from '@supabase/supabase-js'
import { config } from '../config'

const safeUrl = config.supabaseUrl || 'https://placeholder.supabase.co'
const safeKey = config.supabaseAnonKey || 'placeholder'

export const supabase = createClient(safeUrl, safeKey)
