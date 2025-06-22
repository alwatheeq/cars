import React from 'react'
import { Building2, ChevronDown } from 'lucide-react'
import { Company } from '../../lib/supabase'

interface CompanySelectorProps {
  companies: Company[]
  selectedCompanyId: number | null
  onCompanySelect: (companyId: number) => void
  error?: string
  loading?: boolean
}

const CompanySelector: React.FC<CompanySelectorProps> = ({
  companies,
  selectedCompanyId,
  onCompanySelect,
  error,
  loading
}) => {
  const selectedCompany = companies.find(c => c.id === selectedCompanyId)

  return (
    <div className="relative">
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <select
          value={selectedCompanyId || ''}
          onChange={(e) => onCompanySelect(Number(e.target.value))}
          disabled={loading}
          className={`w-full pl-12 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white appearance-none cursor-pointer ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="" disabled>
            {loading ? 'Loading companies...' : 'Select your company'}
          </option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
              {company.tagline && ` - ${company.tagline}`}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
      </div>
      
      {selectedCompany && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            {selectedCompany.logo_url ? (
              <img 
                src={selectedCompany.logo_url} 
                alt={selectedCompany.name}
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{selectedCompany.name}</p>
              {selectedCompany.tagline && (
                <p className="text-sm text-gray-600">{selectedCompany.tagline}</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600 animate-fadeIn">{error}</p>
      )}
    </div>
  )
}

export default CompanySelector