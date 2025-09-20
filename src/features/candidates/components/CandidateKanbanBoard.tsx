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
        bg-white rounded-lg border shadow-sm p-3 cursor-grab hover:shadow-md transition-all duration-200
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
          <h4 className="text-sm font-semibold text-gray-900 truncate">
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
        <div className="w-6 h-1 bg-gray-200 rounded-full"></div>
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
        w-full bg-white rounded-lg border-2 transition-all duration-300 h-80
        ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
        ${isActive ? 'ring-2 ring-blue-500 ring-opacity-50 border-blue-400' : ''}
        ${isCompleted ? 'bg-green-50 border-green-300' : ''}
      `}
    >
      {/* Column Header */}
      <div className={`p-4 border-b border-gray-200 ${isActive ? 'bg-blue-50' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`
              p-2 rounded-lg transition-all duration-200
              ${isCompleted ? 'bg-green-100' : isActive ? stage.bgColor : 'bg-white'}
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
                ${isCompleted ? 'text-green-800' : 'text-gray-900'}
              `}>
                {stage.title}
              </h3>
              <p className="text-sm text-gray-500">{stage.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              {stage.candidates.length}
            </span>
            {isCompleted && (
              <CheckCircleSolidIcon className="h-5 w-5 text-green-500" />
            )}
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="p-4">
        <div className="space-y-3 min-h-32">
          {stage.candidates.map((candidate) => (
            <div key={candidate.id} onClick={() => onCandidateClick(candidate)}>
              <CandidateCard candidate={candidate} />
            </div>
          ))}
          
          {/* Drop Zone Indicator */}
          {stage.candidates.length === 0 && (
            <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
              <div className="text-center">
                <IconOutline className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Drop candidates here</p>
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

    if (!over) return;

    const candidateId = parseInt(active.id.toString());
    const overStageId = over.id as string;
    
    console.log('🔄 Drag end:', { candidateId, overStageId, currentStage: candidate.stage });
    
    if (overStageId === candidate.stage) return; // No change needed

    // Enhanced stage progression validation
    const stageOrder = ['applied', 'screen', 'tech', 'offer', 'hired'];
    const currentStageIndex = stageOrder.indexOf(candidate.stage);
    const targetStageIndex = stageOrder.indexOf(overStageId);
    
    // Prevent specific invalid transitions
    if (candidate.stage === 'hired' && overStageId === 'rejected') {
      toast.error(`Cannot move from Hired to Rejected. A hired candidate cannot be rejected.`);
      return;
    }
    
    if (candidate.stage === 'rejected' && overStageId === 'hired') {
      toast.error(`Cannot move from Rejected to Hired. A rejected candidate cannot be hired.`);
      return;
    }
    
    if (candidate.stage === 'rejected' && overStageId !== 'rejected') {
      toast.error(`Cannot move from Rejected to other stages. Rejected candidates cannot re-enter the hiring process.`);
      return;
    }
    
    // Allow moving to 'rejected' from any stage except 'hired'
    if (overStageId === 'rejected' && candidate.stage !== 'hired') {
      // Proceed with the stage change
    } else if (overStageId !== 'rejected' && targetStageIndex < currentStageIndex) {
      // Prevent moving backwards in normal progression
      toast.error(`Cannot move backwards from ${stages.find(s => s.id === candidate.stage)?.title} to ${stages.find(s => s.id === overStageId)?.title}`);
      return;
    }

    setIsUpdating(true);
    try {
      await onStageChange(candidateId, overStageId as Candidate['stage']);
      toast.success(`Moved candidate to ${stages.find(s => s.id === overStageId)?.title}`);
    } catch (error) {
      console.error('Failed to update candidate stage:', error);
      toast.error('Failed to update candidate stage');
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
      <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Recruitment Progress</h3>
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
                  'bg-gray-200 text-gray-400'}
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
                  ${index < currentStageIndex ? 'bg-green-500' : 'bg-gray-200'}
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
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
            <span className="text-gray-900 font-medium">Updating candidate stage...</span>
          </div>
        </div>
      )}
    </div>
  );
}