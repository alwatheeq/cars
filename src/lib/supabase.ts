import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on your schema
export interface Company {
  id: number
  name: string
  tagline: string | null
  logo_url: string | null
  theme: any | null
  created_at: string | null
  updated_at: string | null
}

export interface User {
  id: string
  phone_number: string
  full_name: string
  company_id: number
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  place_id?: string | null
  address_components?: any | null
  created_at: string | null
  updated_at: string | null
  verified?: string | null
}

export interface AuthUser {
  email: string
  password: string
  full_name: string
  phone_number: string
  company_id: number
}