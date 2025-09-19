import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Job } from '../db';

export interface JobsFilters {
  search: string;
  status: 'active' | 'archived' | '';
  sort: 'title' | 'createdAt' | 'updatedAt' | 'order';
}

export interface JobsPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

export interface JobsState {
  // Data
  jobs: Job[];
  selectedJob: Job | null;
  
  // UI State
  filters: JobsFilters;
  pagination: JobsPagination;
  loading: boolean;
  error: string | null;
  
  // Optimistic update state
  optimisticJobs: Job[];
  pendingReorder: { jobId: number; fromOrder: number; toOrder: number } | null;
  
  // Actions
  setJobs: (jobs: Job[]) => void;
  setSelectedJob: (job: Job | null) => void;
  setFilters: (filters: Partial<JobsFilters>) => void;
  setPagination: (pagination: Partial<JobsPagination>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Optimistic updates
  addJobOptimistically: (job: Job) => void;
  updateJobOptimistically: (jobId: number, updates: Partial<Job>) => void;
  removeJobOptimistically: (jobId: number) => void;
  reorderJobOptimistically: (jobId: number, fromOrder: number, toOrder: number) => void;
  rollbackOptimisticUpdate: () => void;
  commitOptimisticUpdate: () => void;
  
  // Reset
  reset: () => void;
}

const defaultFilters: JobsFilters = {
  search: '',
  status: '',
  sort: 'order',
};

const defaultPagination: JobsPagination = {
  page: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 0,
  hasMore: false,
};

export const useJobsStore = create<JobsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      jobs: [],
      selectedJob: null,
      filters: defaultFilters,
      pagination: defaultPagination,
      loading: false,
      error: null,
      optimisticJobs: [],
      pendingReorder: null,

      // Basic setters
      setJobs: (jobs) => set({ jobs, optimisticJobs: jobs }),
      setSelectedJob: (selectedJob) => set({ selectedJob }),
      setFilters: (filters) => set((state) => ({ 
        filters: { ...state.filters, ...filters },
        pagination: { ...state.pagination, page: 1 } // Reset to first page when filters change
      })),
      setPagination: (pagination) => set((state) => ({ 
        pagination: { ...state.pagination, ...pagination } 
      })),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Optimistic updates
      addJobOptimistically: (job) => set((state) => ({
        optimisticJobs: [...state.optimisticJobs, job],
      })),

      updateJobOptimistically: (jobId, updates) => set((state) => ({
        optimisticJobs: state.optimisticJobs.map((job) =>
          job.id === jobId ? { ...job, ...updates } : job
        ),
      })),

      removeJobOptimistically: (jobId) => set((state) => ({
        optimisticJobs: state.optimisticJobs.filter((job) => job.id !== jobId),
      })),

      reorderJobOptimistically: (jobId, fromOrder, toOrder) => set((state) => {
        // Store the pending reorder for rollback
        const pendingReorder = { jobId, fromOrder, toOrder };
        
        // Perform optimistic reordering
        const jobs = [...state.optimisticJobs];
        const jobIndex = jobs.findIndex(job => job.id === jobId);
        
        if (jobIndex === -1) return { pendingReorder };
        
        const jobToMove = jobs[jobIndex];
        
        // Remove the job from its current position
        jobs.splice(jobIndex, 1);
        
        // Find the new position based on toOrder
        let insertIndex = 0;
        for (let i = 0; i < jobs.length; i++) {
          if (jobs[i].order < toOrder) {
            insertIndex = i + 1;
          } else {
            break;
          }
        }
        
        // Insert the job at the new position
        jobs.splice(insertIndex, 0, { ...jobToMove, order: toOrder });
        
        // Update the order of other jobs
        if (fromOrder < toOrder) {
          // Moving down: decrease order of jobs that were between fromOrder and toOrder
          for (let i = 0; i < jobs.length; i++) {
            if (jobs[i].id !== jobId && jobs[i].order > fromOrder && jobs[i].order <= toOrder) {
              jobs[i] = { ...jobs[i], order: jobs[i].order - 1 };
            }
          }
        } else {
          // Moving up: increase order of jobs that were between toOrder and fromOrder
          for (let i = 0; i < jobs.length; i++) {
            if (jobs[i].id !== jobId && jobs[i].order >= toOrder && jobs[i].order < fromOrder) {
              jobs[i] = { ...jobs[i], order: jobs[i].order + 1 };
            }
          }
        }
        
        return {
          optimisticJobs: jobs,
          pendingReorder,
        };
      }),

      rollbackOptimisticUpdate: () => set((state) => ({
        optimisticJobs: state.jobs,
        pendingReorder: null,
      })),

      commitOptimisticUpdate: () => set((state) => ({
        jobs: state.optimisticJobs,
        pendingReorder: null,
      })),

      // Reset
      reset: () => set({
        jobs: [],
        selectedJob: null,
        filters: defaultFilters,
        pagination: defaultPagination,
        loading: false,
        error: null,
        optimisticJobs: [],
        pendingReorder: null,
      }),
    }),
    {
      name: 'jobs-store',
    }
  )
);