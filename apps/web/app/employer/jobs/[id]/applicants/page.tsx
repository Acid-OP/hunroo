'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Phone, Award, Briefcase, Users, MapPin } from 'lucide-react';
import { api } from '../../../../../lib/axios';
import { useAuthStore } from '../../../../../store/authStore';

interface Skill {
  id: string;
  skillName: string;
}

interface UserSkill {
  id: string;
  skill: Skill;
  certificateUrl: string | null;
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
  name: string;
  address: string | null;
  phone: string | null;
  education: string | null;
  skills: UserSkill[];
  employmentHistory: EmploymentHistory[];
  references: Reference[];
}

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  jobSeekerProfile: JobSeekerProfile;
}

export default function JobApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [expandedApplicant, setExpandedApplicant] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  useEffect(() => {
    loadApplicants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const loadApplicants = async () => {
    try {
      setLoading(true);
      
      // Load job details first
      const jobResponse = await api.get<{ success: boolean; data: any }>(`/api/jobs/${jobId}`);
      if (jobResponse.data.success) {
        setJobTitle(jobResponse.data.data.title);
      }
      
      // Load applicants
      const response = await api.get<{ success: boolean; data: Application[] }>(`/api/employer/jobs/${jobId}/applicants`);
      
      if (response.data.success) {
        setApplications(response.data.data);
      }
    } catch (error: any) {
      setErrorMessage('Failed to load applicants');
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleApplicant = (applicantId: string) => {
    setExpandedApplicant(expandedApplicant === applicantId ? null : applicantId);
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
        <div className="max-w-5xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/employer/jobs')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to My Jobs</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {jobTitle ? `Applicants for: ${jobTitle}` : 'Job Applicants'}
          </h1>
          <p className="text-sm text-gray-600">{applications.length} applicant{applications.length !== 1 ? 's' : ''}</p>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm">
            {errorMessage}
          </div>
        )}

        {/* Applicants List */}
        {applications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Applicants Yet</h3>
            <p className="text-gray-600">Applications will appear here once workers apply to your job</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div
                key={app.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Compact View */}
                <button
                  onClick={() => toggleApplicant(app.id)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{app.jobSeekerProfile.name}</h3>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-2">
                        {app.jobSeekerProfile.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {app.jobSeekerProfile.phone}
                          </div>
                        )}
                        {app.jobSeekerProfile.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {app.jobSeekerProfile.address.split(',')[0]}
                          </div>
                        )}
                      </div>

                      {/* Skills Preview */}
                      {app.jobSeekerProfile?.skills && Array.isArray(app.jobSeekerProfile.skills) && app.jobSeekerProfile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {app.jobSeekerProfile.skills.slice(0, 3).map(skill => (
                            <span
                              key={skill.id}
                              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                            >
                              {skill?.skill?.skillName || 'Unknown Skill'}
                            </span>
                          ))}
                          {app.jobSeekerProfile.skills.length > 3 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                              +{app.jobSeekerProfile.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                        {expandedApplicant === app.id ? 'Hide Details' : 'View Details'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expanded View */}
                {expandedApplicant === app.id && (
                  <div className="border-t border-gray-100 p-6 bg-gray-50 space-y-6 animate-slide-down">
                    {/* Contact Info */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        {app.jobSeekerProfile.phone && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {app.jobSeekerProfile.phone}
                          </div>
                        )}
                        {app.jobSeekerProfile.address && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {app.jobSeekerProfile.address}
                          </div>
                        )}
                        {app.jobSeekerProfile.education && (
                          <div className="text-gray-700">
                            <span className="font-medium">Education:</span> {app.jobSeekerProfile.education}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* All Skills */}
                    {app.jobSeekerProfile?.skills && Array.isArray(app.jobSeekerProfile.skills) && app.jobSeekerProfile.skills.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-gray-900">Skills</h4>
                        </div>
                        <div className="space-y-2">
                          {app.jobSeekerProfile.skills.map(skill => (
                            <div key={skill.id} className="bg-white p-3 rounded-xl border border-gray-200">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">{skill?.skill?.skillName || 'Unknown Skill'}</span>
                                {skill.certificateUrl && (
                                  <a
                                    href={skill.certificateUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    View Certificate
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Employment History */}
                    {app.jobSeekerProfile.employmentHistory.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Briefcase className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">Employment History</h4>
                        </div>
                        <div className="space-y-2">
                          {app.jobSeekerProfile.employmentHistory.map(emp => (
                            <div key={emp.id} className="bg-white p-3 rounded-xl border border-gray-200">
                              <div className="font-medium text-gray-900">{emp.companyName}</div>
                              <div className="text-sm text-gray-600">{emp.duration}</div>
                              {emp.description && (
                                <p className="text-sm text-gray-700 mt-1">{emp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* References */}
                    {app.jobSeekerProfile.references.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-gray-900">References</h4>
                        </div>
                        <div className="space-y-2">
                          {app.jobSeekerProfile.references.map(ref => (
                            <div key={ref.id} className="bg-white p-3 rounded-xl border border-gray-200">
                              <div className="font-medium text-gray-900">{ref.name}</div>
                              <div className="text-sm text-gray-600">{ref.contact}</div>
                              {ref.description && (
                                <p className="text-sm text-gray-700 mt-1">{ref.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Application Date */}
                    <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
                      <strong>Applied on:</strong> {new Date(app.appliedAt).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 2000px;
          }
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

