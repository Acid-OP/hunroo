'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Briefcase, Award, Users, Save, Edit2, Trash2, Loader2, LogOut, MapPin, Phone, Mail, GraduationCap, CheckCircle, ExternalLink, Calendar, Building, FileText } from 'lucide-react';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // 404 is expected for new users - silently handle it
        if (err.response?.status === 404) {
          setIsEditing(true);
        } else {
          console.error('Error loading profile:', err);
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
        await loadData();
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  My Profile
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/applicant/applications')}
                className="px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-all font-medium"
              >
                My Applications
              </button>
              <button
                onClick={() => router.push('/feed')}
                className="px-6 py-2.5 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                Browse Jobs
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2 font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Enhanced Messages */}
        {successMessage && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl shadow-sm flex items-center gap-3 animate-in slide-in-from-top">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-sm flex items-center gap-3 animate-in slide-in-from-top">
            <X className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Enhanced Action Buttons */}
        {profileExists && !isEditing && (
          <div className="mb-8 flex gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-xl flex items-center gap-3 transition-all hover:scale-105 shadow-lg font-semibold group"
            >
              <Edit2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Edit Profile
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-8 py-4 bg-white border-2 border-red-500 text-red-600 rounded-2xl hover:bg-red-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 font-semibold"
            >
              <Trash2 className="w-5 h-5" />
              Delete Profile
            </button>
          </div>
        )}

        <div className="grid gap-6">
          {/* Enhanced Basic Information */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                <p className="text-sm text-gray-500">Your personal details</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 transition-all text-base font-medium"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 transition-all"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 transition-all"
                  placeholder="Your address"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  Education
                </label>
                <textarea
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 transition-all resize-none"
                  placeholder="Your educational background"
                />
              </div>
            </div>
          </div>

          {/* Enhanced Skills Section */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Skills & Certifications</h2>
                  <p className="text-sm text-gray-500">Showcase your expertise</p>
                </div>
              </div>
              {isEditing && formData.skills.length > 0 && (
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                  {formData.skills.length} {formData.skills.length === 1 ? 'Skill' : 'Skills'}
                </span>
              )}
            </div>

            {isEditing && (
              <div className="mb-6">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addSkill(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-5 py-4 border-2 border-dashed border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-blue-50/50 hover:bg-blue-50 font-medium text-gray-700"
                >
                  <option value="">+ Add a new skill...</option>
                  {availableSkills.map(skill => (
                    <option key={skill.id} value={skill.id}>
                      {skill.skillName} {skill.requiresCertificate ? '(Certificate Required)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid gap-4">
              {formData.skills.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No skills added yet</p>
                  {isEditing && (
                    <p className="text-sm text-gray-400 mt-1">Select a skill from the dropdown above</p>
                  )}
                </div>
              ) : (
                formData.skills.map((skill, index) => (
                  <div key={index} className="group border-2 border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{skill.skillName}</h3>
                          {skill.requiresCertificate && (
                            <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-semibold mt-1">
                              <FileText className="w-3 h-3" />
                              Certificate Required
                            </span>
                          )}
                        </div>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeSkill(index)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-blue-600" />
                        Certificate URL {skill.requiresCertificate && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="url"
                        value={skill.certificateUrl}
                        onChange={(e) => updateSkillCertificate(index, e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 text-sm transition-all"
                        placeholder="https://example.com/certificate.pdf"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Enhanced Employment History */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Employment History</h2>
                  <p className="text-sm text-gray-500">Your work experience</p>
                </div>
              </div>
              {isEditing && (
                <button
                  onClick={addEmployment}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg flex items-center gap-2 text-sm transition-all hover:scale-105 font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Add Experience
                </button>
              )}
            </div>

            <div className="grid gap-4">
              {formData.employmentHistory.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No employment history added</p>
                  {isEditing && (
                    <p className="text-sm text-gray-400 mt-1">Click "Add Experience" to get started</p>
                  )}
                </div>
              ) : (
                formData.employmentHistory.map((emp, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-purple-50/30">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                          <Building className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900">Experience #{index + 1}</h3>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeEmployment(index)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Building className="w-4 h-4 text-purple-600" />
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={emp.companyName}
                          onChange={(e) => updateEmployment(index, 'companyName', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 text-sm transition-all"
                          placeholder="Company name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          Duration <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={emp.duration}
                          onChange={(e) => updateEmployment(index, 'duration', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 text-sm transition-all"
                          placeholder="e.g., Jan 2020 - Dec 2022"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600" />
                          Description
                        </label>
                        <textarea
                          value={emp.description}
                          onChange={(e) => updateEmployment(index, 'description', e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 text-sm transition-all resize-none"
                          placeholder="Brief description of your role and responsibilities"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Enhanced References Section */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">References</h2>
                  <p className="text-sm text-gray-500">People who can vouch for you</p>
                </div>
              </div>
              {isEditing && (
                <button
                  onClick={addReference}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg flex items-center gap-2 text-sm transition-all hover:scale-105 font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Add Reference
                </button>
              )}
            </div>

            <div className="grid gap-4">
              {formData.references.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No references added</p>
                  {isEditing && (
                    <p className="text-sm text-gray-400 mt-1">Click "Add Reference" to get started</p>
                  )}
                </div>
              ) : (
                formData.references.map((ref, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-green-50/30">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900">Reference #{index + 1}</h3>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeReference(index)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-600" />
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={ref.name}
                          onChange={(e) => updateReference(index, 'name', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 text-sm transition-all"
                          placeholder="Reference name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-600" />
                          Contact <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={ref.contact}
                          onChange={(e) => updateReference(index, 'contact', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 text-sm transition-all"
                          placeholder="Phone or email"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600" />
                          Description
                        </label>
                        <textarea
                          value={ref.description}
                          onChange={(e) => updateReference(index, 'description', e.target.value)}
                          disabled={!isEditing}
                          rows={2}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-700 text-sm transition-all resize-none"
                          placeholder="Relationship or context (e.g., Former supervisor, Business partner)"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Save/Cancel Buttons */}
        {isEditing && (
          <div className="mt-8 flex gap-4 sticky bottom-6 bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 font-bold text-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  Save Profile
                </>
              )}
            </button>
            {profileExists && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  loadData();
                }}
                disabled={saving}
                className="px-10 py-5 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 font-bold text-lg"
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