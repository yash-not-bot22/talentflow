import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { candidatesApi } from '../../../api/candidatesApi';
import { jobsApi } from '../../../api/jobsApi';
import type { CandidateTimelineEntry } from '../../../api/candidatesApi';
import type { Candidate, Job } from '../../../db';
import { useCandidateStages, useCandidateOperations } from '../hooks/useCandidates';
import { CandidateKanbanBoard } from '../components/CandidateKanbanBoard';
import { NotesWithMentions as EnhancedNotesWithMentions } from '../components/NotesWithMentions';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon,
  BriefcaseIcon,
  ChatBubbleBottomCenterTextIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import toast from 'react-hot-toast';

interface TimelineStageProps {
  stage: Candidate['stage'];
  label: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isClickable: boolean;
  onClick: () => void;
  timestamp?: number;
}

function TimelineStage({ label, isCompleted, isCurrent, isClickable, onClick, timestamp }: Omit<TimelineStageProps, 'stage'>) {
  const getStageColor = () => {
    if (isCompleted) return 'bg-green-500 border-green-500';
    if (isCurrent) return 'bg-blue-500 border-blue-500';
    return 'bg-gray-200 border-gray-300';
  };

  const getTextColor = () => {
    if (isCompleted || isCurrent) return 'text-gray-900';
    return 'text-gray-500';
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <button
          onClick={onClick}
          disabled={!isClickable}
          className={`
            w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all
            ${getStageColor()}
            ${isClickable ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
            ${isCurrent ? 'ring-4 ring-blue-200 ring-opacity-50' : ''}
          `}
        >
          {isCompleted ? (
            <CheckCircleIcon className="h-6 w-6 text-white" />
          ) : isCurrent ? (
            <ClockIcon className="h-6 w-6 text-white" />
          ) : (
            <div className="w-3 h-3 rounded-full bg-white"></div>
          )}
        </button>
        <div className="mt-2 text-center">
          <p className={`text-sm font-medium ${getTextColor()}`}>{label}</p>
          {timestamp && (
            <p className="text-xs text-gray-400 mt-1">{formatDate(timestamp)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CandidateProfile() {
  const { id: candidateId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Debug logging for params
  console.log('🔍 CandidateProfile rendered with params:', { id: candidateId });
  console.log('🔍 All URL params:', useParams());
  console.log('🔍 Current location:', window.location.pathname);
  
  const { getStageInfo, getStageOptions } = useCandidateStages();
  const { updateCandidate } = useCandidateOperations();
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [timeline, setTimeline] = useState<CandidateTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban'>('timeline');

  useEffect(() => {
    console.log('🔄 useEffect triggered, candidateId:', candidateId);
    
    const fetchCandidateData = async () => {
      console.log('🔍 fetchCandidateData called with candidateId:', candidateId);
      
      if (!candidateId) {
        console.log('❌ No candidateId found in URL params');
        setError('Candidate ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('📡 Starting API calls...');
        
        // Fetch candidate details directly by ID
        console.log('📡 Calling candidatesApi.getCandidate()...');
        const foundCandidate = await candidatesApi.getCandidate(parseInt(candidateId));
        console.log('✅ Candidate API response received:', foundCandidate ? { id: foundCandidate.id, name: foundCandidate.name } : 'NOT FOUND');
        
        if (!foundCandidate) {
          console.log('❌ Candidate not found in response data');
          setError(`Candidate with ID ${candidateId} not found`);
        } else {
          console.log('✅ Setting candidate data');
          setCandidate(foundCandidate);
          
          // Fetch job information
          try {
            console.log('📡 Calling jobsApi.getJob for jobId:', foundCandidate.jobId);
            const jobResponse = await jobsApi.getJob(foundCandidate.jobId);
            console.log('✅ Job API response:', jobResponse);
            setJob(jobResponse);
          } catch (jobError) {
            console.warn('⚠️ Job error:', jobError);
            setJob(null);
          }
          
          console.log('📅 Fetching timeline for candidate:', candidateId);
          
          // Fetch timeline
          try {
            console.log('📡 Calling candidatesApi.getCandidateTimeline()...');
            const timelineResponse = await candidatesApi.getCandidateTimeline(parseInt(candidateId));
            console.log('✅ Timeline API response:', timelineResponse);
            setTimeline(timelineResponse.timeline);
          } catch (timelineError) {
            console.warn('⚠️ Timeline error:', timelineError);
            setTimeline([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch candidate:', err);
        if (err instanceof Error) {
          setError(`Failed to load candidate details: ${err.message}`);
        } else {
          setError('Failed to load candidate details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateData();
  }, [candidateId]);

  const handleStageChange = async (newStage: Candidate['stage']) => {
    if (!candidate || newStage === candidate.stage) return;

    try {
      await updateCandidate(candidate.id, { stage: newStage });
      setCandidate({ ...candidate, stage: newStage });
      
      // Add to timeline
      const newTimelineEntry: CandidateTimelineEntry = {
        type: 'stage_change',
        timestamp: Date.now(),
        stage: newStage,
      };
      setTimeline([newTimelineEntry, ...timeline]);
      
      toast.success(`Moved to ${getStageInfo(newStage).label}`);
    } catch (error) {
      toast.error('Failed to update candidate stage');
    }
  };

  const handleAddNote = async (noteText: string) => {
    if (!candidate) return;

    try {
      await updateCandidate(candidate.id, { notes: noteText });
      
      // Add to timeline
      const newTimelineEntry: CandidateTimelineEntry = {
        type: 'note',
        timestamp: Date.now(),
        text: noteText,
      };
      setTimeline([newTimelineEntry, ...timeline]);
      
      // Update candidate notes
      setCandidate({
        ...candidate,
        notes: [{ text: noteText, timestamp: Date.now() }, ...candidate.notes]
      });
      
      toast.success('Note added successfully');
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCurrentStageIndex = () => {
    if (!candidate) return 0;
    const stages = getStageOptions();
    return stages.findIndex((s: { value: string }) => s.value === candidate.stage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-500">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {error || 'Candidate not found'}
            </h2>
            <button
              onClick={() => navigate('/candidates')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Candidates
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStageIndex = getCurrentStageIndex();
  const stages = getStageOptions();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/candidates')}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {getInitials(candidate.name)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{candidate.name}</h1>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1.5" />
                        {candidate.email}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1.5" />
                        Applied {new Date(candidate.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <BriefcaseIcon className="h-4 w-4 mr-1.5" />
                        {job ? (
                          <button
                            onClick={() => navigate(`/jobs/${candidate.jobId}`)}
                            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {job.title} (#{candidate.jobId})
                          </button>
                        ) : (
                          <span>Job ID #{candidate.jobId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStageInfo(candidate.stage).color}`}>
                  {getStageInfo(candidate.stage).label}
                </span>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </button>
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Application Progress</h3>
              <div className="flex items-center justify-between">
                {stages.map((stage: { value: string; label: string; color: string }, index: number) => {
                  const isCompleted = index < currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  const isClickable = index <= currentStageIndex + 1; // Can move to next stage
                  
                  const stageTimestamp = candidate.history.find((h: { stage: Candidate['stage']; timestamp: number }) => h.stage === stage.value)?.timestamp;

                  return (
                    <div key={stage.value} className="flex items-center">
                      <TimelineStage
                        label={stage.label}
                        isCompleted={isCompleted}
                        isCurrent={isCurrent}
                        isClickable={isClickable}
                        onClick={() => isClickable && handleStageChange(stage.value as Candidate['stage'])}
                        timestamp={stageTimestamp}
                      />
                      
                      {index < stages.length - 1 && (
                        <div className="flex-1 mx-4">
                          <div className={`h-1 rounded-full ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-200'
                          }`}></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Content - Full Width Layout */}
        <div className="space-y-6">
          {/* Stage Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Stage Management</h3>
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'timeline' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ListBulletIcon className="h-4 w-4 mr-2 inline" />
                    Timeline
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'kanban' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Squares2X2Icon className="h-4 w-4 mr-2 inline" />
                    Kanban
                  </button>
                </div>
              </div>

              {/* Conditional View */}
              {viewMode === 'kanban' ? (
                <CandidateKanbanBoard 
                  candidate={candidate}
                  onStageChange={async (_candidateId: number, newStage: Candidate['stage']) => {
                    await handleStageChange(newStage);
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {timeline.map((entry, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          entry.type === 'stage_change' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {entry.type === 'stage_change' ? (
                            <ArrowRightIcon className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          {entry.type === 'stage_change' && entry.stage && (
                            <p className="text-gray-900">
                              Moved to <span className="font-medium">{getStageInfo(entry.stage).label}</span>
                            </p>
                          )}
                          {entry.type === 'note' && entry.text && (
                            <p className="text-gray-900">
                              Added note: <span className="italic">"{entry.text}"</span>
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {timeline.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <ClockIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No activity yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Notes & Comments</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
                  <span>{candidate.notes.length} notes</span>
                </div>
              </div>
              
              <EnhancedNotesWithMentions
                notes={candidate.notes}
                onAddNote={handleAddNote}
              />
            </div>
          </div>
          </div>
        </div>
     
  );
}