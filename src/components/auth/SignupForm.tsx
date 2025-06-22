import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Github, Chrome, Check, X, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompanies } from '../../hooks/useCompanies';
import CompanySelector from './CompanySelector';

const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyId: null as number | null,
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const { companies, loading: companiesLoading, error: companiesError } = useCompanies();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return { text: 'Very Weak', color: 'text-red-500' };
      case 2: return { text: 'Weak', color: 'text-orange-500' };
      case 3: return { text: 'Good', color: 'text-yellow-500' };
      case 4: return { text: 'Strong', color: 'text-green-500' };
      case 5: return { text: 'Very Strong', color: 'text-green-600' };
      default: return { text: '', color: '' };
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordStrengthInfo = getPasswordStrengthText(passwordStrength);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 3) {
      newErrors.password = 'Password is too weak';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.companyId) {
      newErrors.companyId = 'Please select a company';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            company_id: formData.companyId
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile in public.users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            company_id: formData.companyId!
          });

        if (profileError) throw profileError;

        // Success - the auth state change will be handled by App.tsx
        console.log('Account created successfully:', authData.user);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to create account. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySelect = (companyId: number) => {
    setFormData(prev => ({ ...prev, companyId }));
    if (errors.companyId) {
      setErrors(prev => ({ ...prev, companyId: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Full Name Field */}
      <div className="relative">
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white ${
              errors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
          />
        </div>
        {errors.fullName && (
          <p className="mt-2 text-sm text-red-600 animate-fadeIn">{errors.fullName}</p>
        )}
      </div>

      {/* Phone Number Field */}
      <div className="relative">
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white ${
              errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your phone number"
          />
        </div>
        {errors.phoneNumber && (
          <p className="mt-2 text-sm text-red-600 animate-fadeIn">{errors.phoneNumber}</p>
        )}
      </div>

      {/* Email Field */}
      <div className="relative">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white ${
              errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email"
          />
        </div>
        {errors.email && (
          <p className="mt-2 text-sm text-red-600 animate-fadeIn">{errors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="relative">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white ${
              errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Create a password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Password Strength Indicator */}
        {formData.password && (
          <div className="mt-2">
            <div className="flex space-x-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                    i < passwordStrength
                      ? passwordStrength <= 2
                        ? 'bg-red-500'
                        : passwordStrength <= 3
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                ></div>
              ))}
            </div>
            <p className={`text-xs ${passwordStrengthInfo.color}`}>
              {passwordStrengthInfo.text}
            </p>
          </div>
        )}
        
        {errors.password && (
          <p className="mt-2 text-sm text-red-600 animate-fadeIn">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="relative">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white ${
              errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Password Match Indicator */}
        {formData.confirmPassword && (
          <div className="mt-2 flex items-center">
            {formData.password === formData.confirmPassword ? (
              <div className="flex items-center text-green-600">
                <Check className="w-4 h-4 mr-1" />
                <span className="text-xs">Passwords match</span>
              </div>
            ) : (
              <div className="flex items-center text-red-500">
                <X className="w-4 h-4 mr-1" />
                <span className="text-xs">Passwords don't match</span>
              </div>
            )}
          </div>
        )}
        
        {errors.confirmPassword && (
          <p className="mt-2 text-sm text-red-600 animate-fadeIn">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Company Selection */}
      <CompanySelector
        companies={companies}
        selectedCompanyId={formData.companyId}
        onCompanySelect={handleCompanySelect}
        error={errors.companyId}
        loading={companiesLoading}
      />
      
      {companiesError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">
            Failed to load companies: {companiesError}
          </p>
        </div>
      )}

      {/* Terms and Conditions */}
      <div className="relative">
        <label className="flex items-start">
          <input
            type="checkbox"
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1"
          />
          <span className="ml-2 text-sm text-gray-600">
            I agree to the{' '}
            <button type="button" className="text-blue-600 hover:text-blue-700 hover:underline">
              Terms of Service
            </button>{' '}
            and{' '}
            <button type="button" className="text-blue-600 hover:text-blue-700 hover:underline">
              Privacy Policy
            </button>
          </span>
        </label>
        {errors.agreeToTerms && (
          <p className="mt-2 text-sm text-red-600 animate-fadeIn">{errors.agreeToTerms}</p>
        )}
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Creating account...
          </div>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
};

export default SignupForm;