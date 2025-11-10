'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Loader2, LogOut, User, MapPin, DollarSign, Briefcase, Users } from 'lucide-react';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

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
  createdAt: string;
}

interface JobFormData {
  title: string;
  description: string;
  pay: string;
  employmentType: 'PER_DAY' | 'PER_PROJECT';
  location: string;
  duration: string;
  requiredSkills: string[];
}

export default function EmployerJobsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    pay: '',
    employmentType: 'PER_DAY',
    location: '',
    duration: '',
    requiredSkills: []
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Load available skills
      const skillsRes = await api.get<{ success: boolean; data: Skill[] }>('/api/skills');
      if (skillsRes.data.success) {
        setAvailableSkills(Array.isArray(skillsRes.data.data) ? skillsRes.data.data : []);
      }

      // Load jobs
      const jobsRes = await api.get<{ success: boolean; data: Job[] }>('/api/employer/jobs');
      if (jobsRes.data.success) {
        setJobs(Array.isArray(jobsRes.data.data) ? jobsRes.data.data : []);
      }
    } catch (error: any) {
      // 404 is expected if user hasn't created profile yet
      if (error.response?.status === 404) {
        setJobs([]); // Just show empty state
        setErrorMessage('Please create your employer profile first to post jobs');
      } else {
        setErrorMessage('Failed to load data');
        console.error('Load error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      if (!formData.title.trim()) {
        setErrorMessage('Job title is required');
        return;
      }
      
      if (formData.title.length > 200) {
        setErrorMessage('Job title is too long (max 200 characters)');
        return;
      }
      
      if (!formData.description.trim()) {
        setErrorMessage('Job description is required');
        return;
      }
      
      if (!formData.pay) {
        setErrorMessage('Pay/Salary is required');
        return;
      }
      
      const payNum = parseFloat(formData.pay);
      if (isNaN(payNum) || payNum <= 0) {
        setErrorMessage('Pay must be a positive number');
        return;
      }
      
      if (payNum > 10000000) {
        setErrorMessage('Pay amount seems unrealistic');
        return;
      }
      
      if (!formData.location.trim()) {
        setErrorMessage('Location is required');
        return;
      }
      
      if (formData.location.length > 200) {
        setErrorMessage('Location is too long (max 200 characters)');
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        pay: payNum,
        employmentType: formData.employmentType,
        location: formData.location,
        duration: formData.duration || undefined,
        requiredSkills: formData.requiredSkills.length > 0 ? formData.requiredSkills : undefined
      };

      let response;
      if (editingJobId) {
        response = await api.put<{ success: boolean; message: string }>(`/api/employer/jobs/${editingJobId}`, payload);
      } else {
        response = await api.post<{ success: boolean; message: string }>('/api/employer/jobs', payload);
      }

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        setShowForm(false);
        setEditingJobId(null);
        resetForm();
        loadData();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to save job');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (job: Job): void => {
    setFormData({
      title: job.title,
      description: job.description,
      pay: job.pay.toString(),
      employmentType: job.employmentType,
      location: job.location,
      duration: job.duration || '',
      requiredSkills: job.requiredSkills.map(s => s.skillId)
    });
    setEditingJobId(job.id);
    setShowForm(true);
  };

  const handleDelete = async (jobId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      const response = await api.delete<{ success: boolean; message: string }>(`/api/employer/jobs/${jobId}`);
      if (response.data.success) {
        setSuccessMessage('Job deleted successfully');
        loadData();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to delete job');
    }
  };

  const resetForm = (): void => {
    setFormData({
      title: '',
      description: '',
      pay: '',
      employmentType: 'PER_DAY',
      location: '',
      duration: '',
      requiredSkills: []
    });
    setEditingJobId(null);
  };

  const handleLogout = (): void => {
    logout();
    router.push('/signin');
  };

  const toggleSkill = (skillId: string): void => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skillId)
        ? prev.requiredSkills.filter(id => id !== skillId)
        : [...prev.requiredSkills, skillId]
    }));
  };

  const viewApplicants = (jobId: string): void => {
    router.push(`/employer/jobs/${jobId}/applicants`);
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
            <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/employer/profile')}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              My Profile
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

        {/* Create Job Button */}
        {!showForm && (
          <div className="mb-6">
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Post New Job
            </button>
          </div>
        )}

        {/* Job Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingJobId ? 'Edit Job' : 'Post New Job'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Carpenter needed for home renovation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed job description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pay <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.pay}
                    onChange={(e) => setFormData({ ...formData, pay: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Amount in ₹"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as 'PER_DAY' | 'PER_PROJECT' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PER_DAY">Per Day</option>
                    <option value="PER_PROJECT">Per Project</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Job location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (optional)
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2 weeks, 1 month"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Skills
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableSkills.map(skill => (
                    <label key={skill.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.requiredSkills.includes(skill.id)}
                        onChange={() => toggleSkill(skill.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{skill.skillName}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? 'Saving...' : editingJobId ? 'Update Job' : 'Post Job'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                disabled={saving}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Jobs List */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">No jobs posted yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Post Your First Job
              </button>
            </div>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>₹{job.pay} {job.employmentType === 'PER_DAY' ? '/day' : '/project'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      {job.duration && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{job.duration}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{job.description}</p>
                    
                    {job.requiredSkills && Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.requiredSkills.map(skill => (
                          <span
                            key={skill.id}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {skill?.skill?.skillName || 'Unknown Skill'}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === 'OPEN'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {job.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => viewApplicants(job.id)}
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Applicants
                    </button>
                    <button
                      onClick={() => handleEdit(job)}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

