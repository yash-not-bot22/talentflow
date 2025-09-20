import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { Assessment, Job } from '../../../db';
import { assessmentsApi } from '../../../api/assessmentsApi';
import { jobsApi } from '../../../api/jobsApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import toast from 'react-hot-toast';

interface JobWithAssessment {
  job: Job;
  assessment?: Assessment;
  hasAssessment: boolean;
}

interface AssessmentCardProps {
  jobWithAssessment: JobWithAssessment;
  onEdit: (jobId: number) => void;
  onDelete: (jobId: number) => void;
  onDuplicate: (jobWithAssessment: JobWithAssessment) => void;
  onPreview?: (assessment: Assessment) => void;
}

function AssessmentCard({ jobWithAssessment, onEdit, onDelete, onDuplicate, onPreview }: AssessmentCardProps) {
  const { job, assessment, hasAssessment } = jobWithAssessment;
  const totalQuestions = hasAssessment && assessment 
    ? assessment.sections.reduce((total: number, section) => total + section.questions.length, 0)
    : 0;
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {job.title}
            </h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              hasAssessment
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {hasAssessment ? 'Has Assessment' : 'No Assessment'}
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            {hasAssessment && assessment ? (
              <>
                <div className="flex items-center space-x-4">
                  <span>{assessment.sections.length} sections</span>
                  <span>{totalQuestions} questions</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1.5" />
                  Updated {formatDate(assessment.updatedAt)}
                </div>
              </>
            ) : (
              <div className="text-gray-500 italic">
                No assessment created yet
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasAssessment && assessment && onPreview && (
            <button
              onClick={() => onPreview(assessment)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Preview assessment"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => onEdit(job.id)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={hasAssessment ? "Edit assessment" : "Create assessment"}
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          {hasAssessment && (
            <>
              <button
                onClick={() => onDuplicate(jobWithAssessment)}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Duplicate assessment"
              >
                <DocumentDuplicateIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => onDelete(job.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete assessment"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Assessment Details */}
      {hasAssessment && assessment && (
        <div className="space-y-2">
          {assessment.sections.map((section, index) => (
            <div key={section.id} className="text-sm">
              <span className="font-medium text-gray-700">
                {index + 1}. {section.name}
              </span>
              <span className="text-gray-500 ml-2">
                ({section.questions.length} questions)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AssessmentsPage() {
  const navigate = useNavigate();
  const [jobsWithAssessments, setJobsWithAssessments] = useState<JobWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobsAndAssessments();
  }, []);

  const loadJobsAndAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all jobs
      const jobsResponse = await jobsApi.getJobs(
        { search: '', status: '', sort: 'title' },
        { page: 1, pageSize: 100 }
      );
      const jobs = jobsResponse.data;
      
      // For each job, try to get its assessment
      const jobsWithAssessments: JobWithAssessment[] = await Promise.all(
        jobs.map(async (job) => {
          try {
            const assessment = await assessmentsApi.getAssessment(job.id);
            return {
              job,
              assessment,
              hasAssessment: true,
            };
          } catch (err) {
            // No assessment found for this job
            return {
              job,
              hasAssessment: false,
            };
          }
        })
      );
      
      setJobsWithAssessments(jobsWithAssessments);
    } catch (err) {
      console.error('Failed to load jobs and assessments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate('/assessments/builder/new');
  };

  const handleEdit = (jobId: number) => {
    navigate(`/assessments/builder/${jobId}`);
  };

  const handleDelete = async (_jobId: number) => {
    if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Implement deleteAssessment in API
      toast.success('Delete functionality coming soon');
      // await assessmentsApi.deleteAssessment(jobId);
      // loadJobsAndAssessments();
    } catch (err) {
      console.error('Failed to delete assessment:', err);
      toast.error('Failed to delete assessment');
    }
  };

  const handleDuplicate = async (jobWithAssessment: JobWithAssessment) => {
    try {
      // TODO: Implement assessment duplication
      console.log('Duplicating assessment for job:', jobWithAssessment.job.title);
      toast.success('Assessment duplication feature coming soon');
    } catch (err) {
      console.error('Failed to duplicate assessment:', err);
      toast.error('Failed to duplicate assessment');
    }
  };

  const handlePreview = (assessment: Assessment) => {
    navigate(`/assessments/preview/${assessment.jobId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Assessments</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadJobsAndAssessments}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-600 mt-1">
            Create and manage job-specific assessments for candidates
          </p>
        </div>
        
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Assessment
        </button>
      </div>

      {/* Assessments Grid */}
      {jobsWithAssessments.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto">
            <DocumentDuplicateIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assessments Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first assessment to start evaluating candidates
            </p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Assessment
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobsWithAssessments.map((jobWithAssessment) => (
            <AssessmentCard
              key={jobWithAssessment.job.id}
              jobWithAssessment={jobWithAssessment}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onPreview={handlePreview}
            />
          ))}
        </div>
      )}
    </div>
  );
}