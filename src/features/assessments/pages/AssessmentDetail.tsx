import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  PencilIcon,
  ChevronLeftIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  EyeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import type { Assessment, Job } from '../../../db';
import { assessmentsApi, type SubmissionData } from '../../../api/assessmentsApi';
import { jobsApi } from '../../../api/jobsApi';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { useNotifications } from '../../../hooks/useNotifications';
import { CandidateSearchModal } from '../components/CandidateSearchModal';
import type { Candidate } from '../../../db';

export function AssessmentDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [candidateResponses, setCandidateResponses] = useState<Record<string, string | string[] | number | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setError('Job ID is required');
      setLoading(false);
      return;
    }

    loadAssessmentAndJob();
  }, [jobId]);

  const loadAssessmentAndJob = async () => {
    if (!jobId) return;
    
    setLoading(true);
    setError(null);

    try {
      const jobIdNum = parseInt(jobId);
      
      // Load job and assessment in parallel
      const [jobResult, assessmentResult] = await Promise.allSettled([
        jobsApi.getJob(jobIdNum),
        assessmentsApi.getAssessment(jobIdNum)
      ]);

      // Handle job result
      if (jobResult.status === 'fulfilled') {
        setJob(jobResult.value);
      } else {
        throw new Error('Job not found');
      }

      // Handle assessment result
      if (assessmentResult.status === 'fulfilled') {
        setAssessment(assessmentResult.value);
      } else {
        // No assessment found - this is okay, we'll show create option
        setAssessment(null);
      }
    } catch (err) {
      console.error('Failed to load assessment or job:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalQuestions = (assessment: Assessment) => {
    return assessment.sections.reduce((total, section) => total + section.questions.length, 0);
  };

  const handleCreateAssessment = () => {
    navigate(`/assessment/${jobId}/edit`);
  };

  const handleEditAssessment = () => {
    navigate(`/assessment/${jobId}/edit`);
  };

  const handleSubmitResponse = async () => {
    if (!jobId || !assessment) return;

    // Check if candidate is selected
    if (!selectedCandidate) {
      setShowCandidateModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const submissionData: SubmissionData = {
        candidateId: selectedCandidate.id,
        responses: candidateResponses
      };

      await assessmentsApi.submitResponse(parseInt(jobId), submissionData);
      addNotification({ 
        type: 'success', 
        title: 'Success', 
        message: `Assessment submitted successfully for ${selectedCandidate.name}!` 
      });
      
      // Reset form
      setCandidateResponses({});
      setSelectedCandidate(null);
      setPreviewMode(false);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      addNotification({ 
        type: 'error', 
        title: 'Error', 
        message: error instanceof Error ? error.message : 'Failed to submit assessment' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCandidateSelect = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateModal(false);
  };

  const handleResponseChange = (questionId: string, value: string | string[] | number | null) => {
    setCandidateResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const renderCandidateQuestion = (question: any, sectionIndex: number, questionIndex: number) => {
    const questionKey = `${question.id}`;
    const currentValue = candidateResponses[questionKey] || '';

    return (
      <div key={question.id} className="mb-6 p-4 border border-gray-200 rounded-lg">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {sectionIndex + 1}.{questionIndex + 1} {question.text}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {question.type === 'short-text' && (
          <input
            type="text"
            value={currentValue as string}
            onChange={(e) => handleResponseChange(questionKey, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Your answer..."
            maxLength={question.maxLength}
          />
        )}
        
        {question.type === 'long-text' && (
          <textarea
            value={currentValue as string}
            onChange={(e) => handleResponseChange(questionKey, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Your answer..."
            maxLength={question.maxLength}
          />
        )}
        
        {question.type === 'single-choice' && question.options && (
          <div className="space-y-2">
            {question.options.map((option: string, idx: number) => (
              <label key={idx} className="flex items-center">
                <input
                  type="radio"
                  name={questionKey}
                  value={option}
                  checked={currentValue === option}
                  onChange={(e) => handleResponseChange(questionKey, e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}
        
        {question.type === 'multi-choice' && question.options && (
          <div className="space-y-2">
            {question.options.map((option: string, idx: number) => (
              <label key={idx} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(currentValue) && currentValue.includes(option)}
                  onChange={(e) => {
                    const currentArray = Array.isArray(currentValue) ? currentValue : [];
                    if (e.target.checked) {
                      handleResponseChange(questionKey, [...currentArray, option]);
                    } else {
                      handleResponseChange(questionKey, currentArray.filter(v => v !== option));
                    }
                  }}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}
        
        {question.type === 'numeric' && (
          <input
            type="number"
            value={currentValue as number || ''}
            onChange={(e) => handleResponseChange(questionKey, e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter a number..."
            min={question.min}
            max={question.max}
          />
        )}
        
        {question.type === 'file-upload' && (
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              handleResponseChange(questionKey, file ? file.name : null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )}
        
        {/* Debug info */}
        <div className="mt-2 text-xs text-gray-400">
          Type: {question.type} | Current value: {JSON.stringify(currentValue)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error || 'Job not found'}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/jobs"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back to Jobs
          </Link>
        </div>
      </div>

      {/* Job Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-600 mt-1">{job.slug}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            job.status === 'active' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {job.status === 'active' && <CheckCircleIcon className="h-4 w-4 mr-1" />}
            {job.status}
          </span>
        </div>

        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Assessment Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Assessment</h2>
          <div className="flex space-x-3">
            {assessment ? (
              <>
                <button
                  onClick={handleEditAssessment}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Assessment
                </button>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg transition-colors ${
                    previewMode 
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                      : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {previewMode ? (
                    <>
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Exit Preview
                    </>
                  ) : (
                    <>
                      <UserIcon className="h-4 w-4 mr-2" />
                      Preview as Candidate
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={handleCreateAssessment}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Create Assessment
              </button>
            )}
          </div>
        </div>

        {assessment ? (
          <div className="space-y-6">
            {/* Assessment Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{assessment.sections.length}</div>
                <div className="text-sm text-gray-600">Sections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{getTotalQuestions(assessment)}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Last Updated</div>
                <div className="text-sm font-medium text-gray-900">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  {formatDate(assessment.updatedAt)}
                </div>
              </div>
            </div>

            {/* Assessment Sections */}
            {!previewMode ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Sections</h3>
                {assessment.sections.map((section, index) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-medium text-gray-900">
                        {index + 1}. {section.name}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {section.questions.length} question{section.questions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {section.questions.map((question, qIndex) => (
                        <div key={question.id} className="text-sm text-gray-600">
                          <span className="font-medium">{qIndex + 1}.</span> {question.text}
                          <span className="ml-2 text-xs text-gray-500">
                            ({question.type})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-medium text-blue-900">Candidate View</h3>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    This is how candidates will see and complete the assessment.
                  </p>
                </div>

                {/* Candidate Selection */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Simulating as:</h4>
                      {selectedCandidate ? (
                        <div className="flex items-center mt-2">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-blue-700">
                              {selectedCandidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{selectedCandidate.name}</p>
                            <p className="text-xs text-gray-500">{selectedCandidate.email}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">No candidate selected</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCandidateModal(true)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {selectedCandidate ? 'Change Candidate' : 'Select Candidate'}
                    </button>
                  </div>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); handleSubmitResponse(); }} className="space-y-6">
                  {assessment.sections.map((section, sectionIndex) => (
                    <div key={section.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {sectionIndex + 1}. {section.name}
                      </h3>
                      
                      <div className="space-y-4">
                        {section.questions.map((question, questionIndex) => 
                          renderCandidateQuestion(question, sectionIndex, questionIndex)
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setPreviewMode(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Submitting...' : 'Submit Assessment'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessment Created</h3>
            <p className="text-gray-600 mb-6">
              This job doesn't have an assessment yet. Create one to start evaluating candidates.
            </p>
            <button
              onClick={handleCreateAssessment}
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Create Assessment
            </button>
          </div>
        )}
      </div>

      {/* Candidate Search Modal */}
      <CandidateSearchModal
        isOpen={showCandidateModal}
        onClose={() => setShowCandidateModal(false)}
        onSelectCandidate={handleCandidateSelect}
        jobId={parseInt(jobId || '0')}
      />
    </div>
  );
}