import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { assessmentsApi } from '../../../api/assessmentsApi';
import { candidatesApi } from '../../../api/candidatesApi';
import { jobsApi } from '../../../api/jobsApi';
import { useJobDetailStore } from '../../../store/jobDetailStore';
import { useJobsStore } from '../../../store/jobsStore';
import { useNotifications } from '../../../hooks/useNotifications';
import type { Assessment, Candidate, CandidateResponse } from '../../../db';
import { Button, StatusPill, GradientBadge } from '../../../components/ui';
import {
  ArrowLeftIcon,
  CalendarIcon,
  PencilIcon,
  ArchiveBoxIcon,
  ShareIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// Simple loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
  </div>
);

export function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  
  // Zustand stores
  const { currentJob, setCurrentJob, findJobById } = useJobDetailStore();
  const { jobs } = useJobsStore();
  const { showSuccess, showError } = useNotifications();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [submissions, setSubmissions] = useState<CandidateResponse[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form
  const editForm = useForm({
    defaultValues: {
      title: '',
      status: 'active' as 'active' | 'archived',
      tags: '',
      order: '',
      salary: '',
      location: '',
      department: '',
      employmentType: '' as 'full-time' | 'part-time' | 'contract' | 'internship' | '',
    },
  });

  useEffect(() => {
    const loadJobData = async () => {
      if (!jobId) {
        setError('Job ID is required');
        return;
      }

      const jobIdNum = parseInt(jobId);
      if (isNaN(jobIdNum)) {
        setError('Invalid job ID');
        return;
      }

      // First try to find job in the jobs state
      const foundJob = findJobById(jobIdNum, jobs);
      
      if (foundJob) {
        setCurrentJob(foundJob);
        setError(null);
        // Load assessment for this job
        loadAssessment(jobIdNum);
        // Load submissions for this job
        loadSubmissions(jobIdNum);
        // Load candidates for this job
        loadCandidates(jobIdNum);
      } else {
        // If not found in state, try fetching from API (handles page refresh)
        try {
          console.log('Job not found in state, fetching from API...');
          const jobFromApi = await jobsApi.getJob(jobIdNum);
          setCurrentJob(jobFromApi);
          setError(null);
          // Load assessment for this job
          loadAssessment(jobIdNum);
          // Load submissions for this job
          loadSubmissions(jobIdNum);
          // Load candidates for this job
          loadCandidates(jobIdNum);
        } catch (apiError) {
          console.error('Failed to fetch job from API:', apiError);
          setError('Job not found');
        }
      }
    };

    loadJobData();
  }, [jobId, jobs, findJobById, setCurrentJob]);

  const loadAssessment = async (jobIdNum: number) => {
    setAssessmentLoading(true);
    try {
      const foundAssessment = await assessmentsApi.getAssessment(jobIdNum);
      setAssessment(foundAssessment);
    } catch (err) {
      console.log('No assessment found for this job');
      setAssessment(null);
    } finally {
      setAssessmentLoading(false);
    }
  };

  const loadSubmissions = async (jobIdNum: number) => {
    setSubmissionsLoading(true);
    try {
      const responses = await assessmentsApi.getResponses(jobIdNum);
      setSubmissions(responses);
    } catch (err) {
      console.log('No submissions found for this job');
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const loadCandidates = async (jobIdNum: number) => {
    setCandidatesLoading(true);
    try {
      const jobCandidates = await candidatesApi.getCandidatesByJobId(jobIdNum);
      setCandidates(jobCandidates);
    } catch (err) {
      console.log('No candidates found for this job');
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleAssessmentAction = (action: 'view' | 'create' | 'edit') => {
    if (!currentJob) return;
    
    if (action === 'view') {
      navigate(`/assessment/${currentJob.id}`);
    } else if (action === 'create' || action === 'edit') {
      navigate(`/assessment/${currentJob.id}/edit`);
    }
  };

  // Handle edit job submission
  const handleEditJob = async (data: { title: string; status: string; tags: string; order: string; salary: string; location: string; department: string; employmentType: string }) => {
    if (!currentJob) return;

    try {
      const tagsArray = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      const updateData: any = {
        title: data.title,
        status: data.status as 'active' | 'archived',
        tags: tagsArray,
        order: parseInt(data.order),
      };

      // Add optional fields if provided
      if (data.salary && data.salary.trim()) {
        updateData.salary = data.salary.trim();
      }
      if (data.location && data.location.trim()) {
        updateData.location = data.location.trim();
      }
      if (data.department && data.department.trim()) {
        updateData.department = data.department.trim();
      }
      if (data.employmentType && data.employmentType.trim()) {
        updateData.employmentType = data.employmentType as 'full-time' | 'part-time' | 'contract' | 'internship';
      }
      
      const updatedJob = await jobsApi.updateJob(currentJob.id, updateData);

      setCurrentJob(updatedJob);
      setShowEditModal(false);
      showSuccess('Success', 'Job updated successfully');
    } catch (error) {
      showError('Error', error instanceof Error ? error.message : 'Failed to update job');
    }
  };

  // Open edit modal with job data
  const openEditModal = () => {
    if (!currentJob) return;
    
    editForm.reset({
      title: currentJob.title,
      status: currentJob.status,
      tags: currentJob.tags ? currentJob.tags.join(', ') : '',
      order: currentJob.order.toString(),
      salary: currentJob.salary || '',
      location: currentJob.location || '',
      department: currentJob.department || '',
      employmentType: currentJob.employmentType || '',
    });
    setShowEditModal(true);
  };

  // Handle archive/unarchive job
  const handleArchiveJob = async () => {
    if (!currentJob) return;

    try {
      const newStatus = currentJob.status === 'active' ? 'archived' : 'active';
      const updatedJob = await jobsApi.updateJob(currentJob.id, {
        status: newStatus,
      });

      setCurrentJob(updatedJob);
      showSuccess('Success', `Job ${newStatus === 'archived' ? 'archived' : 'unarchived'} successfully`);
    } catch (error) {
      showError('Error', error instanceof Error ? error.message : `Failed to ${currentJob.status === 'active' ? 'archive' : 'unarchive'} job`);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (error || !currentJob) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/jobs')}
            variant="ghost"
            size="sm"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-md p-4">
          <h3 className="text-red-800 dark:text-red-300 font-medium">Error</h3>
          <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error || 'Job not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20"></div>
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with back button */}
      <div className="mb-8">
        <Button
          onClick={() => navigate('/jobs')}
          className="group backdrop-blur-lg bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-white/30 dark:border-slate-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          size="sm"
        >
          <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">Back to Jobs</span>
        </Button>
      </div>

      {/* Job Details Card */}
      <div className="backdrop-blur-lg bg-white/70 dark:bg-slate-800/70 shadow-2xl rounded-3xl overflow-hidden border border-white/30 dark:border-slate-700/30 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-12">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-white drop-shadow-lg animate-pulse">{currentJob.title}</h1>
                  <p className="text-blue-100 mt-2 text-lg font-medium">{currentJob.slug}</p>
                </div>
              </div>
              
              <div className="mt-6 flex items-center gap-3">
                <div className="backdrop-blur-lg bg-white/20 rounded-xl px-4 py-2 border border-white/30">
                  <StatusPill status={currentJob.status as 'active' | 'archived'} size="sm" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={openEditModal}
                variant="outline"
                size="md"
                className="group backdrop-blur-lg bg-white/20 border-white/30 text-white hover:bg-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
              >
                <PencilIcon className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="font-medium">Edit Job</span>
              </Button>
              <Button 
                variant="outline"
                size="md"
                className="group backdrop-blur-lg bg-white/20 border-white/30 text-white hover:bg-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
              >
                <ShareIcon className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="font-medium">Share</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="backdrop-blur-lg bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
              <h2 className="relative text-xl font-bold text-gray-900 dark:text-slate-100 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Job Information</h2>
              
              <div className="relative space-y-6">
                <div className="backdrop-blur-lg bg-white/40 dark:bg-slate-700/40 rounded-xl p-4 border border-white/20 dark:border-slate-600/20">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Job Title
                  </label>
                  <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{currentJob.title}</p>
                </div>
                
                <div className="backdrop-blur-lg bg-white/40 dark:bg-slate-700/40 rounded-xl p-4 border border-white/20 dark:border-slate-600/20">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Slug
                  </label>
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-mono bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent font-bold">
                    {currentJob.slug}
                  </p>
                </div>
                
                <div className="backdrop-blur-lg bg-white/40 dark:bg-slate-700/40 rounded-xl p-4 border border-white/20 dark:border-slate-600/20">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Status
                  </label>
                  <StatusPill status={currentJob.status as 'active' | 'archived'} size="sm" />
                </div>

                {currentJob.salary && (
                  <div className="backdrop-blur-lg bg-white/40 dark:bg-slate-700/40 rounded-xl p-4 border border-white/20 dark:border-slate-600/20">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                      Salary Range
                    </label>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{currentJob.salary}</p>
                  </div>
                )}

                {currentJob.location && (
                  <div className="backdrop-blur-lg bg-white/40 dark:bg-slate-700/40 rounded-xl p-4 border border-white/20 dark:border-slate-600/20">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                      Location
                    </label>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{currentJob.location}</p>
                  </div>
                )}

                {currentJob.department && (
                  <div className="backdrop-blur-lg bg-white/40 dark:bg-slate-700/40 rounded-xl p-4 border border-white/20 dark:border-slate-600/20">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                      Department
                    </label>
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{currentJob.department}</p>
                  </div>
                )}

                {currentJob.employmentType && (
                  <div className="backdrop-blur-lg bg-white/40 dark:bg-slate-700/40 rounded-xl p-4 border border-white/20 dark:border-slate-600/20">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                      Employment Type
                    </label>
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400 capitalize">{currentJob.employmentType.replace('-', ' ')}</p>
                  </div>
                )}
                
                <div className="backdrop-blur-lg bg-white/40 dark:bg-slate-700/40 rounded-xl p-4 border border-white/20 dark:border-slate-600/20">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Order Position
                  </label>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100">#{currentJob.order}</p>
                </div>
              </div>
              
              {currentJob.tags && currentJob.tags.length > 0 && (
                <div className="relative mt-8">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {currentJob.tags.map((tag) => (
                      <div 
                        key={tag}
                        className="backdrop-blur-lg bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:rotate-1 rounded-full"
                      >
                        <GradientBadge
                          variant="accent"
                          size="sm"
                          outline
                        >
                          {tag}
                        </GradientBadge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Assessment Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Assessment</h2>
              
              {assessmentLoading ? (
                <div className="text-center py-4">
                  <LoadingSpinner />
                  <p className="text-sm text-gray-500 mt-2">Loading assessment...</p>
                </div>
              ) : assessment ? (
                <div className="backdrop-blur-lg bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/30 dark:to-green-900/30 border border-emerald-200/50 dark:border-emerald-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-green-400/10"></div>
                  <div className="relative flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 text-lg">Assessment Available</h3>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                        {assessment.sections.length} section{assessment.sections.length !== 1 ? 's' : ''} configured
                      </p>
                    </div>
                    <div className="p-3 backdrop-blur-lg bg-emerald-500/20 rounded-2xl">
                      <DocumentTextIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => handleAssessmentAction('view')}
                      className="group flex-1 backdrop-blur-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-3 rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1"
                    >
                      <span className="group-hover:scale-110 transition-transform duration-300 inline-block">View Assessment</span>
                    </button>
                    <button
                      onClick={() => handleAssessmentAction('edit')}
                      className="group flex-1 backdrop-blur-lg bg-white/80 dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400 border border-emerald-300/50 dark:border-emerald-600/50 px-4 py-3 rounded-xl hover:bg-emerald-50/80 dark:hover:bg-emerald-900/30 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1"
                    >
                      <span className="group-hover:scale-110 transition-transform duration-300 inline-block">Edit Assessment</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="backdrop-blur-lg bg-gradient-to-br from-slate-50/80 to-gray-50/80 dark:from-slate-800/80 dark:to-slate-700/80 border border-slate-200/50 dark:border-slate-600/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-400/10 to-gray-400/10"></div>
                  <div className="relative flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-lg">No Assessment</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Create an assessment to evaluate candidates for this position
                      </p>
                    </div>
                    <div className="p-3 backdrop-blur-lg bg-slate-500/20 rounded-2xl">
                      <DocumentTextIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={() => handleAssessmentAction('create')}
                      className="group w-full backdrop-blur-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1"
                    >
                      <span className="group-hover:scale-110 transition-transform duration-300 inline-block">Create Assessment</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Details */}
          <div className="mt-8 pt-6 border-t border-gradient-to-r from-blue-200/50 via-purple-200/50 to-pink-200/50 dark:from-blue-700/50 dark:via-purple-700/50 dark:to-pink-700/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Additional Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="backdrop-blur-lg bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center">
                  <CalendarIcon className="h-4 w-4 inline mr-2 text-blue-500" />
                  Created
                </label>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{formatDate(currentJob.createdAt)}</p>
              </div>
              
              <div className="backdrop-blur-lg bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center">
                  <CalendarIcon className="h-4 w-4 inline mr-2 text-purple-500" />
                  Last Updated
                </label>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{formatDate(currentJob.updatedAt)}</p>
              </div>
              
              <div className="backdrop-blur-lg bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Job ID
                </label>
                <p className="text-sm font-mono font-semibold text-gray-900 dark:text-slate-100 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">#{currentJob.id}</p>
              </div>
            </div>
          </div>

          {/* Candidates in this Job */}
          <div className="mt-8 pt-6 border-t border-gradient-to-r from-blue-200/50 via-purple-200/50 to-pink-200/50 dark:from-blue-700/50 dark:via-purple-700/50 dark:to-pink-700/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6 flex items-center">
              <div className="p-2 backdrop-blur-lg bg-blue-500/20 rounded-xl mr-3">
                <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Candidates in this Job</span>
            </h2>
            
            {candidatesLoading ? (
              <div className="text-center py-4">
                <LoadingSpinner />
                <p className="text-sm text-gray-500 mt-2">Loading candidates...</p>
              </div>
            ) : candidates.length > 0 ? (
              <div className="space-y-3">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="group flex items-center justify-between p-6 backdrop-blur-lg bg-white/70 dark:bg-slate-800/70 rounded-2xl border border-white/30 dark:border-slate-700/30 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
                    onClick={() => {
                      console.log('🔗 Navigating to candidate:', candidate.id, candidate.name);
                      navigate(`/candidates/${candidate.id}`);
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <span className="text-white font-bold text-sm">
                            {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{candidate.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{candidate.email}</p>
                      </div>
                    </div>
                    <div className="relative flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium backdrop-blur-lg shadow-lg
                        ${candidate.stage === 'applied' ? 'bg-blue-100/80 text-blue-800 border border-blue-200/50' :
                          candidate.stage === 'screen' ? 'bg-yellow-100/80 text-yellow-800 border border-yellow-200/50' :
                          candidate.stage === 'tech' ? 'bg-purple-100/80 text-purple-800 border border-purple-200/50' :
                          candidate.stage === 'offer' ? 'bg-orange-100/80 text-orange-800 border border-orange-200/50' :
                          candidate.stage === 'hired' ? 'bg-green-100/80 text-green-800 border border-green-200/50' :
                          'bg-red-100/80 text-red-800 border border-red-200/50'}`}>
                        {candidate.stage}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                        {new Date(candidate.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 backdrop-blur-lg bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-white/30 dark:border-slate-700/30 shadow-lg">
                <div className="p-4 backdrop-blur-lg bg-slate-500/20 rounded-2xl w-fit mx-auto mb-6">
                  <UserGroupIcon className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No candidates have applied for this job yet.</p>
              </div>
            )}
          </div>

          {/* Assessment Submissions */}
          <div className="mt-8 pt-6 border-t border-gradient-to-r from-blue-200/50 via-purple-200/50 to-pink-200/50 dark:from-blue-700/50 dark:via-purple-700/50 dark:to-pink-700/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Assessment Submissions</h2>
            
            {submissionsLoading ? (
              <div className="text-center py-4">
                <LoadingSpinner />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading submissions...</p>
              </div>
            ) : submissions.length > 0 ? (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div 
                    key={submission.id} 
                    onClick={() => navigate(`/assessment/${jobId}/response/${submission.id}`)}
                    className="group backdrop-blur-lg bg-white/70 dark:bg-slate-800/70 border border-white/30 dark:border-slate-700/30 rounded-2xl p-6 hover:shadow-2xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 cursor-pointer shadow-lg hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <span className="text-white text-sm font-bold">
                            #{submission.candidateId}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Candidate #{submission.candidateId}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Submitted {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {Object.keys(submission.responses).length} response{Object.keys(submission.responses).length !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Response ID: #{submission.id}</p>
                        </div>
                        <div className="flex-shrink-0 p-2 backdrop-blur-lg bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                          <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="backdrop-blur-lg bg-white/60 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/30 rounded-2xl p-8 text-center shadow-xl">
                <div className="p-4 backdrop-blur-lg bg-slate-500/20 rounded-2xl w-fit mx-auto mb-6">
                  <DocumentTextIcon className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto" />
                </div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 text-lg">No Submissions Yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {assessment 
                    ? 'Candidates haven\'t submitted any assessment responses for this job yet.'
                    : 'Create an assessment first to start receiving candidate submissions.'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gradient-to-r from-blue-200/50 via-purple-200/50 to-pink-200/50 dark:from-blue-700/50 dark:via-purple-700/50 dark:to-pink-700/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Quick Actions</h2>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={openEditModal}
                variant="primary"
                size="md"
                className="group backdrop-blur-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
              >
                <PencilIcon className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="font-medium">Edit Job Details</span>
              </Button>
              
              {assessment ? (
                <Button
                  onClick={() => handleAssessmentAction('edit')}
                  variant="secondary"
                  size="md"
                  className="group backdrop-blur-lg bg-white/70 dark:bg-slate-800/70 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-white/30 dark:border-slate-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                >
                  <DocumentTextIcon className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium">Edit Assessment</span>
                </Button>
              ) : (
                <Button
                  onClick={() => handleAssessmentAction('create')}
                  variant="secondary"
                  size="md"
                  className="group backdrop-blur-lg bg-white/70 dark:bg-slate-800/70 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-white/30 dark:border-slate-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                >
                  <DocumentTextIcon className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium">Create Assessment</span>
                </Button>
              )}
              
              <Button 
                variant="outline"
                size="md"
                onClick={handleArchiveJob}
                className="group backdrop-blur-lg bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-white/30 dark:border-slate-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
              >
                <ArchiveBoxIcon className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="font-medium">{currentJob.status === 'active' ? 'Archive Job' : 'Unarchive Job'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Job Modal */}
      {showEditModal && currentJob && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowEditModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-white/30 dark:border-slate-700/30 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
              <form onSubmit={editForm.handleSubmit(handleEditJob)}>
                <div className="relative bg-white/70 dark:bg-slate-800/70 px-6 pt-6 pb-6 sm:p-8 sm:pb-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-2xl leading-6 font-bold text-gray-900 dark:text-slate-100 mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Edit Job: {currentJob.title}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label htmlFor="edit-title" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Job Title *
                          </label>
                          <input
                            {...editForm.register('title', { required: 'Job title is required' })}
                            type="text"
                            id="edit-title"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="e.g. Senior React Developer"
                          />
                          {editForm.formState.errors.title && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{editForm.formState.errors.title.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="edit-salary" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Salary Range
                          </label>
                          <input
                            {...editForm.register('salary')}
                            type="text"
                            id="edit-salary"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="e.g. $80,000 - $120,000"
                          />
                        </div>

                        <div>
                          <label htmlFor="edit-location" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Location
                          </label>
                          <input
                            {...editForm.register('location')}
                            type="text"
                            id="edit-location"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="e.g. San Francisco, CA or Remote"
                          />
                        </div>

                        <div>
                          <label htmlFor="edit-department" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Department
                          </label>
                          <input
                            {...editForm.register('department')}
                            type="text"
                            id="edit-department"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="e.g. Engineering, Product, Marketing"
                          />
                        </div>

                        <div>
                          <label htmlFor="edit-employmentType" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Employment Type
                          </label>
                          <select
                            {...editForm.register('employmentType')}
                            id="edit-employmentType"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                          >
                            <option value="">Select type</option>
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="internship">Internship</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="edit-status" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Status
                          </label>
                          <select
                            {...editForm.register('status')}
                            id="edit-status"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                          >
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor="edit-tags" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Tags
                          </label>
                          <input
                            {...editForm.register('tags')}
                            type="text"
                            id="edit-tags"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="remote, senior, react, typescript"
                          />
                          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Separate tags with commas</p>
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor="edit-order" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Order
                          </label>
                          <input
                            {...editForm.register('order')}
                            type="number"
                            min="1"
                            id="edit-order"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="Position in job list"
                          />
                          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Change position in job list. Other jobs will be reordered automatically.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse sm:gap-3 border-t border-white/30 dark:border-slate-600/30">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="group backdrop-blur-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <span className="group-hover:scale-110 transition-transform duration-300 inline-block font-medium">Update Job</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    variant="outline"
                    size="md"
                    className="group backdrop-blur-lg bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-white/30 dark:border-slate-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <span className="group-hover:scale-110 transition-transform duration-300 inline-block font-medium">Cancel</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}