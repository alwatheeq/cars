import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Edit3,
  Shield, 
  ShieldCheck, 
  LogOut, 
  Settings,
  Bell,
  Calendar,
  BarChart3,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Home
} from 'lucide-react';
import { supabase, User as UserType, Company } from '../../lib/supabase';
import AddressEditor from './AddressEditor';

interface DashboardProps {
  user: any; // Supabase auth user
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddressEditor, setShowAddressEditor] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setUserProfile(profileData);

        // Fetch company data
        if (profileData?.company_id) {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profileData.company_id)
            .single();

          if (companyError) throw companyError;
          setCompany(companyData);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onLogout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getVerificationStatus = () => {
    if (!userProfile?.verified) {
      return {
        status: 'unverified',
        icon: AlertCircle,
        text: 'Not Verified',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }
    
    if (userProfile.verified === 'pending') {
      return {
        status: 'pending',
        icon: Clock,
        text: 'Verification Pending',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    }
    
    return {
      status: 'verified',
      icon: CheckCircle,
      text: 'Verified',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
  };

  const handleAddressSave = (newAddress: string) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, address: newAddress });
    }
    setShowAddressEditor(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const verificationInfo = getVerificationStatus();
  const VerificationIcon = verificationInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {company?.logo_url ? (
                  <img 
                    src={company.logo_url} 
                    alt={company.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                  <p className="text-sm text-gray-500">{company?.name}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {userProfile?.full_name}!
          </h2>
          <p className="text-gray-600">
            Here's what's happening with your account today.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Verification Status */}
          <div className={`${verificationInfo.bgColor} ${verificationInfo.borderColor} border rounded-xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Account Status</p>
                <p className={`text-lg font-semibold ${verificationInfo.color}`}>
                  {verificationInfo.text}
                </p>
              </div>
              <VerificationIcon className={`w-8 h-8 ${verificationInfo.color}`} />
            </div>
          </div>

          {/* Company Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Company</p>
                <p className="text-lg font-semibold text-blue-900">
                  {company?.name || 'Not Set'}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Email Status */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg font-semibold text-green-900">
                  {user.email_confirmed_at ? 'Confirmed' : 'Pending'}
                </p>
              </div>
              <Mail className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Account Age */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Member Since</p>
                <p className="text-lg font-semibold text-purple-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-lg text-gray-900">{userProfile?.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                    <p className="text-lg text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone Number</p>
                    <p className="text-lg text-gray-900">{userProfile?.phone_number}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      {userProfile?.address ? (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(userProfile.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer inline-flex items-center group"
                          title="Get directions to this address"
                        >
                          {userProfile.address}
                          <svg 
                            className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        <p className="text-lg text-gray-900">No address set</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddressEditor(true)}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit address"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                </div>

                {company && (
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      {company.logo_url ? (
                        <img 
                          src={company.logo_url} 
                          alt={company.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Company</p>
                      <p className="text-lg text-gray-900">{company.name}</p>
                      {company.tagline && (
                        <p className="text-sm text-gray-600">{company.tagline}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Verification Card */}
            {userProfile?.verified !== 'verified' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Verification</h3>
                <div className={`${verificationInfo.bgColor} ${verificationInfo.borderColor} border rounded-lg p-4 mb-4`}>
                  <div className="flex items-center space-x-3">
                    <VerificationIcon className={`w-6 h-6 ${verificationInfo.color}`} />
                    <div>
                      <p className={`font-medium ${verificationInfo.color}`}>
                        {verificationInfo.text}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {userProfile?.verified === 'pending' 
                          ? 'Your verification is being processed'
                          : 'Complete verification to access all features'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                {userProfile?.verified !== 'pending' && (
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Start Verification
                  </button>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Account Created</span>
                  <span className="font-medium text-gray-900">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Sign In</span>
                  <span className="font-medium text-gray-900">
                    {user.last_sign_in_at 
                      ? new Date(user.last_sign_in_at).toLocaleDateString()
                      : 'First time'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Email Confirmed</span>
                  <span className={`font-medium ${user.email_confirmed_at ? 'text-green-600' : 'text-red-600'}`}>
                    {user.email_confirmed_at ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Address Editor Modal */}
      {showAddressEditor && (
        <AddressEditor
          userId={user.id}
          currentAddress={userProfile?.address || ''}
          onSave={handleAddressSave}
          onCancel={() => setShowAddressEditor(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;