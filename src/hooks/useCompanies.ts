import { useState, useEffect } from 'react'
import { supabase, Company } from '../lib/supabase'

export const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('name')

        if (error) throw error
        setCompanies(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch companies')
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  return { companies, loading, error }
}