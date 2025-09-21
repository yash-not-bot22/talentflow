import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { assessmentsApi } from '../../../api/assessmentsApi';
import { candidatesApi } from '../../../api/candidatesApi';
import type { CandidateResponse, Assessment, Candidate } from '../../../db';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

export function CandidateResponseDetail() {
  const { jobId, responseId } = useParams<{ jobId: string; responseId: string }>();
  const navigate = useNavigate();
  
  const [response, setResponse] = useState<CandidateResponse | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!jobId || !responseId) {
        setError('Missing job or response ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get all responses for the job and find the specific one
        const responses = await assessmentsApi.getResponses(parseInt(jobId));
        const targetResponse = responses.find(r => r.id === parseInt(responseId));
        
        if (!targetResponse) {
          setError('Response not found');
          return;
        }
        
        setResponse(targetResponse);

        // Get the assessment to show questions
        const assessmentData = await assessmentsApi.getAssessment(parseInt(jobId));
        setAssessment(assessmentData);

        // Get candidate details
        const candidateData = await candidatesApi.getCandidate(targetResponse.candidateId);
        setCandidate(candidateData);

      } catch (err) {
        console.error('Failed to load response details:', err);
        setError('Failed to load response details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [jobId, responseId]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderQuestionResponse = (questionId: string, questionType: string) => {
    const answer = response?.responses[questionId];
    
    if (answer === null || answer === undefined || answer === '') {
      return <span className="text-gray-400 italic">No answer provided</span>;
    }

    switch (questionType) {
      case 'single-choice':
        return <span className="text-gray-900 font-medium">{String(answer)}</span>;
      
      case 'multi-choice':
        if (Array.isArray(answer)) {
          return (
            <div className="flex flex-wrap gap-2">
              {answer.map((choice, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {choice}
                </span>
              ))}
            </div>
          );
        }
        return <span className="text-gray-900">{String(answer)}</span>;
      
      case 'short-text':
      case 'long-text':
        return <div className="text-gray-900 whitespace-pre-wrap">{String(answer)}</div>;
      
      case 'numeric':
        return <span className="text-gray-900 font-mono">{String(answer)}</span>;
      
      case 'file-upload':
        return <span className="text-blue-600 underline">{String(answer)}</span>;
      
      default:
        return <span className="text-gray-900">{String(answer)}</span>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !response || !assessment || !candidate) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/jobs/${jobId}`)}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Job Details
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700 text-sm mt-1">{error || 'Failed to load response details'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/jobs/${jobId}`)}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Job Details
        </button>
      </div>

      {/* Response Header */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {getInitials(candidate.name)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{candidate.name}</h1>
                <p className="text-blue-100 mt-1">{candidate.email}</p>
                <div className="flex items-center mt-2 text-blue-100">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">Submitted {formatDate(response.submittedAt)}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white/80 text-sm">Response ID</div>
              <div className="text-white font-mono text-lg">#{response.id}</div>
            </div>
          </div>
        </div>

        {/* Response Stats */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{Object.keys(response.responses).length}</div>
              <div className="text-sm text-gray-500">Questions Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{assessment.sections.length}</div>
              <div className="text-sm text-gray-500">Sections Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((Object.keys(response.responses).length / assessment.sections.reduce((total, section) => total + section.questions.length, 0)) * 100)}%
              </div>
              <div className="text-sm text-gray-500">Completion Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Responses */}
      <div className="space-y-6">
        {assessment.sections.map((section, sectionIndex) => (
          <div key={section.id} className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{section.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Section {sectionIndex + 1} • {section.questions.length} question{section.questions.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {section.questions.map((question, questionIndex) => (
                  <div key={question.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Q{questionIndex + 1}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {question.type}
                          </span>
                          {question.required && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Required
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-medium text-gray-900 mb-3">{question.text}</h3>
                        
                        {/* Show options for choice questions */}
                        {(question.type === 'single-choice' || question.type === 'multi-choice') && question.options && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-2">Available options:</p>
                            <div className="flex flex-wrap gap-2">
                              {question.options.map((option, optionIndex) => (
                                <span key={optionIndex} className="inline-flex items-center px-2 py-1 rounded border text-xs text-gray-600 bg-gray-50">
                                  {option}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Candidate's Response:</div>
                      <div className="text-sm">
                        {renderQuestionResponse(question.id, question.type)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}