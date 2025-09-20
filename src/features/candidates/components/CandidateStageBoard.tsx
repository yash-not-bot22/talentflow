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
  onStageChange: (candidateId: number, newStage: Candidate['stage']) => Promise<void>;
  onCandidateClick?: (candidate: Candidate) => void;
  onClose?: () => void;
  isInline?: boolean;
}

interface CandidateCardProps {
  candidate: Candidate;
  onClick?: (candidate: Candidate) => void;
}

function StageCandidateCard({ candidate, onClick }: CandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
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
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(candidate);
      }}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-grab hover:shadow-md transition-all duration-200 active:cursor-grabbing"
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
    </div>
  );
}

interface StageColumnProps {
  stage: StageDefinition;
  candidates: Candidate[];
  onCandidateClick: (candidate: Candidate) => void;
}

function StageColumn({ stage, candidates, onCandidateClick }: StageColumnProps) {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: stage.id,
  });

  const StageIcon = stage.icon;

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-80 bg-white rounded-xl border-2 transition-all duration-300 ${
        isOver ? `${stage.borderColor} bg-opacity-10 ${stage.bgColor}` : 'border-gray-200'
      }`}
    >
      {/* Column Header */}
      <div className={`p-4 border-b border-gray-200 ${stage.bgColor} bg-opacity-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${stage.bgColor}`}>
              <StageIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {stage.title}
              </h3>
              <p className="text-sm text-gray-500">{stage.description}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stage.color} bg-opacity-10`}>
            {candidates.length}
          </span>
        </div>
      </div>

      {/* Candidates List */}
      <div className="p-4 min-h-96 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          {candidates.map((candidate) => (
            <StageCandidateCard
              key={candidate.id}
              candidate={candidate}
              onClick={onCandidateClick}
            />
          ))}
          
          {/* Drop Zone Indicator */}
          {candidates.length === 0 && (
            <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
              <div className="text-center">
                <StageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Drop candidates here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CandidateStageBoard({ candidates, onStageChange, onCandidateClick = () => {}, onClose, isInline = false }: StageBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const candidateId = parseInt(active.id.toString());
    const overStage = over.id as Candidate['stage'];
    
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate || candidate.stage === overStage) return;

    // Enhanced stage progression validation
    const stageOrder = ['applied', 'screen', 'tech', 'offer', 'hired'];
    const currentStageIndex = stageOrder.indexOf(candidate.stage);
    const targetStageIndex = stageOrder.indexOf(overStage);
    
    // Prevent specific invalid transitions
    if (candidate.stage === 'hired' && overStage === 'rejected') {
      toast.error(`Cannot move from Hired to Rejected. A hired candidate cannot be rejected.`);
      return;
    }
    
    if (candidate.stage === 'rejected' && overStage === 'hired') {
      toast.error(`Cannot move from Rejected to Hired. A rejected candidate cannot be hired.`);
      return;
    }
    
    if (candidate.stage === 'rejected' && overStage !== 'rejected') {
      toast.error(`Cannot move from Rejected to other stages. Rejected candidates cannot re-enter the hiring process.`);
      return;
    }
    
    // Allow moving to 'rejected' from any stage except 'hired'
    if (overStage === 'rejected' && candidate.stage !== 'hired') {
      // Proceed with the stage change
    } else if (overStage !== 'rejected' && targetStageIndex < currentStageIndex) {
      // Prevent moving backwards in normal progression
      const currentStageTitle = stageDefinitions.find(s => s.id === candidate.stage)?.title;
      const targetStageTitle = stageDefinitions.find(s => s.id === overStage)?.title;
      toast.error(`Cannot move backwards from ${currentStageTitle} to ${targetStageTitle}`);
      return;
    }

    try {
      setIsUpdating(true);
      console.log(`🔄 Moving candidate ${candidateId} to stage ${overStage}`);
      await onStageChange(candidateId, overStage);
      const targetStageTitle = stageDefinitions.find(s => s.id === overStage)?.title;
      toast.success(`Moved ${candidate.name} to ${targetStageTitle}`);
    } catch (error) {
      console.error(`❌ Failed to move candidate:`, error);
      toast.error('Failed to update candidate stage');
    } finally {
      setIsUpdating(false);
    }
  };

  const activeCandidate = activeId ? candidates.find(c => c.id.toString() === activeId) : null;

  // Inline rendering (no modal wrapper)
  if (isInline) {
    return (
      <div className="relative">
        {/* Stage Board */}
        <div className="overflow-x-auto">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 min-w-max">
              {candidatesByStage.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  candidates={stage.candidates}
                  onCandidateClick={onCandidateClick}
                />
              ))}
            </div>

            <DragOverlay>
              {activeCandidate ? (
                <StageCandidateCard
                  candidate={activeCandidate}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Loading Overlay */}
        {isUpdating && (
          <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3 shadow-lg">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-50 rounded-xl max-w-7xl w-full max-h-full m-4 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Candidate Stage Board</h2>
              <p className="text-gray-600">Drag candidates between stages to update their status</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
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
                  onCandidateClick={onCandidateClick}
                />
              ))}
            </div>

            <DragOverlay>
              {activeCandidate ? (
                <StageCandidateCard
                  candidate={activeCandidate}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Loading Overlay */}
        {isUpdating && (
          <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center rounded-xl">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-900">Updating candidate stage...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}