'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Plus, X, Briefcase, Award, Users, Save, Edit2, Trash2, Loader2, LogOut } from 'lucide-react';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

// Types matching Prisma schema
interface Skill {
  id: string;
  skillName: string;
  requiresCertificate: boolean;
  createdAt: string;
}

interface UserSkill {
  id: string;
  skillId: string;
  certificateUrl: string | null;
  skill: Skill;
}

interface EmploymentHistory {
  id: string;
  companyName: string;
  duration: string;
  description: string | null;
}

interface Reference {
  id: string;
  name: string;
  contact: string;
  description: string | null;
}

interface JobSeekerProfile {
  id: string;
  userId: string;
  name: string;
  address: string | null;
  phone: string | null;
  education: string | null;
  createdAt: string;
  updatedAt: string;
  skills: UserSkill[];
  employmentHistory: EmploymentHistory[];
  references: Reference[];
}

interface FormSkill {
  skillId: string;
  skillName: string;
  certificateUrl: string;
  requiresCertificate: boolean;
}

interface FormEmployment {
  companyName: string;
  duration: string;
  description: string;
}

interface FormReference {
  name: string;
  contact: string;
  description: string;
}

interface FormData {
  name: string;
  address: string;
  phone: string;
  education: string;
  skills: FormSkill[];
  employmentHistory: FormEmployment[];
  references: FormReference[];
}

export default function ApplicantProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [profileExists, setProfileExists] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    phone: '',
    education: '',
    skills: [],
    employmentHistory: [],
    references: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Load available skills
      const skillsRes = await api.get<{ success: boolean; data: Skill[] }>('/api/skills');
      if (skillsRes.data.success) {
        setAvailableSkills(skillsRes.data.data);
      }

      // Load existing profile
      try {
        const profileRes = await api.get<{ success: boolean; data: JobSeekerProfile }>('/api/applicant/profile');
        if (profileRes.data.success && profileRes.data.data) {
          const profile = profileRes.data.data;
          setProfileExists(true);
          setFormData({
            name: profile.name || '',
            address: profile.address || '',
            phone: profile.phone || '',
            education: profile.education || '',
            skills: profile.skills?.map(s => ({
              skillId: s.skillId,
              skillName: s.skill.skillName,
              certificateUrl: s.certificateUrl || '',
              requiresCertificate: s.skill.requiresCertificate
            })) || [],
            employmentHistory: profile.employmentHistory?.map(e => ({
              companyName: e.companyName,
              duration: e.duration,
              description: e.description || ''
            })) || [],
            references: profile.references?.map(r => ({
              name: r.name,
              contact: r.contact,
              description: r.description || ''
            })) || []
          });
        } else {
          setIsEditing(true);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setIsEditing(true);
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      setErrorMessage('Failed to load data');
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

      if (!formData.name.trim()) {
        setErrorMessage('Name is required');
        return;
      }

      // Validate required fields in arrays
      for (const skill of formData.skills) {
        if (skill.requiresCertificate && !skill.certificateUrl.trim()) {
          setErrorMessage(`Certificate required for ${skill.skillName}`);
          return;
        }
      }

      for (const emp of formData.employmentHistory) {
        if (!emp.companyName.trim() || !emp.duration.trim()) {
          setErrorMessage('Company name and duration are required for all employment entries');
          return;
        }
      }

      for (const ref of formData.references) {
        if (!ref.name.trim() || !ref.contact.trim()) {
          setErrorMessage('Name and contact are required for all references');
          return;
        }
      }

      // Prepare data for backend (matching Zod schema)
      const payload = {
        name: formData.name,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        education: formData.education || undefined,
        skills: formData.skills.length > 0 ? formData.skills.map(s => ({
          skillId: s.skillId,
          certificateUrl: s.certificateUrl || undefined
        })) : undefined,
        employmentHistory: formData.employmentHistory.length > 0 ? formData.employmentHistory.map(e => ({
          companyName: e.companyName,
          duration: e.duration,
          description: e.description || undefined
        })) : undefined,
        references: formData.references.length > 0 ? formData.references.map(r => ({
          name: r.name,
          contact: r.contact,
          description: r.description || undefined
        })) : undefined
      };

      let response;
      if (profileExists) {
        response = await api.put<{ success: boolean; message: string }>('/api/applicant/profile', payload);
      } else {
        response = await api.post<{ success: boolean; message: string }>('/api/applicant/profile', payload);
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
      const response = await api.delete<{ success: boolean; message: string }>('/api/applicant/profile');
      
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

  const addSkill = (skillId: string): void => {
    const skill = availableSkills.find(s => s.id === skillId);
    if (!skill) return;

    const alreadyAdded = formData.skills.find(s => s.skillId === skillId);
    if (alreadyAdded) {
      setErrorMessage('Skill already added');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setFormData({
      ...formData,
      skills: [...formData.skills, {
        skillId: skill.id,
        skillName: skill.skillName,
        certificateUrl: '',
        requiresCertificate: skill.requiresCertificate
      }]
    });
  };

  const removeSkill = (index: number): void => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index)
    });
  };

  const updateSkillCertificate = (index: number, url: string): void => {
    const updated = [...formData.skills];
    if (updated[index]) {
      updated[index].certificateUrl = url;
      setFormData({ ...formData, skills: updated });
    }
  };

  const addEmployment = (): void => {
    setFormData({
      ...formData,
      employmentHistory: [...formData.employmentHistory, {
        companyName: '',
        duration: '',
        description: ''
      }]
    });
  };

  const removeEmployment = (index: number): void => {
    setFormData({
      ...formData,
      employmentHistory: formData.employmentHistory.filter((_, i) => i !== index)
    });
  };

  const updateEmployment = (index: number, field: keyof FormEmployment, value: string): void => {
    const updated = [...formData.employmentHistory];
    if (updated[index]) {
      updated[index][field] = value;
      setFormData({ ...formData, employmentHistory: updated });
    }
  };

  const addReference = (): void => {
    setFormData({
      ...formData,
      references: [...formData.references, {
        name: '',
        contact: '',
        description: ''
      }]
    });
  };

  const removeReference = (index: number): void => {
    setFormData({
      ...formData,
      references: formData.references.filter((_, i) => i !== index)
    });
  };

  const updateReference = (index: number, field: keyof FormReference, value: string): void => {
    const updated = [...formData.references];
    if (updated[index]) {
      updated[index][field] = value;
      setFormData({ ...formData, references: updated });
    }
  };

  const handleLogout = (): void => {
    logout();
    router.push('/login');
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
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/applicant/applications')}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
            >
              My Applications
            </button>
            <button
              onClick={() => router.push('/feed')}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
            >
              Job Feed
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

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Your full address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Education
              </label>
              <textarea
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                disabled={!isEditing}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Your educational background"
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Skills</h2>
          </div>

          {isEditing && (
            <div className="mb-4 flex gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addSkill(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a skill to add...</option>
                {availableSkills.map(skill => (
                  <option key={skill.id} value={skill.id}>
                    {skill.skillName} {skill.requiresCertificate ? '(Certificate Required)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-3">
            {formData.skills.length === 0 ? (
              <p className="text-gray-500 text-sm">No skills added yet</p>
            ) : (
              formData.skills.map((skill, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{skill.skillName}</h3>
                      {skill.requiresCertificate && (
                        <span className="text-xs text-orange-600">Certificate Required</span>
                      )}
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => removeSkill(index)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Certificate URL {skill.requiresCertificate && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="url"
                      value={skill.certificateUrl}
                      onChange={(e) => updateSkillCertificate(index, e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                      placeholder="https://example.com/certificate.pdf"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Employment History */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Employment History</h2>
            </div>
            {isEditing && (
              <button
                onClick={addEmployment}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>

          <div className="space-y-3">
            {formData.employmentHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">No employment history added</p>
            ) : (
              formData.employmentHistory.map((emp, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-900">Employment #{index + 1}</h3>
                    {isEditing && (
                      <button
                        onClick={() => removeEmployment(index)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Company Name *</label>
                      <input
                        type="text"
                        value={emp.companyName}
                        onChange={(e) => updateEmployment(index, 'companyName', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Duration *</label>
                      <input
                        type="text"
                        value={emp.duration}
                        onChange={(e) => updateEmployment(index, 'duration', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                        placeholder="e.g., Jan 2020 - Dec 2022"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Description</label>
                      <textarea
                        value={emp.description}
                        onChange={(e) => updateEmployment(index, 'description', e.target.value)}
                        disabled={!isEditing}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                        placeholder="Brief description of your role"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* References */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">References</h2>
            </div>
            {isEditing && (
              <button
                onClick={addReference}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>

          <div className="space-y-3">
            {formData.references.length === 0 ? (
              <p className="text-gray-500 text-sm">No references added</p>
            ) : (
              formData.references.map((ref, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-900">Reference #{index + 1}</h3>
                    {isEditing && (
                      <button
                        onClick={() => removeReference(index)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={ref.name}
                        onChange={(e) => updateReference(index, 'name', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                        placeholder="Reference name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Contact *</label>
                      <input
                        type="text"
                        value={ref.contact}
                        onChange={(e) => updateReference(index, 'contact', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                        placeholder="Phone or email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Description</label>
                      <textarea
                        value={ref.description}
                        onChange={(e) => updateReference(index, 'description', e.target.value)}
                        disabled={!isEditing}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                        placeholder="Relationship or context"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
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
                  loadData();
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