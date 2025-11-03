'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, User, Briefcase, MapPin, DollarSign, Building2, X } from 'lucide-react';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

interface Skill {
  id: string;
  skillName: string;
}

interface JobSkill {
  id: string;
  skill: Skill;
}

interface JobProviderProfile {
  companyName: string;
  companyDescription: string | null;
}

interface Job {
  id: string;
  title: string;
  description: string;
  pay: number;
  employmentType: 'PER_DAY' | 'PER_PROJECT';
  location: string;
  duration: string | null;
  status: 'OPEN' | 'CLOSED';
  requiredSkills: JobSkill[];
  jobProviderProfile: JobProviderProfile;
  createdAt: string;
}

interface Application {
  id: string;
  jobId: string;
  status: string;
  appliedAt: string;
  job: Job;
}

export default function MyApplicationsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: Application[] }>('/api/applicant/applications');
      
      if (response.data.success) {
        setApplications(response.data.data);
      }
    } catch (error: any) {
      // 404 is expected if user hasn't created profile yet
      if (error.response?.status === 404) {
        setApplications([]); // Just show empty state
      } else {
        setErrorMessage('Failed to load applications');
        console.error('Load error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm('Are you sure you want to withdraw this application?')) {
      return;
    }

    try {
      setWithdrawing(applicationId);
      const response = await api.delete(`/api/applications/${applicationId}`);
      
      if (response.data.success) {
        setSuccessMessage('Application withdrawn successfully');
        loadApplications();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to withdraw application');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setWithdrawing(null);
    }
  };

  const handleLogout = () => {
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/applicant/profile')}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-full transition flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              My Profile
            </button>
            <button
              onClick={() => router.push('/feed')}
              className="px-6 py-2 text-sm bg-black text-white rounded-full hover:bg-gray-800 transition"
            >
              Job Feed
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-full transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl shadow-sm">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm">
            {errorMessage}
          </div>
        )}

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-600 mb-6">Start browsing jobs and apply to begin your journey</p>
            <button
              onClick={() => router.push('/feed')}
              className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all hover:scale-105 shadow-lg font-semibold inline-flex items-center gap-2"
            >
              <Briefcase className="w-5 h-5" />
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div
                key={app.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Company */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{app.job.jobProviderProfile.companyName}</h4>
                        <p className="text-xs text-gray-500">
                          Applied {new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Job Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{app.job.title}</h3>

                    {/* Job Details */}
                    <div className="flex flex-wrap gap-3 mb-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold">₹{app.job.pay.toLocaleString()}</span>
                        <span className="text-xs">/{app.job.employmentType === 'PER_DAY' ? 'day' : 'project'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                        <MapPin className="w-4 h-4 text-red-600" />
                        {app.job.location}
                      </div>
                      {app.job.duration && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                          {app.job.duration}
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {app.job.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {app.job.requiredSkills.map(skill => (
                          <span
                            key={skill.id}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {skill.skill.skillName}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Status */}
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        app.job.status === 'OPEN'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {app.job.status}
                    </span>
                  </div>

                  {/* Withdraw Button */}
                  <button
                    onClick={() => handleWithdraw(app.id)}
                    disabled={withdrawing === app.id}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-full hover:bg-red-700 flex items-center gap-2 disabled:bg-gray-400 transition-all hover:scale-105"
                  >
                    {withdrawing === app.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Withdrawing...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        Withdraw
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

