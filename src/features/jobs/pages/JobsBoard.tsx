import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobs, useJobOperations, useReorderJob } from '../hooks/useJobs';
import { useJobsWithAssessments } from '../../assessments/hooks/useJobsWithAssessments';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
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
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  XMarkIcon,
  PencilIcon,
  ArchiveBoxIcon,
  EyeIcon,
  CalendarIcon,
  TagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  DocumentTextIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  ArchiveBoxIcon as ArchiveBoxSolidIcon,
} from '@heroicons/react/24/solid';
import type { Job } from '../../../db';

// Types for form validation
interface CreateJobForm {
  title: string;
  status: 'active' | 'archived';
  tags: string;
  order?: string;
}

interface JobFilters {
  search: string;
  status: string;
  tags: string[];
}

// Sortable Table Row Component
interface SortableJobRowProps {
  job: Job;
  openEditModal: (job: Job) => void;
  openViewModal: (job: Job) => void;
  updateJob: (jobId: number, updates: any) => Promise<Job>;
  getStatusBadge: (status: Job['status']) => string;
  formatDate: (timestamp: number) => string;
  hasAssessment: boolean;
  onAssessmentClick: (jobId: number) => void;
}

function SortableJobRow({ job, openEditModal, openViewModal, updateJob, getStatusBadge, formatDate, hasAssessment, onAssessmentClick }: SortableJobRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    filter: isDragging ? 'blur(1px)' : 'none',
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      onClick={() => openViewModal(job)}
      className={`hover:bg-gray-50 transition-colors cursor-pointer ${isDragging ? 'z-50' : ''}`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors"
            title="Drag to reorder"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div>
            <div className="text-sm font-medium text-gray-900">{job.title}</div>
            <div className="text-sm text-gray-500">{job.slug}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={getStatusBadge(job.status)}>
          {job.status === 'active' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
          {job.status === 'archived' && <ArchiveBoxSolidIcon className="h-3 w-3 mr-1" />}
          {job.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {job.tags && job.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
            >
              {tag}
            </span>
          ))}
          {job.tags && job.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
              +{job.tags.length - 3}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-1" />
          {formatDate(job.createdAt)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        #{job.order}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onAssessmentClick(job.id)}
          className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
            hasAssessment
              ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500'
              : 'border-gray-300 text-gray-500 bg-gray-50 hover:bg-gray-100 focus:ring-gray-500 opacity-60'
          }`}
          title={hasAssessment ? 'View Assessment' : 'Create Assessment'}
        >
          <DocumentTextIcon className="h-3 w-3 mr-1" />
          {hasAssessment ? 'View' : 'Create'}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(job);
            }}
            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
            title="Edit job"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const newStatus = job.status === 'active' ? 'archived' : 'active';
              await updateJob(job.id, { status: newStatus });
            }}
            className={`p-1 rounded transition-colors ${
              job.status === 'active' 
                ? 'text-green-600 hover:text-green-900 hover:bg-green-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title={job.status === 'active' ? 'Archive job' : 'Activate job'}
          >
            {job.status === 'active' ? <ArchiveBoxIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
          </button>
        </div>
      </td>
    </tr>
  );
}

// Sortable Card Component
interface SortableJobCardProps {
  job: Job;
  openEditModal: (job: Job) => void;
  updateJob: (jobId: number, updates: any) => Promise<Job>;
  getStatusBadge: (status: Job['status']) => string;
  formatDate: (timestamp: number) => string;
  hasAssessment: boolean;
  onAssessmentClick: (jobId: number) => void;
}

function SortableJobCard({ job, openEditModal, updateJob, getStatusBadge, formatDate, hasAssessment, onAssessmentClick }: SortableJobCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    filter: isDragging ? 'blur(1px)' : 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${isDragging ? 'z-50 shadow-lg' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors mt-1"
            title="Drag to reorder"
          >
            <Bars3Icon className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-1">{job.title}</h3>
            <p className="text-sm text-gray-500">{job.slug}</p>
          </div>
        </div>
        <span className={getStatusBadge(job.status)}>
          {job.status === 'active' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
          {job.status === 'archived' && <ArchiveBoxSolidIcon className="h-3 w-3 mr-1" />}
          {job.status}
        </span>
      </div>

      {job.tags && job.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {job.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
              >
                <TagIcon className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-1" />
          {formatDate(job.createdAt)}
        </div>
        <div>Order #{job.order}</div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(job);
            }}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PencilIcon className="h-3 w-3 mr-1" />
            Edit
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const newStatus = job.status === 'active' ? 'archived' : 'active';
              await updateJob(job.id, { status: newStatus });
            }}
            className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
              job.status === 'active'
                ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100 focus:ring-green-500'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500'
            }`}
          >
            {job.status === 'active' ? (
              <><ArchiveBoxIcon className="h-3 w-3 mr-1" />Archive</>
            ) : (
              <><CheckIcon className="h-3 w-3 mr-1" />Activate</>
            )}
          </button>
          <button
            onClick={() => onAssessmentClick(job.id)}
            className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
              hasAssessment
                ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500'
                : 'border-gray-300 text-gray-500 bg-gray-50 hover:bg-gray-100 focus:ring-gray-500 opacity-60'
            }`}
            title={hasAssessment ? 'View Assessment' : 'No Assessment'}
          >
            <DocumentTextIcon className="h-3 w-3 mr-1" />
            {hasAssessment ? 'Assessment' : 'No Assessment'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function JobsBoard() {
  // Hooks
  const navigate = useNavigate();
  const {
    jobs,
    pagination,
    loading,
    error,
    updateFilters,
    updatePagination,
    refreshJobs,
  } = useJobs();

  const { createJob, updateJob, selectedJob, selectJob } = useJobOperations();
  const { reorderJob } = useReorderJob();

  // Assessment status hook
  const jobIds = useMemo(() => jobs.map(job => job.id), [jobs]);
  const { getAssessmentStatus } = useJobsWithAssessments(jobIds);

  // UI State
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [localFilters, setLocalFilters] = useState<JobFilters>({
    search: '',
    status: '',
    tags: [],
  });

  // Drag and Drop State
  const [activeId, setActiveId] = useState<string | null>(null);

  // Debounced search
  const [searchDebounce, setSearchDebounce] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Drag and Drop Sensors
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

  // Form handling with react-hook-form
  const createForm = useForm<CreateJobForm>({
    defaultValues: {
      title: '',
      status: 'active',
      tags: '',
      order: '',
    },
  });

  const editForm = useForm<CreateJobForm>({
    defaultValues: {
      title: '',
      status: 'active',
      tags: '',
      order: '',
    },
  });

  // Available tags from existing jobs (for future use)
  useMemo(() => {
    const allTags = jobs.flatMap(job => job.tags);
    return [...new Set(allTags)].sort();
  }, [jobs]);

  // Drag and Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    console.log('Drag started for job ID:', event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id as number;
    const overId = over.id as number;
    
    const activeJob = jobs.find(job => job.id === activeId);
    const overJob = jobs.find(job => job.id === overId);

    if (!activeJob || !overJob) {
      console.error('Could not find jobs for drag operation', { activeId, overId, jobs });
      return;
    }

    // Don't do anything if jobs are the same
    if (activeJob.id === overJob.id) {
      return;
    }

    // Calculate the correct new order based on drag direction
    const oldIndex = jobs.findIndex(job => job.id === activeId);
    const newIndex = jobs.findIndex(job => job.id === overId);
    
    // Backend order: Use the target job's actual order for correct positioning
    let backendTargetOrder;
    
    if (oldIndex < newIndex) {
      // Dragging down: backend should place item at the target job's position
      // The target job and others will shift up automatically
      backendTargetOrder = overJob.order;
    } else {
      // Dragging up: backend should place item at the target job's position
      backendTargetOrder = overJob.order;
    }

    console.log('Reordering job:', {
      activeJob: { id: activeJob.id, title: activeJob.title, order: activeJob.order },
      overJob: { id: overJob.id, title: overJob.title, order: overJob.order },
      oldIndex,
      newIndex,
      backendTargetOrder,
      direction: oldIndex < newIndex ? 'down' : 'up',
      logic: oldIndex < newIndex 
        ? `dragging down: place at target order ${overJob.order} -> ${backendTargetOrder}`
        : `dragging up: place at target order ${overJob.order} -> ${backendTargetOrder}`
    });

    try {
      // Use the backend target order (based on actual job orders, not array indices)
      await reorderJob(activeJob.id, activeJob.order, backendTargetOrder);
      toast.success(`Moved "${activeJob.title}" to new position`);
    } catch (error) {
      console.error('Failed to reorder job:', error);
      toast.error('Failed to reorder job. Changes reverted.');
    }
  };

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, search: value }));
    
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeout = setTimeout(() => {
      updateFilters({ search: value });
    }, 300);
    
    setSearchDebounce(timeout);
  };

  // Handle filter changes
  const handleStatusFilter = (status: string) => {
    setLocalFilters(prev => ({ ...prev, status }));
    const validStatus = status === 'all' ? '' : (status as 'active' | 'archived' | '');
    updateFilters({ status: validStatus });
  };

  const handleTagFilter = (tag: string) => {
    const newTags = localFilters.tags.includes(tag)
      ? localFilters.tags.filter(t => t !== tag)
      : [...localFilters.tags, tag];
    
    setLocalFilters(prev => ({ ...prev, tags: newTags }));
    // Update actual filters - this would need to be implemented in the store
  };

  const clearFilters = () => {
    setLocalFilters({ search: '', status: '', tags: [] });
    updateFilters({ search: '', status: '' });
  };

  // Handle job creation
  const handleCreateJob = async (data: CreateJobForm) => {
    try {
      const jobData: any = {
        title: data.title,
        status: data.status,
        tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };

      if (data.order && data.order.trim() !== '') {
        const orderNum = parseInt(data.order.trim());
        if (!isNaN(orderNum) && orderNum > 0) {
          jobData.order = orderNum;
        }
      }

      await createJob(jobData);
      toast.success(`Job "${data.title}" created successfully!`);
      setShowCreateModal(false);
      createForm.reset();
      refreshJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create job');
    }
  };

  // Handle job editing
  const handleEditJob = async (data: CreateJobForm) => {
    if (!selectedJob) return;

    try {
      const updateData: any = {
        title: data.title,
        status: data.status,
        tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };

      if (data.order && data.order.trim() !== '') {
        const orderNum = parseInt(data.order.trim());
        if (!isNaN(orderNum) && orderNum > 0) {
          updateData.order = orderNum;
        }
      }

      await updateJob(selectedJob.id, updateData);
      toast.success(`Job "${data.title}" updated successfully!`);
      setShowEditModal(false);
      editForm.reset();
      selectJob(null);
      refreshJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update job');
    }
  };

  // Open edit modal with job data
  const openEditModal = (job: Job) => {
    selectJob(job);
    editForm.reset({
      title: job.title,
      status: job.status,
      tags: job.tags ? job.tags.join(', ') : '',
      order: job.order.toString(),
    });
    setShowEditModal(true);
  };

  // Open view job using navigation
  const openViewModal = (job: Job) => {
    navigate(`/jobs/${job.id}`);
  };

  // Handle assessment click - navigate to assessment detail or show create option
  const handleAssessmentClick = (jobId: number) => {
    const assessmentStatus = getAssessmentStatus(jobId);
    if (assessmentStatus.hasAssessment) {
      navigate(`/assessment/${jobId}`);
    } else {
      navigate(`/assessment/${jobId}/edit`);
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge styles
  const getStatusBadge = (status: Job['status']) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'archived':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Jobs Board</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your job postings and track applications
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Job
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={localFilters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Status Filter */}
              <select
                value={localFilters.status}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="block w-full sm:w-auto px-3 py-2 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>

              {/* Clear Filters */}
              {(localFilters.search || localFilters.status || localFilters.tags.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Clear
                </button>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">View:</span>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 text-sm font-medium ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ViewColumnsIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 text-sm font-medium ${
                    viewMode === 'cards'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Tags */}
          {localFilters.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Active tags:</span>
              {localFilters.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    onClick={() => handleTagFilter(tag)}
                    className="ml-1 hover:text-blue-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Jobs Content */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="animate-pulse">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Jobs Table/Cards */}
        {!loading && jobs.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto w-24 h-24 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6M8 6h8" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500 mb-4">
              {localFilters.search || localFilters.status
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating your first job posting.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Your First Job
            </button>
          </div>
        )}

        {/* Table View */}
        {!loading && jobs.length > 0 && viewMode === 'table' && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tags
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assessment
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <SortableContext items={jobs.map(job => job.id)} strategy={verticalListSortingStrategy}>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobs.map((job) => (
                        <SortableJobRow
                          key={job.id}
                          job={job}
                          openEditModal={openEditModal}
                          openViewModal={openViewModal}
                          updateJob={updateJob}
                          getStatusBadge={getStatusBadge}
                          formatDate={formatDate}
                          hasAssessment={getAssessmentStatus(job.id).hasAssessment}
                          onAssessmentClick={handleAssessmentClick}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </div>
            </div>
            <DragOverlay>
              {activeId ? (
                <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-4 opacity-90">
                  <div className="text-sm font-medium text-gray-900">
                    {jobs.find(job => job.id.toString() === activeId)?.title}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Cards View */}
        {!loading && jobs.length > 0 && viewMode === 'cards' && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={jobs.map(job => job.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <SortableJobCard
                    key={job.id}
                    job={job}
                    openEditModal={openEditModal}
                    updateJob={updateJob}
                    getStatusBadge={getStatusBadge}
                    formatDate={formatDate}
                    hasAssessment={getAssessmentStatus(job.id).hasAssessment}
                    onAssessmentClick={handleAssessmentClick}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-4 opacity-90">
                  <div className="text-sm font-medium text-gray-900">
                    {jobs.find(job => job.id.toString() === activeId)?.title}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Pagination */}
        {!loading && jobs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {pagination.totalPages > 1 ? (
                    <>
                      Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                      {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
                      {pagination.totalCount} jobs
                    </>
                  ) : (
                    `Showing all ${pagination.totalCount} jobs`
                  )}
                </span>
                
                {/* Show All Toggle */}
                {pagination.totalCount > 10 && (
                  <button
                    onClick={() => {
                      if (pagination.totalPages > 1) {
                        // Show all jobs
                        updatePagination({ pageSize: pagination.totalCount, page: 1 });
                      } else {
                        // Reset to default pagination
                        updatePagination({ pageSize: 10, page: 1 });
                      }
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {pagination.totalPages > 1 ? 'Show All' : 'Show Pages'}
                  </button>
                )}
              </div>
              
              {pagination.totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updatePagination({ page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  
                  <div className="flex space-x-1">
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => updatePagination({ page: pageNum })}
                          className={`px-3 py-2 text-sm font-medium rounded-lg ${
                            pagination.page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => updatePagination({ page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={createForm.handleSubmit(handleCreateJob)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Create New Job
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Job Title *
                          </label>
                          <input
                            {...createForm.register('title', { required: 'Job title is required' })}
                            type="text"
                            id="title"
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g. Senior React Developer"
                          />
                          {createForm.formState.errors.title && (
                            <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.title.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            {...createForm.register('status')}
                            id="status"
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                            Tags
                          </label>
                          <input
                            {...createForm.register('tags')}
                            type="text"
                            id="tags"
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="remote, senior, react, typescript"
                          />
                          <p className="mt-1 text-sm text-gray-500">Separate tags with commas</p>
                        </div>

                        <div>
                          <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
                            Order (optional)
                          </label>
                          <input
                            {...createForm.register('order')}
                            type="number"
                            min="1"
                            id="order"
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Leave empty to add at end"
                          />
                          <p className="mt-1 text-sm text-gray-500">Specify position in job list. Other jobs will be reordered automatically.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create Job
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {showEditModal && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={editForm.handleSubmit(handleEditJob)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Edit Job: {selectedJob.title}
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                            Job Title *
                          </label>
                          <input
                            {...editForm.register('title', { required: 'Job title is required' })}
                            type="text"
                            id="edit-title"
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g. Senior React Developer"
                          />
                          {editForm.formState.errors.title && (
                            <p className="mt-1 text-sm text-red-600">{editForm.formState.errors.title.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            {...editForm.register('status')}
                            id="edit-status"
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700 mb-1">
                            Tags
                          </label>
                          <input
                            {...editForm.register('tags')}
                            type="text"
                            id="edit-tags"
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="remote, senior, react, typescript"
                          />
                          <p className="mt-1 text-sm text-gray-500">Separate tags with commas</p>
                        </div>

                        <div>
                          <label htmlFor="edit-order" className="block text-sm font-medium text-gray-700 mb-1">
                            Order
                          </label>
                          <input
                            {...editForm.register('order')}
                            type="number"
                            min="1"
                            id="edit-order"
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Position in job list"
                          />
                          <p className="mt-1 text-sm text-gray-500">Change position in job list. Other jobs will be reordered automatically.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Update Job
                  </button>
                  {getAssessmentStatus(selectedJob.id).hasAssessment && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        selectJob(null);
                        navigate(`/job/${selectedJob.id}`);
                      }}
                      className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Edit Assessment
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      selectJob(null);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}