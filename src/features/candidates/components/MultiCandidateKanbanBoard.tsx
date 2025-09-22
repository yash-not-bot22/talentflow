import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
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
import {
  ClockIcon,
  AcademicCapIcon,
  DocumentCheckIcon,
  CheckIcon,
  XCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
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
  onClick?: (candidate: Candidate) => void;
}

function CandidateCard({ candidate, isActive = false, isDragging = false, onClick }: CandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
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
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(candidate);
      }}
      className={`
        bg-white rounded-lg border shadow-sm p-3 hover:shadow-md transition-all duration-200
        ${isActive ? 'ring-2 ring-blue-500 shadow-lg' : ''}
        ${isDragging ? 'rotate-1 scale-105' : ''}
      `}
    >
      {/* Candidate Header with Drag Handle */}
      <div className="flex items-center space-x-3 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 transition-colors"
          title="Drag to move candidate"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col space-y-0.5">
            <ChevronUpIcon className="h-3 w-3 text-gray-400" />
            <ChevronDownIcon className="h-3 w-3 text-gray-400" />
          </div>
        </button>
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
    </div>
  );
}

interface KanbanColumnProps {
  stage: KanbanStage;
  onCandidateClick: (candidate: Candidate) => void;
}

function KanbanColumn({ stage, onCandidateClick }: KanbanColumnProps) {
  const {
    setNodeRef,
    isOver,
  } = useSortable({
    id: stage.id,
    data: {
      type: 'stage',
      stage: stage.id,
    }
  });

  const IconOutline = stage.iconOutline;

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 min-h-96 bg-white rounded-xl border-2 transition-all duration-300
        ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
      `}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${stage.bgColor}`}>
              <IconOutline className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {stage.title}
              </h3>
              <p className="text-sm text-gray-500">{stage.description}</p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {stage.candidates.length}
          </span>
        </div>
      </div>

      {/* Candidates List */}
      <div className="p-4">
        <SortableContext 
          items={stage.candidates.map(c => c.id.toString())} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 min-h-64">
            {stage.candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onClick={onCandidateClick}
              />
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
        </SortableContext>
      </div>
    </div>
  );
}

interface MultiCandidateKanbanBoardProps {
  candidates: Candidate[];
  onStageChange: (candidateId: number, newStage: Candidate['stage']) => Promise<void>;
  onCandidateClick?: (candidate: Candidate) => void;
}

export function MultiCandidateKanbanBoard({ 
  candidates, 
  onStageChange, 
  onCandidateClick = () => {} 
}: MultiCandidateKanbanBoardProps) {
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
  const stageDefinitions = [
    {
      id: 'applied' as const,
      title: 'Applied',
      description: 'New applications',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      iconOutline: ClockIcon,
      iconSolid: ClockSolidIcon,
    },
    {
      id: 'screen' as const,
      title: 'Screening',
      description: 'Initial review',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500',
      iconOutline: DocumentCheckIcon,
      iconSolid: DocumentCheckSolidIcon,
    },
    {
      id: 'tech' as const,
      title: 'Technical',
      description: 'Technical assessment',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500',
      iconOutline: AcademicCapIcon,
      iconSolid: AcademicCapSolidIcon,
    },
    {
      id: 'offer' as const,
      title: 'Offer',
      description: 'Offer extended',
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      iconOutline: CheckIcon,
      iconSolid: CheckSolidIcon,
    },
    {
      id: 'hired' as const,
      title: 'Hired',
      description: 'Successfully hired',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500',
      iconOutline: CheckCircleSolidIcon,
      iconSolid: CheckCircleSolidIcon,
    },
    {
      id: 'rejected' as const,
      title: 'Rejected',
      description: 'Not proceeding',
      color: 'text-red-600',
      bgColor: 'bg-red-500',
      iconOutline: XCircleIcon,
      iconSolid: XCircleSolidIcon,
    },
  ];

  // Group candidates by stage
  const stages: KanbanStage[] = stageDefinitions.map(stageDef => ({
    ...stageDef,
    candidates: candidates.filter(candidate => candidate.stage === stageDef.id),
  }));

  // Drag and Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    console.log('Drag started for candidate ID:', event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const candidateId = parseInt(active.id.toString());
    const overStage = over.id as Candidate['stage'];
    
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate || candidate.stage === overStage) {
      return;
    }

    console.log('Moving candidate:', {
      candidate: { id: candidate.id, name: candidate.name, currentStage: candidate.stage },
      newStage: overStage
    });

    try {
      setIsUpdating(true);
      await onStageChange(candidateId, overStage);
      console.log('Successfully moved candidate to:', overStage);
    } catch (error) {
      console.error('Failed to move candidate:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const activeCandidate = activeId ? candidates.find(c => c.id.toString() === activeId) : null;

  return (
    <div className="w-full bg-gray-50 dark:bg-slate-900 rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Candidate Pipeline</h2>
        <p className="text-gray-600 dark:text-gray-300">Drag candidates between stages to update their status</p>
      </div>
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stages.map((stage) => (
            <SortableContext
              key={stage.id}
              items={stage.candidates.map(c => c.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn
                stage={stage}
                onCandidateClick={onCandidateClick}
              />
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeCandidate ? (
            <CandidateCard
              candidate={activeCandidate}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {isUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-900 dark:text-white">Updating candidate stage...</span>
          </div>
        </div>
      )}
    </div>
  );
}