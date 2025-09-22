import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers'; // Added for cursor alignment fix
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import type { Candidate, Job } from '../../../db';
import toast from 'react-hot-toast';
import {
  ClockIcon,
  AcademicCapIcon,
  DocumentCheckIcon,
  CheckIcon,
  XCircleIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';


interface StageDefinition {
  id: Candidate['stage'];
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<any>;
}


interface StageBoardProps {
  candidates: Candidate[];
  jobs?: Job[]; // Optional array of jobs for displaying job titles
  onStageChange: (candidateId: number, newStage: Candidate['stage']) => Promise<void>;
  onCandidateClick?: (candidate: Candidate) => void;
  onClose?: () => void;
  isInline?: boolean;
}


interface CandidateCardProps {
  candidate: Candidate;
  jobTitle?: string; // Optional job title for display
  onClick?: (candidate: Candidate) => void;
  isDragOverlay?: boolean; // Added to distinguish overlay rendering
}


function StageCandidateCard({ candidate, jobTitle, onClick, isDragOverlay = false }: CandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: candidate.id.toString(),
    disabled: isDragOverlay, // Disable dragging on overlay copy
  });

  // Fixed cursor alignment: Clean style without conflicting transforms
  const style = {
    opacity: isDragging ? 0.4 : 1, // Fade original when dragging
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    userSelect: 'none' as const,
    // Remove any transforms that could cause cursor misalignment
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      onClick={(e) => {
        if (!isDragOverlay) {
          e.stopPropagation();
          onClick?.(candidate);
        }
      }}
      className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-3 cursor-grab hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 active:cursor-grabbing hover:scale-105 hover:-translate-y-1 hover:rotate-1 relative group overflow-hidden select-none ${
        isDragOverlay ? 'shadow-2xl' : ''
      }`}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative">
        {/* Candidate Header */}
        <div className="flex items-center space-x-3 mb-2">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <span className="text-white text-xs font-semibold">
                {getInitials(candidate.name)}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {candidate.name}
          </h4>
          <p className="text-xs text-gray-500 truncate">{candidate.email}</p>
          {jobTitle && (
            <div className="flex items-center mt-1">
              <BriefcaseIcon className="h-3 w-3 text-gray-400 mr-1" />
              <p className="text-xs text-gray-400 truncate">{jobTitle}</p>
            </div>
          )}
        </div>
      </div>

      {/* Candidate Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatDate(candidate.createdAt)}</span>
        <div className="flex space-x-2">
          <span className="inline-flex items-center">
            <ClockIcon className="h-3 w-3 mr-1" />
            {candidate.history.length}
          </span>
          <span className="inline-flex items-center">
            <DocumentCheckIcon className="h-3 w-3 mr-1" />
            {candidate.notes.length}
          </span>
        </div>
      </div>
      </div>
    </div>
  );
}


interface StageColumnProps {
  stage: StageDefinition;
  candidates: Candidate[];
  jobs: Job[];
  draggedCandidate: Candidate | null;
  isValidTransition: (fromStage: Candidate['stage'], toStage: Candidate['stage']) => boolean;
  onCandidateClick: (candidate: Candidate) => void;
}


function StageColumn({ stage, candidates, jobs, draggedCandidate, isValidTransition, onCandidateClick }: StageColumnProps) {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: stage.id,
  });

  // Helper function to get job title for a candidate
  const getJobTitle = (candidateJobId: number): string | undefined => {
    const job = jobs.find(j => j.id === candidateJobId);
    return job?.title;
  };

  // Determine if this is a valid drop target
  const isValidDropTarget = draggedCandidate ? isValidTransition(draggedCandidate.stage, stage.id) : true;
  const isDragging = draggedCandidate !== null;

  const StageIcon = stage.icon;

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-80 bg-white dark:bg-slate-800 rounded-3xl border-2 transition-all duration-300 shadow-lg relative ${
        isOver && isValidDropTarget ? `${stage.borderColor} bg-opacity-20 shadow-2xl transform scale-105` : 
        isOver && !isValidDropTarget ? 'border-red-400 bg-red-50/50 shadow-lg' :
        isDragging && !isValidDropTarget ? 'border-gray-300 bg-gray-100/50 opacity-50' :
        'border-gray-200 dark:border-slate-700'
      }`}
    >
      <div className="relative">
        {/* Column Header */}
        <div className={`p-4 border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 rounded-t-3xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${stage.bgColor} shadow-lg hover:scale-110 transition-transform duration-300`}>
                <StageIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stage.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stage.description}</p>
              </div>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium backdrop-blur-lg border border-white/30 shadow-lg transition-all duration-300 hover:scale-105 ${stage.color}`}>
              {candidates.length}
            </span>
          </div>
        </div>

        {/* Candidates List - Entire area is droppable */}
        <div className={`p-4 min-h-96 max-h-96 overflow-y-auto relative ${
          isOver && isValidDropTarget ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
        }`}>
          <div className="space-y-3 relative z-10">
            {candidates.map((candidate) => (
              <StageCandidateCard
                key={candidate.id}
                candidate={candidate}
                jobTitle={getJobTitle(candidate.jobId)}
                onClick={onCandidateClick}
              />
            ))}
          </div>
          
          {/* Full area drop zone overlay */}
          {isOver && (
            <div className={`absolute inset-0 border-2 border-dashed rounded-lg flex items-center justify-center z-0 ${
              isValidDropTarget ? `${stage.borderColor} bg-blue-50/30 dark:bg-blue-900/30` : 
              'border-red-400 bg-red-50/50 dark:bg-red-900/30'
            }`}>
              <div className="text-center">
                <StageIcon className={`h-8 w-8 mx-auto mb-2 ${
                  isValidDropTarget ? stage.color.split(' ')[0] : 'text-red-500'
                } opacity-70`} />
                <p className={`text-sm font-medium ${
                  isValidDropTarget ? stage.color.split(' ')[0] : 'text-red-600'
                }`}>
                  {isValidDropTarget ? `Drop to move to ${stage.title}` : 'Invalid transition'}
                </p>
              </div>
            </div>
          )}
          
          {/* Always visible drop zone at bottom when empty or small */}
          {candidates.length === 0 && (
            <div className={`p-6 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 transition-all duration-200 ${
              isOver && isValidDropTarget ? `${stage.borderColor} bg-opacity-20 text-gray-600 border-solid` : 
              isOver && !isValidDropTarget ? 'border-red-400 bg-red-50 text-red-600' :
              isDragging && !isValidDropTarget ? 'border-gray-300 opacity-50' :
              'border-gray-300'
            }`}>
              <div className="text-center">
                <StageIcon className={`h-6 w-6 mx-auto mb-1 transition-all duration-200 ${
                  isOver && isValidDropTarget ? 'opacity-80 scale-110' : 
                  isOver && !isValidDropTarget ? 'opacity-60 text-red-500' :
                  'opacity-50'
                }`} />
                <p className="text-xs">{
                  isOver && !isValidDropTarget ? 'Invalid transition' :
                  isOver && isValidDropTarget ? `Drop to move to ${stage.title}` : 
                  'Drop candidates here'
                }</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Overlay for entire droppable area when dragging */}
        {isOver && (
          <div className={`absolute inset-0 border-2 border-dashed ${
            isValidDropTarget ? stage.borderColor : 'border-red-400'
          } ${
            isValidDropTarget ? `bg-opacity-5 ${stage.bgColor}` : 'bg-red-50'
          } rounded-lg pointer-events-none flex items-center justify-center`}>
            <div className="text-center">
              <StageIcon className={`h-12 w-12 mx-auto mb-2 ${
                isValidDropTarget ? stage.color.split(' ')[0] : 'text-red-500'
              } opacity-70`} />
              <p className={`text-sm font-medium ${
                isValidDropTarget ? stage.color.split(' ')[0] : 'text-red-600'
              }`}>
                {isValidDropTarget ? `Drop to move to ${stage.title}` : 'Invalid transition'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export function CandidateStageBoard({ candidates, jobs = [], onStageChange, onCandidateClick = () => {}, onClose, isInline = false }: StageBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Define stages with better color scheme
  const stageDefinitions: StageDefinition[] = [
    {
      id: 'applied',
      title: 'Applied',
      description: 'New applications',
      color: 'text-blue-700 bg-blue-100',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-400',
      icon: ClockIcon,
    },
    {
      id: 'screen',
      title: 'Screening',
      description: 'Initial review',
      color: 'text-yellow-700 bg-yellow-100',
      bgColor: 'bg-yellow-500',
      borderColor: 'border-yellow-400',
      icon: DocumentCheckIcon,
    },
    {
      id: 'tech',
      title: 'Technical',
      description: 'Technical assessment',
      color: 'text-purple-700 bg-purple-100',
      bgColor: 'bg-purple-500',
      borderColor: 'border-purple-400',
      icon: AcademicCapIcon,
    },
    {
      id: 'offer',
      title: 'Offer',
      description: 'Offer extended',
      color: 'text-green-700 bg-green-100',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-400',
      icon: CheckIcon,
    },
    {
      id: 'hired',
      title: 'Hired',
      description: 'Successfully hired',
      color: 'text-emerald-700 bg-emerald-100',
      bgColor: 'bg-emerald-500',
      borderColor: 'border-emerald-400',
      icon: CheckIcon,
    },
    {
      id: 'rejected',
      title: 'Rejected',
      description: 'Not proceeding',
      color: 'text-red-700 bg-red-100',
      bgColor: 'bg-red-500',
      borderColor: 'border-red-400',
      icon: XCircleIcon,
    },
  ];

  // Group candidates by stage
  const candidatesByStage = stageDefinitions.map(stage => ({
    ...stage,
    candidates: candidates.filter(candidate => candidate.stage === stage.id),
  }));

  // Helper function to validate stage transitions
  const isValidTransition = (fromStage: Candidate['stage'], toStage: Candidate['stage']): boolean => {
    if (fromStage === toStage) return false; // Same stage
    
    // Rejected candidates cannot move anywhere except stay rejected
    if (fromStage === 'rejected' && toStage !== 'rejected') return false;
    
    // Hired candidates cannot be rejected
    if (fromStage === 'hired' && toStage === 'rejected') return false;
    
    // Hired candidates cannot move back to earlier stages
    if (fromStage === 'hired' && toStage !== 'hired') return false;
    
    // Rejected candidates cannot be hired
    if (fromStage === 'rejected' && toStage === 'hired') return false;
    
    // Allow moving to rejected from any stage except hired
    if (toStage === 'rejected' && fromStage !== 'hired') return true;
    
    // Check normal progression (allow forward movement)
    const stageOrder = ['applied', 'screen', 'tech', 'offer', 'hired'];
    const fromIndex = stageOrder.indexOf(fromStage);
    const toIndex = stageOrder.indexOf(toStage);
    
    // Prevent moving backwards in normal progression
    if (fromIndex !== -1 && toIndex !== -1 && toIndex < fromIndex) return false;
    
    return true;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const candidateId = parseInt(event.active.id.toString());
    const candidate = candidates.find(c => c.id === candidateId);
    setActiveId(event.active.id.toString());
    setDraggedCandidate(candidate || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedCandidate(null);

    if (!over) {
      toast.error('❌ Drop zone not found. Please drop the candidate on a valid stage column.');
      return;
    }

    const candidateId = parseInt(active.id.toString());
    const overStage = over.id as Candidate['stage'];
    
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) {
      toast.error('Candidate not found.');
      return;
    }

    // Validate the target stage
    const validStages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];
    if (!validStages.includes(overStage)) {
      toast.error(`Invalid target stage: ${overStage}`);
      return;
    }

    if (candidate.stage === overStage) {
      toast('Candidate is already in this stage.', { duration: 2000 });
      return;
    }

    // Enhanced stage progression validation with more specific error messages
    const stageOrder = ['applied', 'screen', 'tech', 'offer', 'hired'];
    const currentStageIndex = stageOrder.indexOf(candidate.stage);
    const targetStageIndex = stageOrder.indexOf(overStage);
    
    // Get stage titles for better error messages
    const currentStageTitle = stageDefinitions.find(s => s.id === candidate.stage)?.title || candidate.stage;
    const targetStageTitle = stageDefinitions.find(s => s.id === overStage)?.title || overStage;
    
    // Comprehensive validation rules with specific error messages
    if (candidate.stage === 'hired' && overStage === 'rejected') {
      toast.error(`❌ Invalid transition: Cannot reject a hired candidate. ${candidate.name} is already hired and cannot be moved to rejected status.`);
      return;
    }
    
    if (candidate.stage === 'rejected' && overStage === 'hired') {
      toast.error(`❌ Invalid transition: Cannot hire a rejected candidate. ${candidate.name} was rejected and cannot be moved to hired status.`);
      return;
    }
    
    if (candidate.stage === 'rejected' && overStage !== 'rejected') {
      toast.error(`❌ Invalid transition: Cannot move rejected candidates back to active stages. ${candidate.name} cannot re-enter the hiring process.`);
      return;
    }
    
    if (candidate.stage === 'hired' && overStage !== 'hired' && overStage !== 'rejected') {
      toast.error(`❌ Invalid transition: Cannot move hired candidates back to earlier stages. ${candidate.name} is already hired.`);
      return;
    }
    
    // Allow moving to 'rejected' from any stage except 'hired'
    if (overStage === 'rejected' && candidate.stage !== 'hired') {
      toast.success(`Moving ${candidate.name} to rejected stage...`);
    } else if (overStage !== 'rejected' && targetStageIndex !== -1 && currentStageIndex !== -1 && targetStageIndex < currentStageIndex) {
      // Prevent moving backwards in normal progression
      toast.error(`❌ Invalid transition: Cannot move backwards from ${currentStageTitle} to ${targetStageTitle}. ${candidate.name} can only progress forward in the hiring process.`);
      return;
    } else if (overStage !== 'rejected' && targetStageIndex !== -1 && currentStageIndex !== -1 && targetStageIndex > currentStageIndex + 1) {
      // Warn about skipping stages but allow it
      toast(`⚠️ Stage skipping: Moving ${candidate.name} from ${currentStageTitle} to ${targetStageTitle}. Make sure this progression is intended.`, { 
        duration: 4000,
        icon: '⚠️'
      });
    } else {
      // Valid forward progression
      toast.success(`✅ Moving ${candidate.name} from ${currentStageTitle} to ${targetStageTitle}...`);
    }

    try {
      setIsUpdating(true);
      console.log(`🔄 Moving candidate ${candidateId} to stage ${overStage}`);
      await onStageChange(candidateId, overStage);
      const targetStageTitle = stageDefinitions.find(s => s.id === overStage)?.title || overStage;
      toast.success(`Successfully moved ${candidate.name} to ${targetStageTitle}`);
    } catch (error) {
      console.error(`❌ Failed to move candidate:`, error);
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(`Failed to update candidate stage: ${errorMessage}`);
      
      // Log additional debug info
      console.error('Debug info:', {
        candidateId,
        currentStage: candidate.stage,
        targetStage: overStage,
        error
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const activeCandidate = activeId ? candidates.find(c => c.id.toString() === activeId) : null;

  // Helper function to get job title for active candidate
  const getJobTitle = (candidateJobId: number): string | undefined => {
    const job = jobs.find(j => j.id === candidateJobId);
    return job?.title;
  };

  // Inline rendering (no modal wrapper)
  if (isInline) {
    return (
      <div className="relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-700/30 rounded-3xl">
        {/* Minimalistic geometric background */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20 rounded-3xl overflow-hidden">
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="board-geometric-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="1" fill="currentColor" className="text-blue-300 dark:text-blue-600" opacity="0.3"/>
                <circle cx="0" cy="0" r="1" fill="currentColor" className="text-purple-300 dark:text-purple-600" opacity="0.2"/>
                <circle cx="100" cy="0" r="1" fill="currentColor" className="text-pink-300 dark:text-pink-600" opacity="0.2"/>
                <circle cx="0" cy="100" r="1" fill="currentColor" className="text-blue-300 dark:text-blue-600" opacity="0.2"/>
                <circle cx="100" cy="100" r="1" fill="currentColor" className="text-purple-300 dark:text-purple-600" opacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#board-geometric-pattern)" />
          </svg>
        </div>
        {/* Stage Board */}
        <div className="overflow-x-auto p-6">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 min-w-max">
              {candidatesByStage.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  candidates={stage.candidates}
                  jobs={jobs}
                  draggedCandidate={draggedCandidate}
                  isValidTransition={isValidTransition}
                  onCandidateClick={onCandidateClick}
                />
              ))}
            </div>

            {/* FIXED: DragOverlay with proper cursor alignment */}
            <DragOverlay
              modifiers={[snapCenterToCursor]} // This fixes cursor alignment
              dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              }}
            >
              {activeCandidate ? (
                <StageCandidateCard
                  candidate={activeCandidate}
                  jobTitle={getJobTitle(activeCandidate.jobId)}
                  isDragOverlay={true}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Loading Overlay */}
        {isUpdating && (
          <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 flex items-center space-x-3 shadow-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-900">Updating candidate stage...</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Modal rendering (original)
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[70]">
      <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-700/30 rounded-3xl max-w-7xl w-full max-h-full m-4 flex flex-col border-2 border-gray-200 dark:border-slate-700 shadow-2xl relative">
        {/* Minimalistic geometric background */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20 rounded-3xl overflow-hidden">
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="modal-geometric-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="1" fill="currentColor" className="text-blue-300 dark:text-blue-600" opacity="0.3"/>
                <circle cx="0" cy="0" r="1" fill="currentColor" className="text-purple-300 dark:text-purple-600" opacity="0.2"/>
                <circle cx="100" cy="0" r="1" fill="currentColor" className="text-pink-300 dark:text-pink-600" opacity="0.2"/>
                <circle cx="0" cy="100" r="1" fill="currentColor" className="text-blue-300 dark:text-blue-600" opacity="0.2"/>
                <circle cx="100" cy="100" r="1" fill="currentColor" className="text-purple-300 dark:text-purple-600" opacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#modal-geometric-pattern)" />
          </svg>
        </div>
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Candidate Stage Board</h2>
              <p className="text-gray-600 dark:text-gray-400">Drag candidates between stages to update their status</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 shadow-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:shadow-xl rounded-xl transition-all duration-300 hover:scale-105 hover:rotate-3"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
        
        {/* Stage Board */}
        <div className="flex-1 p-6 overflow-x-auto">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 min-w-max h-full">
              {candidatesByStage.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  candidates={stage.candidates}
                  jobs={jobs}
                  draggedCandidate={draggedCandidate}
                  isValidTransition={isValidTransition}
                  onCandidateClick={onCandidateClick}
                />
              ))}
            </div>

            {/* FIXED: DragOverlay with proper cursor alignment */}
            <DragOverlay
              modifiers={[snapCenterToCursor]} // This fixes cursor alignment
              dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              }}
            >
              {activeCandidate ? (
                <StageCandidateCard
                  candidate={activeCandidate}
                  jobTitle={getJobTitle(activeCandidate.jobId)}
                  isDragOverlay={true}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Loading Overlay */}
        {isUpdating && (
          <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center rounded-xl">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-900">Updating candidate stage...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
