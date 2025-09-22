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

    // Validate required fields
    const allQuestions = assessment.sections.flatMap(section => section.questions);
    const requiredQuestions = allQuestions.filter(q => q.required);
    const missingAnswers: string[] = [];

    for (const question of requiredQuestions) {
      const answer = candidateResponses[question.id];
      if (answer === null || answer === undefined || answer === '' || 
          (Array.isArray(answer) && answer.length === 0)) {
        missingAnswers.push(question.id);
      }
    }

    // If there are missing required answers, scroll to first missing field and show error
    if (missingAnswers.length > 0) {
      // Find the first missing question element and scroll to it
      const firstMissingElement = document.getElementById(`question-${missingAnswers[0]}`);
      if (firstMissingElement) {
        firstMissingElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Add a visual highlight to the missing field
        firstMissingElement.classList.add('ring-2', 'ring-red-500', 'ring-opacity-50');
        setTimeout(() => {
          firstMissingElement.classList.remove('ring-2', 'ring-red-500', 'ring-opacity-50');
        }, 3000);
      }
      
      addNotification({
        type: 'error',
        title: 'Required Fields Missing',
        message: `Please fill in all required fields before submitting. ${missingAnswers.length} field(s) are missing.`
      });
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
    const hasError = question.required && (!candidateResponses[questionKey] || candidateResponses[questionKey] === '' || 
      (Array.isArray(candidateResponses[questionKey]) && candidateResponses[questionKey].length === 0));

    return (
      <div 
        key={question.id} 
        id={`question-${question.id}`}
        className={`mb-6 p-4 border rounded-lg bg-white dark:bg-slate-700 transition-all duration-300 ${
          hasError ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-slate-600'
        }`}
      >
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          {sectionIndex + 1}.{questionIndex + 1} {question.text}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {hasError && (
          <p className="text-red-600 dark:text-red-400 text-xs mb-2 font-medium">
            This field is required
          </p>
        )}
        
        {question.type === 'short-text' && (
          <input
            type="text"
            value={currentValue as string}
            onChange={(e) => handleResponseChange(questionKey, e.target.value)}
            className="w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
            placeholder="Your answer..."
            maxLength={question.maxLength}
          />
        )}
        
        {question.type === 'long-text' && (
          <textarea
            value={currentValue as string}
            onChange={(e) => handleResponseChange(questionKey, e.target.value)}
            rows={4}
            className="w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
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
                <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
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
                <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        )}
        
        {question.type === 'numeric' && (
          <input
            type="number"
            value={currentValue as number || ''}
            onChange={(e) => handleResponseChange(questionKey, e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
    <div className="min-h-screen backdrop-blur-xl bg-gradient-to-br from-blue-50/80 via-purple-50/80 to-pink-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-slate-900/80">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 rounded-3xl p-6 border border-white/30 dark:border-slate-700/30 shadow-xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl"></div>
          <div className="flex items-center space-x-4 relative">
            <Link
              to="/jobs"
              className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-4 py-2 rounded-xl backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Back to Jobs
            </Link>
          </div>
        </div>

      {/* Job Info */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border border-white/30 dark:border-slate-700/30 rounded-3xl p-6 shadow-xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{job.title}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{job.slug}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium backdrop-blur-lg border transition-all duration-300 hover:scale-105 ${
              job.status === 'active' 
                ? 'bg-green-100/80 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-800/50' 
                : 'bg-gray-100/80 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200/50 dark:border-gray-700/50'
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
                  className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 text-gray-700 dark:text-gray-300 border border-white/30 dark:border-slate-600/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assessment Section */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border border-white/30 dark:border-slate-700/30 rounded-3xl p-6 shadow-xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Assessment</h2>
          <div className="flex space-x-3">
            {assessment ? (
              <>
                <button
                  onClick={handleEditAssessment}
                  className="inline-flex items-center px-4 py-2 backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 shadow-lg text-sm font-medium rounded-xl text-blue-600 dark:text-blue-400 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:rotate-1"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Assessment
                </button>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`inline-flex items-center px-4 py-2 backdrop-blur-lg border border-white/30 dark:border-slate-600/30 shadow-lg text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                    previewMode 
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/50 hover:bg-blue-200/80 dark:hover:bg-blue-900/70' 
                      : 'text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-slate-700/60 hover:bg-white/80 dark:hover:bg-slate-700/80'
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{assessment.sections.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{getTotalQuestions(assessment)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Last Updated</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  {formatDate(assessment.updatedAt)}
                </div>
              </div>
            </div>

            {/* Assessment Sections */}
            {!previewMode ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sections</h3>
                {assessment.sections.map((section, index) => (
                  <div key={section.id} className="border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        {index + 1}. {section.name}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {section.questions.length} question{section.questions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {section.questions.map((question, qIndex) => (
                        <div key={question.id} className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">{qIndex + 1}.</span> {question.text}
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
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
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200">Candidate View</h3>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    This is how candidates will see and complete the assessment.
                  </p>
                </div>

                {/* Candidate Selection */}
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Simulating as:</h4>
                      {selectedCandidate ? (
                        <div className="flex items-center mt-2">
                          <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                              {selectedCandidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedCandidate.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{selectedCandidate.email}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No candidate selected</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCandidateModal(true)}
                      className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      {selectedCandidate ? 'Change Candidate' : 'Select Candidate'}
                    </button>
                  </div>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); handleSubmitResponse(); }} className="space-y-6">
                  {assessment.sections.map((section, sectionIndex) => (
                    <div key={section.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
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
                      className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 backdrop-blur-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:rotate-1 font-medium"
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
            <DocumentTextIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Assessment Created</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This job doesn't have an assessment yet. Create one to start evaluating candidates.
            </p>
            <button
              onClick={handleCreateAssessment}
              className="inline-flex items-center px-6 py-3 backdrop-blur-lg bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:rotate-1 font-medium"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Create Assessment
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Candidate Search Modal */}
      <CandidateSearchModal
        isOpen={showCandidateModal}
        onClose={() => setShowCandidateModal(false)}
        onSelectCandidate={handleCandidateSelect}
        jobId={parseInt(jobId || '0')}
      />
      </div>
    </div>
  );
}