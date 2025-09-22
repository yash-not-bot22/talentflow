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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-700/30 flex items-center justify-center relative overflow-hidden">
        {/* Geometric background */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10">
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="loading-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <circle cx="25" cy="25" r="1" fill="currentColor" className="text-blue-400" opacity="0.6"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#loading-pattern)"/>
          </svg>
        </div>
        
        <div className="text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 dark:border-slate-700/50">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-700/30 relative overflow-hidden">
        {/* Geometric background */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10">
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="error-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1" fill="currentColor" className="text-red-400" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#error-pattern)"/>
          </svg>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8 text-center hover:shadow-2xl transition-all duration-500">
            <div className="w-12 h-12 bg-red-100/80 dark:bg-red-900/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {error || 'Candidate not found'}
            </h2>
            <button
              onClick={() => navigate('/candidates')}
              className="inline-flex items-center px-4 py-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/50 shadow-lg text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-slate-600/80 hover:shadow-xl transition-all duration-300"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-700/30 relative overflow-hidden">
      {/* Animated geometric background */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="profile-geometric-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="1.5" fill="currentColor" className="text-blue-400 dark:text-blue-500" opacity="0.4"/>
              <circle cx="0" cy="0" r="1" fill="currentColor" className="text-purple-400 dark:text-purple-500" opacity="0.3"/>
              <circle cx="100" cy="0" r="1" fill="currentColor" className="text-pink-400 dark:text-pink-500" opacity="0.3"/>
              <circle cx="0" cy="100" r="1" fill="currentColor" className="text-blue-400 dark:text-blue-500" opacity="0.3"/>
              <circle cx="100" cy="100" r="1" fill="currentColor" className="text-purple-400 dark:text-purple-500" opacity="0.3"/>
              <path d="M50,0 L100,50 L50,100 L0,50 Z" fill="none" stroke="currentColor" stroke-width="0.5" className="text-blue-300 dark:text-blue-600" opacity="0.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#profile-geometric-pattern)"/>
        </svg>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 dark:border-slate-700/50 mb-6 hover:shadow-3xl transition-all duration-700 relative overflow-hidden">
          {/* Enhanced glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-blue-50/20 to-purple-50/20 dark:from-slate-700/20 dark:via-slate-600/20 dark:to-slate-500/20 rounded-3xl"></div>
          
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-slate-400/10 rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-1000 transform -skew-x-12 animate-pulse"></div>
          
          <div className="relative px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/candidates')}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {getInitials(candidate.name)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{candidate.name}</h1>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
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
                <span className={`inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold backdrop-blur-md border border-white/20 dark:border-slate-600/30 shadow-lg ${getStageInfo(candidate.stage).color}`}>
                  {getStageInfo(candidate.stage).label}
                </span>
                <button className="inline-flex items-center px-5 py-2.5 bg-white/60 dark:bg-slate-700/60 backdrop-blur-md border border-white/30 dark:border-slate-600/50 shadow-xl text-sm font-semibold rounded-2xl text-gray-700 dark:text-gray-200 hover:bg-white/90 dark:hover:bg-slate-600/90 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </button>
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="bg-gradient-to-br from-slate-100/90 via-blue-100/70 to-purple-100/70 dark:from-slate-700/70 dark:via-slate-600/60 dark:to-slate-500/60 backdrop-blur-xl rounded-3xl p-8 border border-white/40 dark:border-slate-600/40 shadow-xl hover:shadow-2xl transition-all duration-700 relative overflow-hidden">
              {/* Glass overlay */}
              <div className="absolute inset-0 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-3xl"></div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8">Application Progress</h3>
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
                            isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-600'
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
        </div>

        {/* Content - Full Width Layout */}
        <div className="space-y-6">
          {/* Stage Management */}
          <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-slate-700/60 p-8 hover:shadow-3xl transition-all duration-700 relative overflow-hidden">
            {/* Enhanced glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-blue-50/15 to-purple-50/15 dark:from-slate-700/15 dark:via-slate-600/15 dark:to-slate-500/15 rounded-3xl"></div>
            
            {/* Animated border effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stage Management</h3>
                <div className="flex items-center space-x-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg rounded-2xl p-1.5 border border-white/30 dark:border-slate-700/40 shadow-xl">
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                      viewMode === 'timeline' 
                        ? 'bg-white/90 dark:bg-slate-700/90 text-blue-600 dark:text-blue-400 shadow-lg backdrop-blur-md border border-white/40 dark:border-slate-600/40' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <ListBulletIcon className="h-4 w-4 mr-2 inline" />
                    Timeline
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                      viewMode === 'kanban' 
                        ? 'bg-white/90 dark:bg-slate-700/90 text-blue-600 dark:text-blue-400 shadow-lg backdrop-blur-md border border-white/40 dark:border-slate-600/40' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-slate-700/60'
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
                <div className="space-y-6">
                  {timeline.map((entry, index) => (
                    <div key={index} className="flex items-start space-x-6 bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl rounded-2xl p-6 border border-white/30 dark:border-slate-600/40 shadow-xl hover:shadow-2xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-500 hover:scale-[1.02]">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-lg border border-white/30 dark:border-slate-600/40 shadow-xl ${
                          entry.type === 'stage_change' ? 'bg-blue-100/90 dark:bg-blue-900/70' : 'bg-green-100/90 dark:bg-green-900/70'
                        }`}>
                          {entry.type === 'stage_change' ? (
                            <ArrowRightIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          {entry.type === 'stage_change' && entry.stage && (
                            <p className="text-gray-900 dark:text-white font-medium">
                              Moved to <span className="font-semibold text-blue-600 dark:text-blue-400">{getStageInfo(entry.stage).label}</span>
                            </p>
                          )}
                          {entry.type === 'note' && entry.text && (
                            <p className="text-gray-900 dark:text-white">
                              Added note: <span className="italic font-medium text-gray-700 dark:text-gray-300">"{entry.text}"</span>
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 bg-white/40 dark:bg-slate-600/40 backdrop-blur-sm rounded-lg px-3 py-1 inline-block">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {timeline.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-slate-700/50 backdrop-blur-lg rounded-2xl border border-white/30 dark:border-slate-600/40 shadow-xl">
                      <ClockIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No activity yet</p>
                      <p className="text-sm mt-2">Timeline entries will appear here as the candidate progresses</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-slate-700/60 p-8 hover:shadow-3xl transition-all duration-700 relative overflow-hidden">
              {/* Enhanced glassmorphism overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-blue-50/15 to-purple-50/15 dark:from-slate-700/15 dark:via-slate-600/15 dark:to-slate-500/15 rounded-3xl"></div>
              
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-slate-400/10 rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-1000 transform -skew-x-12"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Notes & Comments</h3>
                  <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300 bg-white/40 dark:bg-slate-700/40 backdrop-blur-lg rounded-xl px-4 py-2 border border-white/30 dark:border-slate-600/40 shadow-lg">
                    <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
                    <span className="font-semibold">{candidate.notes.length} notes</span>
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
      </div>
    </div>
  );
}