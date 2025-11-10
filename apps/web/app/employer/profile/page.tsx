'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Save, Edit2, Trash2, Loader2, LogOut, Briefcase } from 'lucide-react';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

interface JobProviderProfile {
  id: string;
  userId: string;
  companyName: string;
  companyDescription: string | null;
  companyWebsite: string | null;
  contactInfo: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  companyName: string;
  companyDescription: string;
  companyWebsite: string;
  contactInfo: string;
}

export default function EmployerProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [profileExists, setProfileExists] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    companyDescription: '',
    companyWebsite: '',
    contactInfo: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async (): Promise<void> => {
    try {
      setLoading(true);
      
      try {
        const profileRes = await api.get<{ success: boolean; data: JobProviderProfile }>('/api/employer/profile');
        if (profileRes.data.success && profileRes.data.data) {
          const profile = profileRes.data.data;
          setProfileExists(true);
          setFormData({
            companyName: profile.companyName || '',
            companyDescription: profile.companyDescription || '',
            companyWebsite: profile.companyWebsite || '',
            contactInfo: profile.contactInfo || ''
          });
        } else {
          setIsEditing(true);
        }
      } catch (err: any) {
        // 404 is expected for new users - silently handle it
        if (err.response?.status === 404) {
          setIsEditing(true);
        } else {
          console.error('Error loading profile:', err);
          throw err;
        }
      }
    } catch (error: any) {
      setErrorMessage('Failed to load profile');
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      if (!formData.companyName.trim()) {
        setErrorMessage('Company name is required');
        return;
      }
      
      if (formData.companyName.length > 200) {
        setErrorMessage('Company name is too long (max 200 characters)');
        return;
      }
      
      if (formData.companyWebsite && !formData.companyWebsite.startsWith('http')) {
        setErrorMessage('Company website must be a valid URL (starting with http:// or https://)');
        return;
      }

      const payload = {
        companyName: formData.companyName,
        companyDescription: formData.companyDescription || undefined,
        companyWebsite: formData.companyWebsite || undefined,
        contactInfo: formData.contactInfo || undefined
      };

      let response;
      if (profileExists) {
        response = await api.put<{ success: boolean; message: string }>('/api/employer/profile', payload);
      } else {
        response = await api.post<{ success: boolean; message: string }>('/api/employer/profile', payload);
        setProfileExists(true);
      }

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to save profile');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const response = await api.delete<{ success: boolean; message: string }>('/api/employer/profile');
      
      if (response.data.success) {
        setSuccessMessage('Profile deleted successfully');
        setTimeout(() => {
          logout();
          router.push('/');
        }, 1500);
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to delete profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = (): void => {
    logout();
    router.push('/signin');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employer Profile</h1>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/employer/jobs')}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              My Jobs
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Messages */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        {profileExists && !isEditing && (
          <div className="mb-6 flex gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 disabled:bg-gray-400"
            >
              <Trash2 className="w-4 h-4" />
              Delete Profile
            </button>
          </div>
        )}

        {/* Company Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Company Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Enter your company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Description
              </label>
              <textarea
                value={formData.companyDescription}
                onChange={(e) => setFormData({ ...formData, companyDescription: e.target.value })}
                disabled={!isEditing}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Describe your company and what you do"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Website
              </label>
              <input
                type="url"
                value={formData.companyWebsite}
                onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="https://www.example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Information
              </label>
              <input
                type="text"
                value={formData.contactInfo}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Phone number or email for inquiries"
              />
            </div>
          </div>
        </div>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            {profileExists && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  loadProfile();
                }}
                disabled={saving}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

