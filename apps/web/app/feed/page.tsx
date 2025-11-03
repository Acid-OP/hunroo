'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, DollarSign, Briefcase, Building2, Filter, ChevronDown, LogOut, User } from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

interface Skill {
  id: string;
  skillName: string;
  requiresCertificate: boolean;
}

interface JobSkill {
  id: string;
  skillId: string;
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

interface Filters {
  location: string;
  pay_min: string;
  pay_max: string;
  employmentType: string;
  skills: string[];
  sort: string;
}

export default function JobFeedPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [filters, setFilters] = useState<Filters>({
    location: '',
    pay_min: '',
    pay_max: '',
    employmentType: '',
    skills: [],
    sort: 'recent'
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load available skills
      const skillsRes = await api.get<{ success: boolean; data: Skill[] }>('/api/skills');
      if (skillsRes.data.success) {
        setAvailableSkills(skillsRes.data.data);
      }

      // Load jobs with filters
      await loadJobs();

      // Load user's applications if authenticated
      if (user?.role === 'JOB_SEEKER') {
        try {
          const appsRes = await api.get<{ success: boolean; data: any[] }>('/api/applicant/applications');
          if (appsRes.data.success) {
            const jobIds = new Set(appsRes.data.data.map(app => app.jobId));
            setAppliedJobs(jobIds);
          }
      } catch {
        // User might not have a profile yet
      }
      }
    } catch (error: any) {
      setErrorMessage('Failed to load jobs');
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.location) params.append('location', filters.location);
      if (filters.pay_min) params.append('pay_min', filters.pay_min);
      if (filters.pay_max) params.append('pay_max', filters.pay_max);
      if (filters.employmentType) params.append('employmentType', filters.employmentType);
      if (filters.skills.length > 0) params.append('skills', filters.skills.join(','));
      if (filters.sort && filters.sort !== 'recent') params.append('sort', filters.sort);

      const jobsRes = await api.get<{ success: boolean; data: Job[] }>(`/api/jobs?${params.toString()}`);
      if (jobsRes.data.success) {
        setJobs(jobsRes.data.data);
      }
    } catch (error: any) {
      console.error('Load jobs error:', error);
    }
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
    loadJobs();
  };

  const handleClearFilters = () => {
    setFilters({
      location: '',
      pay_min: '',
      pay_max: '',
      employmentType: '',
      skills: [],
      sort: 'recent'
    });
    setShowFilters(false);
  };

  const toggleSkillFilter = (skillId: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter(id => id !== skillId)
        : [...prev.skills, skillId]
    }));
  };

  const handleApply = async (jobId: string) => {
    if (!user) {
      router.push('/signin');
      return;
    }

    if (user.role !== 'JOB_SEEKER') {
      setErrorMessage('Only job seekers can apply to jobs');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    try {
      setApplying(jobId);
      const response = await api.post('/api/applications', { jobId });
      
      if (response.data.success) {
        setSuccessMessage('Application submitted successfully!');
        setAppliedJobs(prev => new Set([...prev, jobId]));
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to apply');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setApplying(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const activeFiltersCount = [
    filters.location,
    filters.pay_min,
    filters.pay_max,
    filters.employmentType,
    filters.skills.length > 0
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <nav className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Job Feed</h1>
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              {jobs.length} Jobs
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'JOB_SEEKER' && (
              <>
                <button
                  onClick={() => router.push('/applicant/profile')}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-full transition flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>
                <button
                  onClick={() => router.push('/applicant/applications')}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-full transition"
                >
                  My Applications
                </button>
              </>
            )}
            {user?.role === 'JOB_PROVIDER' && (
              <button
                onClick={() => router.push('/employer/jobs')}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-full transition"
              >
                My Jobs
              </button>
            )}
            {user ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-full transition flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push('/signin')}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-full transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/signup')}
                  className="px-6 py-2 text-sm bg-black text-white rounded-full hover:bg-gray-800 transition"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl animate-slide-up">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-slide-up">
            {errorMessage}
          </div>
        )}

        {/* Filter Bar */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                <select
                  value={filters.sort}
                  onChange={(e) => {
                    setFilters({ ...filters, sort: e.target.value });
                    loadJobs();
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="pay_desc">Highest Pay</option>
                  <option value="pay_asc">Lowest Pay</option>
                </select>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-down">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    placeholder="Enter city or area"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Pay (₹)</label>
                  <input
                    type="number"
                    value={filters.pay_min}
                    onChange={(e) => setFilters({ ...filters, pay_min: e.target.value })}
                    placeholder="Min amount"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Pay (₹)</label>
                  <input
                    type="number"
                    value={filters.pay_max}
                    onChange={(e) => setFilters({ ...filters, pay_max: e.target.value })}
                    placeholder="Max amount"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                  <select
                    value={filters.employmentType}
                    onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="PER_DAY">Per Day</option>
                    <option value="PER_PROJECT">Per Project</option>
                  </select>
                </div>

                <div className="md:col-span-2 lg:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSkills.map(skill => (
                      <button
                        key={skill.id}
                        onClick={() => toggleSkillFilter(skill.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                          filters.skills.includes(skill.id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {skill.skillName}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-4 flex gap-3 pt-2">
                  <button
                    onClick={handleApplyFilters}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Jobs Grid */}
        {jobs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {jobs.map(job => (
              <div
                key={job.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                <div className="p-6">
                  {/* Company Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{job.jobProviderProfile.companyName}</h4>
                      <p className="text-xs text-gray-500">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Job Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition">
                    {job.title}
                  </h3>

                  {/* Job Details */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">₹{job.pay.toLocaleString()}</span>
                      <span className="text-xs">/{job.employmentType === 'PER_DAY' ? 'day' : 'project'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                      <MapPin className="w-4 h-4 text-red-600" />
                      {job.location}
                    </div>
                    {job.duration && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        {job.duration}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

                  {/* Skills */}
                  {job.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.requiredSkills.slice(0, 3).map(skill => (
                        <span
                          key={skill.id}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {skill.skill.skillName}
                        </span>
                      ))}
                      {job.requiredSkills.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          +{job.requiredSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Apply Button */}
                  <button
                    onClick={() => handleApply(job.id)}
                    disabled={appliedJobs.has(job.id) || applying === job.id}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      appliedJobs.has(job.id)
                        ? 'bg-green-50 text-green-700 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-800 hover:scale-105'
                    }`}
                  >
                    {applying === job.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Applying...
                      </span>
                    ) : appliedJobs.has(job.id) ? (
                      '✓ Applied'
                    ) : (
                      'Apply Now'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 1000px;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

