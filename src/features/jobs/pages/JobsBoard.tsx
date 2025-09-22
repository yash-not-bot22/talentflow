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
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  DocumentTextIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import type { Job } from '../../../db';
import { Button, StatusPill, GradientBadge } from '../../../components/ui';

// Types for form validation
interface CreateJobForm {
  title: string;
  status: 'active' | 'archived';
  tags: string;
  order?: string;
  salary?: string;
  location?: string;
  department?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
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
  formatDate: (timestamp: number) => string;
  hasAssessment: boolean;
  onAssessmentClick: (jobId: number) => void;
}

function SortableJobRow({ job, openEditModal, openViewModal, updateJob, formatDate, hasAssessment, onAssessmentClick }: SortableJobRowProps) {
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
      className={`hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${isDragging ? 'z-50' : ''}`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <Button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            variant="ghost"
            size="sm"
            className="cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
          >
            <Bars3Icon className="h-5 w-5" />
          </Button>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{job.title}</div>
            <div className="text-sm text-gray-500">{job.slug}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusPill status={job.status as 'active' | 'archived'} size="sm" />
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {job.tags && job.tags.slice(0, 3).map((tag) => (
            <GradientBadge
              key={tag}
              variant="accent"
              size="sm"
              outline
            >
              {tag}
            </GradientBadge>
          ))}
          {job.tags && job.tags.length > 3 && (
            <GradientBadge variant="neutral" size="sm" outline>
              +{job.tags.length - 3}
            </GradientBadge>
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
        <Button
          onClick={() => onAssessmentClick(job.id)}
          variant={hasAssessment ? "primary" : "outline"}
          size="sm"
          className={!hasAssessment ? "opacity-60" : ""}
          title={hasAssessment ? 'View Assessment' : 'Create Assessment'}
        >
          <DocumentTextIcon className="h-3 w-3" />
          {hasAssessment ? 'View' : 'Create'}
        </Button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(job);
            }}
            variant="ghost"
            size="sm"
            title="Edit job"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            onClick={async (e) => {
              e.stopPropagation();
              const newStatus = job.status === 'active' ? 'archived' : 'active';
              await updateJob(job.id, { status: newStatus });
            }}
            variant="ghost"
            size="sm"
            title={job.status === 'active' ? 'Archive job' : 'Activate job'}
          >
            {job.status === 'active' ? <ArchiveBoxIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
          </Button>
        </div>
      </td>
    </tr>
  );
}

// Sortable Card Component
interface SortableJobCardProps {
  job: Job;
  openEditModal: (job: Job) => void;
  openViewModal: (job: Job) => void;
  updateJob: (jobId: number, updates: any) => Promise<Job>;
  formatDate: (timestamp: number) => string;
  hasAssessment: boolean;
  onAssessmentClick: (jobId: number) => void;
}

function SortableJobCard({ job, openEditModal, openViewModal, updateJob, formatDate, hasAssessment, onAssessmentClick }: SortableJobCardProps) {
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
      onClick={() => openViewModal(job)}
      className={`group relative backdrop-blur-lg bg-white/70 dark:bg-slate-800/70 rounded-2xl shadow-xl border border-white/30 dark:border-slate-700/30 p-8 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500 hover:scale-105 hover:rotate-1 overflow-hidden cursor-pointer ${isDragging ? 'z-50 shadow-2xl scale-110' : ''}`}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
      
      {/* Content */}
      <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <Button
            {...attributes}
            {...listeners}
            variant="ghost"
            size="sm"
            className="cursor-grab active:cursor-grabbing mt-1"
            title="Drag to reorder"
          >
            <Bars3Icon className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-1">{job.title}</h3>
            <p className="text-sm text-gray-500">{job.slug}</p>
          </div>
        </div>
        <StatusPill status={job.status as 'active' | 'archived'} size="sm" />
      </div>

      {job.tags && job.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {job.tags.map((tag) => (
              <GradientBadge
                key={tag}
                variant="accent"
                size="sm"
                outline
              >
                {tag}
              </GradientBadge>
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
        <div className="flex space-x-3">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(job);
            }}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            size="sm"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <PencilIcon className="h-3 w-3 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
            <span className="relative z-10">Edit</span>
          </Button>
          <Button
            onClick={async (e) => {
              e.stopPropagation();
              const newStatus = job.status === 'active' ? 'archived' : 'active';
              await updateJob(job.id, { status: newStatus });
            }}
            className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
              job.status === 'active' 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
            }`}
            size="sm"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {job.status === 'active' ? (
              <>
                <ArchiveBoxIcon className="h-3 w-3 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10">Archive</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-3 w-3 relative z-10 group-hover:scale-125 transition-transform duration-300" />
                <span className="relative z-10">Activate</span>
              </>
            )}
          </Button>
          <Button
            onClick={() => onAssessmentClick(job.id)}
            className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-w-[120px] ${
              hasAssessment 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white' 
                : 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white opacity-60'
            }`}
            size="sm"
            title={hasAssessment ? 'View Assessment' : 'No Assessment'}
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <DocumentTextIcon className="h-3 w-3 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
            <span className="relative z-10">{hasAssessment ? 'Assessment' : 'Assessment'}</span>
          </Button>
        </div>
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
      salary: '',
      location: '',
      department: '',
      employmentType: undefined,
    },
  });

  const editForm = useForm<CreateJobForm>({
    defaultValues: {
      title: '',
      status: 'active',
      tags: '',
      order: '',
      salary: '',
      location: '',
      department: '',
      employmentType: undefined,
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

      // Add optional fields if provided
      if (data.salary && data.salary.trim()) {
        jobData.salary = data.salary.trim();
      }
      if (data.location && data.location.trim()) {
        jobData.location = data.location.trim();
      }
      if (data.department && data.department.trim()) {
        jobData.department = data.department.trim();
      }
      if (data.employmentType) {
        jobData.employmentType = data.employmentType;
      }

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

      // Add optional fields if provided
      if (data.salary !== undefined) {
        updateData.salary = data.salary.trim() || undefined;
      }
      if (data.location !== undefined) {
        updateData.location = data.location.trim() || undefined;
      }
      if (data.department !== undefined) {
        updateData.department = data.department.trim() || undefined;
      }
      if (data.employmentType !== undefined) {
        updateData.employmentType = data.employmentType;
      }

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
      salary: job.salary || '',
      location: job.location || '',
      department: job.department || '',
      employmentType: job.employmentType || undefined,
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
  return (
    <div className="min-h-screen relative overflow-hidden transition-colors">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20"></div>
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Floating orbs for extra glassmorphism effect */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10">
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              marginTop: '80px', // Push below navbar
            },
          }}
          containerStyle={{
            zIndex: 30, // Below navbar but above content
          }}
        />
      
        {/* Header */}
        <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 shadow-lg border-b border-white/20 dark:border-slate-700/30">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-pink-400/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div className="relative">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                  Jobs Board
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-slate-300 font-medium">
                  Manage your job postings and track applications
                </p>
              </div>
              <div className="group">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="relative overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white border-0 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:rotate-1"
                  size="lg"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <PlusIcon className="h-5 w-5 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="relative z-10 font-semibold">Create Job</span>
                </Button>
              </div>
            </div>
          </div>
        </div>      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Controls */}
        <div className="backdrop-blur-lg bg-white/60 dark:bg-slate-800/60 rounded-2xl shadow-xl border border-white/30 dark:border-slate-700/30 p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
          <div className="relative z-10">
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Status Filter */}
              <select
                value={localFilters.status}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="block w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>

              {/* Clear Filters */}
              {(localFilters.search || localFilters.status || localFilters.tags.length > 0) && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-600 dark:text-slate-300">View:</span>
              <div className="flex backdrop-blur-lg bg-white/50 dark:bg-slate-800/50 rounded-xl p-1 border border-white/30 dark:border-slate-700/30 shadow-lg">
                <button
                  onClick={() => setViewMode('table')}
                  className={`group relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 overflow-hidden ${
                    viewMode === 'table'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:scale-105'
                  }`}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <ViewColumnsIcon className="h-4 w-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`group relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 overflow-hidden ${
                    viewMode === 'cards'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:scale-105'
                  }`}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Squares2X2Icon className="h-4 w-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
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
        </div>

        {/* Jobs Content */}
        {error && (
          <div className="backdrop-blur-lg bg-red-500/10 border border-red-400/30 rounded-2xl p-6 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5"></div>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium relative z-10">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="backdrop-blur-lg bg-white/60 dark:bg-slate-800/60 rounded-2xl shadow-xl border border-white/30 dark:border-slate-700/30 p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
            <div className="animate-pulse relative z-10">
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-6 animate-pulse" style={{animationDelay: `${i * 0.2}s`}}>
                    <div className="h-6 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-lg w-1/4"></div>
                    <div className="h-6 bg-gradient-to-r from-indigo-200 to-pink-200 dark:from-indigo-800 dark:to-pink-800 rounded-lg w-1/6"></div>
                    <div className="h-6 bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 rounded-lg w-1/3"></div>
                    <div className="h-6 bg-gradient-to-r from-pink-200 to-indigo-200 dark:from-pink-800 dark:to-indigo-800 rounded-lg w-1/6"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Jobs Table/Cards */}
        {!loading && jobs.length === 0 && (
          <div className="backdrop-blur-lg bg-white/60 dark:bg-slate-800/60 rounded-3xl shadow-xl border border-white/30 dark:border-slate-700/30 p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
            <div className="relative z-10">
              <div className="mx-auto w-32 h-32 text-gradient-to-r from-blue-400 to-purple-400 mb-8 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="relative z-10 text-blue-500 dark:text-blue-400">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6M8 6h8" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-4">No jobs found</h3>
              <p className="text-gray-600 dark:text-slate-400 mb-8 text-lg">
                {localFilters.search || localFilters.status
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first job posting.'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white border-0 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-8 py-4 rounded-xl text-lg font-semibold"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <PlusIcon className="h-5 w-5 mr-3 relative z-10 group-hover:rotate-90 transition-transform duration-300 inline-block" />
                <span className="relative z-10">Create Your First Job</span>
              </button>
            </div>
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
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Job
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tags
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Assessment
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <SortableContext items={jobs.map(job => job.id)} strategy={verticalListSortingStrategy}>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {jobs.map((job) => (
                        <SortableJobRow
                          key={job.id}
                          job={job}
                          openEditModal={openEditModal}
                          openViewModal={openViewModal}
                          updateJob={updateJob}
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
                <div className="backdrop-blur-lg bg-white/80 dark:bg-slate-800/80 rounded-2xl shadow-2xl border border-white/40 dark:border-slate-700/40 p-6 opacity-95 transform rotate-3 scale-105">
                  <div className="relative z-10">
                    <div className="text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {jobs.find(job => job.id.toString() === activeId)?.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-slate-400">
                      {jobs.find(job => job.id.toString() === activeId)?.slug}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl"></div>
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
                    openViewModal={openViewModal}
                    updateJob={updateJob}
                    formatDate={formatDate}
                    hasAssessment={getAssessmentStatus(job.id).hasAssessment}
                    onAssessmentClick={handleAssessmentClick}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div className="backdrop-blur-lg bg-white/80 dark:bg-slate-800/80 rounded-2xl shadow-2xl border border-white/40 dark:border-slate-700/40 p-6 opacity-95 transform rotate-3 scale-105">
                  <div className="relative z-10">
                    <div className="text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {jobs.find(job => job.id.toString() === activeId)?.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-slate-400">
                      {jobs.find(job => job.id.toString() === activeId)?.slug}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl"></div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Pagination */}
        {!loading && jobs.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 px-6 py-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700 dark:text-slate-300">
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
                  <Button
                    onClick={() => {
                      if (pagination.totalPages > 1) {
                        // Show all jobs
                        updatePagination({ pageSize: pagination.totalCount, page: 1 });
                      } else {
                        // Reset to default pagination
                        updatePagination({ pageSize: 10, page: 1 });
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    {pagination.totalPages > 1 ? 'Show All' : 'Show Pages'}
                  </Button>
                )}
              </div>
              
              {pagination.totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => updatePagination({ page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex space-x-1">
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => updatePagination({ page: pageNum })}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            pagination.page === pageNum
                              ? 'bg-blue-600 text-white dark:bg-blue-500'
                              : 'text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <Button
                    onClick={() => updatePagination({ page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[80] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-16 pb-8 px-4 text-center sm:block sm:p-16">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-all duration-300" onClick={() => setShowCreateModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-middle bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-700/30 rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all duration-300 hover:scale-[1.01] sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border-2 border-gray-200 dark:border-slate-700 relative">
              {/* Geometric background pattern */}
              <div className="absolute inset-0 opacity-30 dark:opacity-20 rounded-3xl overflow-hidden">
                <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="create-modal-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                      <circle cx="25" cy="25" r="0.5" fill="currentColor" className="text-blue-400 dark:text-blue-500" opacity="0.4"/>
                      <circle cx="0" cy="0" r="0.5" fill="currentColor" className="text-purple-400 dark:text-purple-500" opacity="0.3"/>
                      <circle cx="50" cy="0" r="0.5" fill="currentColor" className="text-pink-400 dark:text-pink-500" opacity="0.3"/>
                      <circle cx="0" cy="50" r="0.5" fill="currentColor" className="text-blue-400 dark:text-blue-500" opacity="0.3"/>
                      <circle cx="50" cy="50" r="0.5" fill="currentColor" className="text-purple-400 dark:text-purple-500" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#create-modal-pattern)" />
                </svg>
              </div>
              <form onSubmit={createForm.handleSubmit(handleCreateJob)}>
                <div className="relative bg-white dark:bg-slate-800 px-6 pt-6 pb-6 sm:p-6 rounded-3xl">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-slate-100 mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Create New Job
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Job Title *
                          </label>
                          <input
                            {...createForm.register('title', { required: 'Job title is required' })}
                            type="text"
                            id="title"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="e.g. Senior React Developer"
                          />
                          {createForm.formState.errors.title && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{createForm.formState.errors.title.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="salary" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Salary Range
                          </label>
                          <input
                            {...createForm.register('salary')}
                            type="text"
                            id="salary"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="e.g. $80,000 - $120,000"
                          />
                        </div>

                        <div>
                          <label htmlFor="location" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Location
                          </label>
                          <input
                            {...createForm.register('location')}
                            type="text"
                            id="location"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="e.g. San Francisco, CA or Remote"
                          />
                        </div>

                        <div>
                          <label htmlFor="department" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Department
                          </label>
                          <input
                            {...createForm.register('department')}
                            type="text"
                            id="department"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="e.g. Engineering, Product, Marketing"
                          />
                        </div>

                        <div>
                          <label htmlFor="employmentType" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Employment Type
                          </label>
                          <select
                            {...createForm.register('employmentType')}
                            id="employmentType"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                          >
                            <option value="">Select type</option>
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="internship">Internship</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="status" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Status
                          </label>
                          <select
                            {...createForm.register('status')}
                            id="status"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                          >
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Tags
                          </label>
                          <input
                            {...createForm.register('tags')}
                            type="text"
                            id="tags"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="remote, senior, react, typescript"
                          />
                          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Separate tags with commas</p>
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor="order" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Order (optional)
                          </label>
                          <input
                            {...createForm.register('order')}
                            type="number"
                            min="1"
                            id="order"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="Leave empty to add at end"
                          />
                          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Specify position in job list. Other jobs will be reordered automatically.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse sm:gap-3 border-t border-white/30 dark:border-slate-600/30">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="group backdrop-blur-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <span className="group-hover:scale-110 transition-transform duration-300 inline-block font-medium">Create Job</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    variant="outline"
                    size="md"
                    className="group backdrop-blur-lg bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-white/30 dark:border-slate-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <span className="group-hover:scale-110 transition-transform duration-300 inline-block font-medium">Cancel</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {showEditModal && selectedJob && (
        <div className="fixed inset-0 z-[80] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-16 pb-8 px-4 text-center sm:block sm:p-16">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-all duration-300" onClick={() => setShowEditModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-middle bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-700/30 rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all duration-300 hover:scale-[1.01] sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border-2 border-gray-200 dark:border-slate-700 relative">
              {/* Geometric background pattern */}
              <div className="absolute inset-0 opacity-30 dark:opacity-20 rounded-3xl overflow-hidden">
                <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="edit-modal-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                      <circle cx="25" cy="25" r="0.5" fill="currentColor" className="text-blue-400 dark:text-blue-500" opacity="0.4"/>
                      <circle cx="0" cy="0" r="0.5" fill="currentColor" className="text-purple-400 dark:text-purple-500" opacity="0.3"/>
                      <circle cx="50" cy="0" r="0.5" fill="currentColor" className="text-pink-400 dark:text-pink-500" opacity="0.3"/>
                      <circle cx="0" cy="50" r="0.5" fill="currentColor" className="text-blue-400 dark:text-blue-500" opacity="0.3"/>
                      <circle cx="50" cy="50" r="0.5" fill="currentColor" className="text-purple-400 dark:text-purple-500" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#edit-modal-pattern)" />
                </svg>
              </div>
              <form onSubmit={editForm.handleSubmit(handleEditJob)}>
                <div className="relative bg-white dark:bg-slate-800 px-6 pt-6 pb-6 sm:p-6 rounded-3xl">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-2xl leading-6 font-bold text-gray-900 dark:text-slate-100 mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
                        Edit Job: {selectedJob.title}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label htmlFor="edit-title" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Job Title *
                          </label>
                          <input
                            {...editForm.register('title', { required: 'Job title is required' })}
                            type="text"
                            id="edit-title"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="e.g. Senior React Developer"
                          />
                          {editForm.formState.errors.title && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{editForm.formState.errors.title.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="edit-salary" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Salary Range
                          </label>
                          <input
                            {...editForm.register('salary')}
                            type="text"
                            id="edit-salary"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="e.g. $80,000 - $120,000"
                          />
                        </div>

                        <div>
                          <label htmlFor="edit-location" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Location
                          </label>
                          <input
                            {...editForm.register('location')}
                            type="text"
                            id="edit-location"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="e.g. San Francisco, CA or Remote"
                          />
                        </div>

                        <div>
                          <label htmlFor="edit-department" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Department
                          </label>
                          <input
                            {...editForm.register('department')}
                            type="text"
                            id="edit-department"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="e.g. Engineering, Product, Marketing"
                          />
                        </div>

                        <div>
                          <label htmlFor="edit-employmentType" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Employment Type
                          </label>
                          <select
                            {...editForm.register('employmentType')}
                            id="edit-employmentType"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                          >
                            <option value="">Select type</option>
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="internship">Internship</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="edit-status" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Status
                          </label>
                          <select
                            {...editForm.register('status')}
                            id="edit-status"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                          >
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor="edit-tags" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Tags
                          </label>
                          <input
                            {...editForm.register('tags')}
                            type="text"
                            id="edit-tags"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="remote, senior, react, typescript"
                          />
                          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Separate tags with commas</p>
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor="edit-order" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            Order
                          </label>
                          <input
                            {...editForm.register('order')}
                            type="number"
                            min="1"
                            id="edit-order"
                            className="block w-full backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 border border-white/30 dark:border-slate-600/30 text-gray-900 dark:text-slate-100 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:shadow-xl px-4 py-3"
                            placeholder="Position in job list"
                          />
                          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Change position in job list. Other jobs will be reordered automatically.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse sm:gap-3 border-t border-white/30 dark:border-slate-600/30">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="group backdrop-blur-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <span className="group-hover:scale-110 transition-transform duration-300 inline-block font-medium">Update Job</span>
                  </Button>
                  {getAssessmentStatus(selectedJob.id).hasAssessment && (
                    <Button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        selectJob(null);
                        navigate(`/job/${selectedJob.id}`);
                      }}
                      variant="accent"
                      size="md"
                      className="group backdrop-blur-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <span className="group-hover:scale-110 transition-transform duration-300 inline-block font-medium">Edit Assessment</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      selectJob(null);
                    }}
                    variant="outline"
                    size="md"
                    className="group backdrop-blur-lg bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-white/30 dark:border-slate-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <span className="group-hover:scale-110 transition-transform duration-300 inline-block font-medium">Cancel</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}