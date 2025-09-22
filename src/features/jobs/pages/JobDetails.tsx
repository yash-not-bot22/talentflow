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
  TagIcon,
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
  const handleEditJob = async (data: { title: string; status: string; tags: string; order: string }) => {
    if (!currentJob) return;

    try {
      const tagsArray = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      const updatedJob = await jobsApi.updateJob(currentJob.id, {
        title: data.title,
        status: data.status as 'active' | 'archived',
        tags: tagsArray,
        order: parseInt(data.order),
      });

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
    });
    setShowEditModal(true);
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with back button */}
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

      {/* Job Details Card */}
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">{currentJob.title}</h1>
                  <p className="text-blue-100 mt-1">{currentJob.slug}</p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-2">
                <div className="bg-white/20 rounded-lg px-3 py-1">
                  <StatusPill status={currentJob.status as 'active' | 'archived'} size="sm" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={openEditModal}
                variant="outline"
                size="md"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <PencilIcon className="h-4 w-4" />
                Edit Job
              </Button>
              <Button 
                variant="outline"
                size="md"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <ShareIcon className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Job Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Job Title
                  </label>
                  <p className="text-sm text-gray-900 dark:text-slate-100">{currentJob.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Slug
                  </label>
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-mono">
                    {currentJob.slug}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <StatusPill status={currentJob.status as 'active' | 'archived'} size="sm" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Order Position
                  </label>
                  <p className="text-sm text-gray-900 dark:text-slate-100">#{currentJob.order}</p>
                </div>
              </div>
              
              {currentJob.tags && currentJob.tags.length > 0 && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {currentJob.tags.map((tag) => (
                      <GradientBadge
                        key={tag}
                        variant="accent"
                        size="sm"
                        outline
                      >
                        <TagIcon className="h-3 w-3" />
                        {tag}
                      </GradientBadge>
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
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-green-800">Assessment Available</h3>
                      <p className="text-sm text-green-600 mt-1">
                        {assessment.sections.length} section{assessment.sections.length !== 1 ? 's' : ''} configured
                      </p>
                    </div>
                    <DocumentTextIcon className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handleAssessmentAction('view')}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      View Assessment
                    </button>
                    <button
                      onClick={() => handleAssessmentAction('edit')}
                      className="flex-1 bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-600 px-4 py-2 rounded-md hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors text-sm font-medium"
                    >
                      Edit Assessment
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-700">No Assessment</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Create an assessment to evaluate candidates for this position
                      </p>
                    </div>
                    <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  
                  <div className="mt-4">
                    <button
                      onClick={() => handleAssessmentAction('create')}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Create Assessment
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Details */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Additional Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Created
                </label>
                <p className="text-sm text-gray-900 dark:text-slate-100">{formatDate(currentJob.createdAt)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Last Updated
                </label>
                <p className="text-sm text-gray-900 dark:text-slate-100">{formatDate(currentJob.updatedAt)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Job ID
                </label>
                <p className="text-sm text-gray-900 dark:text-slate-100 font-mono">#{currentJob.id}</p>
              </div>
            </div>
          </div>

          {/* Candidates in this Job */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Candidates in this Job
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
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                    onClick={() => {
                      console.log('🔗 Navigating to candidate:', candidate.id, candidate.name);
                      navigate(`/candidates/${candidate.id}`);
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100">{candidate.name}</h3>
                        <p className="text-sm text-gray-500">{candidate.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${candidate.stage === 'applied' ? 'bg-blue-100 text-blue-800' :
                          candidate.stage === 'screen' ? 'bg-yellow-100 text-yellow-800' :
                          candidate.stage === 'tech' ? 'bg-purple-100 text-purple-800' :
                          candidate.stage === 'offer' ? 'bg-orange-100 text-orange-800' :
                          candidate.stage === 'hired' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'}`}>
                        {candidate.stage}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(candidate.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UserGroupIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-sm">No candidates have applied for this job yet.</p>
              </div>
            )}
          </div>

          {/* Assessment Submissions */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Assessment Submissions</h2>
            
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
                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-slate-500 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            #{submission.candidateId}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {Object.keys(submission.responses).length} response{Object.keys(submission.responses).length !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Response ID: #{submission.id}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-6 text-center">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">No Submissions Yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {assessment 
                    ? 'Candidates haven\'t submitted any assessment responses for this job yet.'
                    : 'Create an assessment first to start receiving candidate submissions.'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Quick Actions</h2>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={openEditModal}
                variant="primary"
                size="md"
              >
                <PencilIcon className="h-4 w-4" />
                Edit Job Details
              </Button>
              
              {assessment ? (
                <Button
                  onClick={() => handleAssessmentAction('edit')}
                  variant="secondary"
                  size="md"
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  Edit Assessment
                </Button>
              ) : (
                <Button
                  onClick={() => handleAssessmentAction('create')}
                  variant="secondary"
                  size="md"
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  Create Assessment
                </Button>
              )}
              
              <Button 
                variant="outline"
                size="md"
              >
                <ArchiveBoxIcon className="h-4 w-4" />
                {currentJob.status === 'active' ? 'Archive Job' : 'Unarchive Job'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Job Modal */}
      {showEditModal && currentJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={editForm.handleSubmit(handleEditJob)}>
                <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-slate-100 mb-4">
                        Edit Job: {currentJob.title}
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Job Title *
                          </label>
                          <input
                            {...editForm.register('title', { required: 'Job title is required' })}
                            type="text"
                            id="edit-title"
                            className="block w-full border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g. Senior React Developer"
                          />
                          {editForm.formState.errors.title && (
                            <p className="mt-1 text-sm text-red-600">{editForm.formState.errors.title.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Status
                          </label>
                          <select
                            {...editForm.register('status')}
                            id="edit-status"
                            className="block w-full border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Tags
                          </label>
                          <input
                            {...editForm.register('tags')}
                            type="text"
                            id="edit-tags"
                            className="block w-full border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="remote, senior, react, typescript"
                          />
                          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Separate tags with commas</p>
                        </div>

                        <div>
                          <label htmlFor="edit-order" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Order
                          </label>
                          <input
                            {...editForm.register('order')}
                            type="number"
                            min="1"
                            id="edit-order"
                            className="block w-full border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Position in job list"
                          />
                          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Change position in job list. Other jobs will be reordered automatically.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                  >
                    Update Job
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    variant="outline"
                    size="md"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}