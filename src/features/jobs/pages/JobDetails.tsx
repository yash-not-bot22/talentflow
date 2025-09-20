import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentsApi } from '../../../api/assessmentsApi';
import { useJobDetailStore } from '../../../store/jobDetailStore';
import { useJobsStore } from '../../../store/jobsStore';
import type { Assessment } from '../../../db';
import {
  ArrowLeftIcon,
  CalendarIcon,
  TagIcon,
  PencilIcon,
  ArchiveBoxIcon,
  ShareIcon,
  CheckCircleIcon,
  ArchiveBoxIcon as ArchiveBoxSolidIcon,
  DocumentTextIcon,
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
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJobFromState = () => {
      if (!jobId) {
        setError('Job ID is required');
        return;
      }

      const jobIdNum = parseInt(jobId);
      if (isNaN(jobIdNum)) {
        setError('Invalid job ID');
        return;
      }

      // Find job in the jobs state
      const foundJob = findJobById(jobIdNum, jobs);
      
      if (foundJob) {
        setCurrentJob(foundJob);
        setError(null);
        // Load assessment for this job
        loadAssessment(jobIdNum);
      } else {
        setError('Job not found');
      }
    };

    loadJobFromState();
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

  const handleAssessmentAction = (action: 'view' | 'create' | 'edit') => {
    if (!currentJob) return;
    
    if (action === 'view') {
      navigate(`/assessment/${currentJob.id}`);
    } else if (action === 'create' || action === 'edit') {
      navigate(`/assessment/${currentJob.id}/edit`);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800';
      case 'archived':
        return 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800';
      default:
        return 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800';
    }
  };

  if (error || !currentJob) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/jobs')}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Jobs
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700 text-sm mt-1">{error || 'Job not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Jobs
        </button>
      </div>

      {/* Job Details Card */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
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
                <span className={getStatusBadge(currentJob.status).replace('bg-green-100 text-green-800', 'bg-white/20 text-white').replace('bg-gray-100 text-gray-800', 'bg-white/20 text-white')}>
                  {currentJob.status === 'active' && <CheckCircleIcon className="h-4 w-4 mr-1" />}
                  {currentJob.status === 'archived' && <ArchiveBoxSolidIcon className="h-4 w-4 mr-1" />}
                  {currentJob.status}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/jobs/${currentJob.id}/edit`)}
                className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Job
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors">
                <ShareIcon className="h-4 w-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title
                  </label>
                  <p className="text-sm text-gray-900">{currentJob.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <p className="text-sm text-gray-500 font-mono">
                    {currentJob.slug}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <span className={getStatusBadge(currentJob.status)}>
                    {currentJob.status === 'active' && <CheckCircleIcon className="h-4 w-4 mr-1" />}
                    {currentJob.status === 'archived' && <ArchiveBoxSolidIcon className="h-4 w-4 mr-1" />}
                    {currentJob.status}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Position
                  </label>
                  <p className="text-sm text-gray-900">#{currentJob.order}</p>
                </div>
              </div>
              
              {currentJob.tags && currentJob.tags.length > 0 && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {currentJob.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Assessment Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment</h2>
              
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
                      className="flex-1 bg-white text-green-600 border border-green-300 px-4 py-2 rounded-md hover:bg-green-50 transition-colors text-sm font-medium"
                    >
                      Edit Assessment
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Created
                </label>
                <p className="text-sm text-gray-900">{formatDate(currentJob.createdAt)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Last Updated
                </label>
                <p className="text-sm text-gray-900">{formatDate(currentJob.updatedAt)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job ID
                </label>
                <p className="text-sm text-gray-900 font-mono">#{currentJob.id}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="flex flex-wrap gap-4">
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Job Details
              </button>
              
              {assessment ? (
                <button
                  onClick={() => handleAssessmentAction('edit')}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Edit Assessment
                </button>
              ) : (
                <button
                  onClick={() => handleAssessmentAction('create')}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Create Assessment
                </button>
              )}
              
              <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                {currentJob.status === 'active' ? 'Archive Job' : 'Unarchive Job'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}