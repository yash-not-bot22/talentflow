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
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Candidate } from '../../../db';
import toast from 'react-hot-toast';
import {
  ClockIcon,
  AcademicCapIcon,
  DocumentCheckIcon,
  CheckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolidIcon,
  ClockIcon as ClockSolidIcon,
  AcademicCapIcon as AcademicCapSolidIcon,
  DocumentCheckIcon as DocumentCheckSolidIcon,
  CheckIcon as CheckSolidIcon,
  XCircleIcon as XCircleSolidIcon,
} from '@heroicons/react/24/solid';

interface KanbanStage {
  id: Candidate['stage'];
  title: string;
  description: string;
  color: string;
  bgColor: string;
  iconOutline: React.ComponentType<any>;
  iconSolid: React.ComponentType<any>;
  candidates: Candidate[];
}

interface CandidateCardProps {
  candidate: Candidate;
  isActive?: boolean;
  isDragging?: boolean;
}

function CandidateCard({ candidate, isActive = false, isDragging = false }: CandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({
    id: candidate.id.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-600 shadow-sm p-3 cursor-grab hover:shadow-md transition-all duration-200
        ${isActive ? 'ring-2 ring-blue-500 shadow-lg' : ''}
        ${isOver ? 'ring-2 ring-green-400' : ''}
        ${isDragging ? 'rotate-2 scale-105' : ''}
      `}
    >
      {/* Candidate Header */}
      <div className="flex items-center space-x-3 mb-2">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
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

      {/* Drag Indicator */}
      <div className="mt-2 flex justify-center">
        <div className="w-6 h-1 bg-gray-200 dark:bg-slate-600 rounded-full"></div>
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  stage: KanbanStage;
  isActive: boolean;
  isCompleted: boolean;
  onCandidateClick: (candidate: Candidate) => void;
}

function KanbanColumn({ stage, isActive, isCompleted, onCandidateClick }: KanbanColumnProps) {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: stage.id,
  });

  const IconOutline = stage.iconOutline;
  const IconSolid = stage.iconSolid;

  return (
    <div
      ref={setNodeRef}
      className={`
        w-full bg-white dark:bg-slate-800 rounded-lg border-2 dark:border-slate-600 transition-all duration-300 min-h-96 flex flex-col
        ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
        ${isActive ? 'ring-2 ring-blue-500 ring-opacity-50 border-blue-400' : ''}
        ${isCompleted ? 'bg-green-50 border-green-300' : ''}
      `}
      style={{
        // Ensure the entire column area is droppable
        position: 'relative',
      }}
    >
      {/* Column Header */}
      <div className={`p-4 border-b border-gray-200 dark:border-slate-600 ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`
              p-2 rounded-lg transition-all duration-200
              ${isCompleted ? 'bg-green-100 dark:bg-green-900/50' : isActive ? stage.bgColor : 'bg-white dark:bg-slate-700'}
            `}>
              {isCompleted ? (
                <IconSolid className={`h-5 w-5 ${isCompleted ? 'text-green-600' : stage.color}`} />
              ) : (
                <IconOutline className={`h-5 w-5 ${isActive ? 'text-white' : stage.color}`} />
              )}
            </div>
            <div>
              <h3 className={`
                text-base font-semibold transition-colors
                ${isCompleted ? 'text-green-800 dark:text-green-400' : 'text-gray-900 dark:text-white'}
              `}>
                {stage.title}
              </h3>
              <p className="text-sm text-gray-500">{stage.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200">
              {stage.candidates.length}
            </span>
            {isCompleted && (
              <CheckCircleSolidIcon className="h-5 w-5 text-green-500" />
            )}
          </div>
        </div>
      </div>

      {/* Candidates List - Make the entire area droppable */}
      <div className="p-4 flex-1 relative">
        {/* Enhanced drop zone overlay */}
        {isOver && (
          <div className="absolute inset-2 border-2 border-dashed border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 bg-opacity-75 rounded-lg flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center">
              <IconSolid className="h-12 w-12 mx-auto mb-2 text-blue-500" />
              <p className="text-lg font-medium text-blue-700">Drop candidate here</p>
              <p className="text-sm text-blue-600">Move to {stage.title}</p>
            </div>
          </div>
        )}
        
        <div className="space-y-3 min-h-48">
          {stage.candidates.map((candidate) => (
            <div key={candidate.id} onClick={() => onCandidateClick(candidate)}>
              <CandidateCard candidate={candidate} />
            </div>
          ))}
          
          {/* Drop Zone Indicator - Enhanced */}
          {stage.candidates.length === 0 && (
            <div className={`
              h-40 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200
              ${isOver 
                ? 'border-blue-400 bg-blue-50 text-blue-600' 
                : 'border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500'
              }
            `}>
              <div className="text-center">
                <IconOutline className={`h-10 w-10 mx-auto mb-2 opacity-50 ${isOver ? 'opacity-100' : ''}`} />
                <p className="text-sm font-medium">
                  {isOver ? 'Release to drop here' : 'Drag candidates here'}
                </p>
                <p className="text-xs mt-1 opacity-75">
                  {isOver ? `Moving to ${stage.title}` : `to move to ${stage.title}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CandidateKanbanBoardProps {
  candidate: Candidate;
  onStageChange: (candidateId: number, newStage: Candidate['stage']) => Promise<void>;
  onCandidateClick?: (candidate: Candidate) => void;
}

export function CandidateKanbanBoard({ 
  candidate, 
  onStageChange, 
  onCandidateClick = () => {} 
}: CandidateKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Define stages with their properties
  const stages: KanbanStage[] = [
    {
      id: 'applied',
      title: 'Applied',
      description: 'Initial application',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      iconOutline: ClockIcon,
      iconSolid: ClockSolidIcon,
      candidates: candidate.stage === 'applied' ? [candidate] : [],
    },
    {
      id: 'screen',
      title: 'Screening',
      description: 'Initial review',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500',
      iconOutline: DocumentCheckIcon,
      iconSolid: DocumentCheckSolidIcon,
      candidates: candidate.stage === 'screen' ? [candidate] : [],
    },
    {
      id: 'tech',
      title: 'Technical',
      description: 'Technical assessment',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500',
      iconOutline: AcademicCapIcon,
      iconSolid: AcademicCapSolidIcon,
      candidates: candidate.stage === 'tech' ? [candidate] : [],
    },
    {
      id: 'offer',
      title: 'Offer',
      description: 'Job offer made',
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      iconOutline: DocumentCheckIcon,
      iconSolid: DocumentCheckSolidIcon,
      candidates: candidate.stage === 'offer' ? [candidate] : [],
    },
    {
      id: 'hired',
      title: 'Hired',
      description: 'Successfully hired',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500',
      iconOutline: CheckIcon,
      iconSolid: CheckSolidIcon,
      candidates: candidate.stage === 'hired' ? [candidate] : [],
    },
    {
      id: 'rejected',
      title: 'Rejected',
      description: 'Not selected',
      color: 'text-red-600',
      bgColor: 'bg-red-500',
      iconOutline: XCircleIcon,
      iconSolid: XCircleSolidIcon,
      candidates: candidate.stage === 'rejected' ? [candidate] : [],
    },
  ];

  // Get current stage index for progress visualization
  const currentStageIndex = stages.findIndex(s => s.id === candidate.stage);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      toast.error('Drop zone not found. Please drop the candidate on a valid stage column.');
      return;
    }

    const candidateId = parseInt(active.id.toString());
    const overStageId = over.id as string;
    
    console.log('🔄 Drag end:', { candidateId, overStageId, currentStage: candidate.stage });

    // Validate the target stage
    const validStages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];
    if (!validStages.includes(overStageId)) {
      toast.error(`Invalid target stage: ${overStageId}`);
      return;
    }
    
    if (overStageId === candidate.stage) {
      toast('Candidate is already in this stage.', { duration: 2000 });
      return; // No change needed
    }

    // Enhanced stage progression validation
    const stageOrder = ['applied', 'screen', 'tech', 'offer', 'hired'];
    const currentStageIndex = stageOrder.indexOf(candidate.stage);
    const targetStageIndex = stageOrder.indexOf(overStageId);
    
    // Prevent specific invalid transitions with more detailed messages
    if (candidate.stage === 'hired' && overStageId === 'rejected') {
      toast.error('Cannot reject a hired candidate. A hired candidate cannot be moved to rejected status.');
      return;
    }
    
    if (candidate.stage === 'rejected' && overStageId === 'hired') {
      toast.error('Cannot hire a rejected candidate. Rejected candidates cannot be moved to hired status.');
      return;
    }
    
    if (candidate.stage === 'rejected' && overStageId !== 'rejected') {
      toast.error('Cannot move a rejected candidate to active stages. Rejected candidates cannot re-enter the hiring process.');
      return;
    }
    
    // Allow moving to 'rejected' from any stage except 'hired'
    if (overStageId === 'rejected' && candidate.stage !== 'hired') {
      // Show confirmation for rejection
      toast.success('Moving candidate to rejected stage...');
    } else if (overStageId !== 'rejected' && targetStageIndex !== -1 && currentStageIndex !== -1 && targetStageIndex < currentStageIndex) {
      // Prevent moving backwards in normal progression with specific stage names
      const currentStageName = stages.find(s => s.id === candidate.stage)?.title || candidate.stage;
      const targetStageName = stages.find(s => s.id === overStageId)?.title || overStageId;
      toast.error(`Cannot move backwards from ${currentStageName} to ${targetStageName}. Candidates can only progress forward in the hiring process.`);
      return;
    } else if (overStageId !== 'rejected' && targetStageIndex !== -1 && currentStageIndex !== -1 && targetStageIndex > currentStageIndex + 1) {
      // Prevent skipping stages (optional - can be removed if skipping is allowed)
      const currentStageName = stages.find(s => s.id === candidate.stage)?.title || candidate.stage;
      const targetStageName = stages.find(s => s.id === overStageId)?.title || overStageId;
      toast(`⚠️ Skipping stages: moving from ${currentStageName} to ${targetStageName}. Make sure this progression is intended.`, { duration: 4000 });
    }

    setIsUpdating(true);
    try {
      await onStageChange(candidateId, overStageId as Candidate['stage']);
      const targetStageName = stages.find(s => s.id === overStageId)?.title || overStageId;
      toast.success(`Successfully moved candidate to ${targetStageName}`);
    } catch (error) {
      console.error('Failed to update candidate stage:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Show specific error message to user
      toast.error(`Failed to update candidate stage: ${errorMessage}`);
      
      // Log additional debug info
      console.error('Debug info:', {
        candidateId,
        currentStage: candidate.stage,
        targetStage: overStageId,
        error
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const activeCandidateCard = activeId ? (
    <CandidateCard 
      candidate={candidate} 
      isDragging 
    />
  ) : null;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border dark:border-slate-600">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recruitment Progress</h3>
          <span className="text-xs text-gray-500">
            Stage {currentStageIndex + 1} of {stages.length - 1} {/* Excluding rejected */}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {stages.slice(0, -1).map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300
                ${index <= currentStageIndex ? 
                  'bg-green-500 text-white' : 
                  'bg-gray-200 dark:bg-slate-600 text-gray-400 dark:text-gray-500'}
              `}>
                {index < currentStageIndex ? (
                  <CheckCircleSolidIcon className="h-5 w-5" />
                ) : index === currentStageIndex ? (
                  <stage.iconSolid className="h-4 w-4" />
                ) : (
                  <stage.iconOutline className="h-4 w-4" />
                )}
              </div>
              
              {index < stages.length - 2 && (
                <div className={`
                  w-12 h-1 transition-all duration-300
                  ${index < currentStageIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-600'}
                `} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="w-full overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            <SortableContext 
              items={[candidate.id.toString()]}
              strategy={verticalListSortingStrategy}
            >
              {stages.map((stage, index) => (
                <div key={stage.id} className="w-72 flex-shrink-0">
                  <KanbanColumn
                    stage={stage}
                    isActive={stage.id === candidate.stage}
                    isCompleted={index < currentStageIndex && candidate.stage !== 'rejected'}
                    onCandidateClick={onCandidateClick}
                  />
                </div>
              ))}
            </SortableContext>
          </div>
        </div>

        <DragOverlay>
          {activeCandidateCard}
        </DragOverlay>
      </DndContext>

      {/* Loading Overlay */}
      {isUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
            <span className="text-gray-900 dark:text-white font-medium">Updating candidate stage...</span>
          </div>
        </div>
      )}
    </div>
  );
}