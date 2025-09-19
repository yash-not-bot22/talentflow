import { useCallback, useEffect } from 'react';
import { useJobsStore } from '../../../store/jobsStore';
import { jobsApi, type CreateJobRequest, type UpdateJobRequest } from '../../../api/jobsApi';
import type { Job } from '../../../db';

// Hook for fetching and managing jobs list
export function useJobs() {
  const {
    optimisticJobs: jobs,
    filters,
    pagination,
    loading,
    error,
    setJobs,
    setLoading,
    setError,
    setPagination,
    setFilters,
  } = useJobsStore();

  // Fetch jobs based on current filters and pagination
  const fetchJobs = useCallback(async () => {
    console.log('🔧 fetchJobs called with filters:', filters, 'pagination:', pagination);
    setLoading(true);
    setError(null);

    try {
      console.log('🔧 Making API call to jobsApi.getJobs...');
      const response = await jobsApi.getJobs(filters, {
        page: pagination.page,
        pageSize: pagination.pageSize,
      });

      console.log('✅ Jobs fetched successfully:', response.data.length, 'jobs');
      setJobs(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('❌ Error fetching jobs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch jobs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize, setJobs, setLoading, setError, setPagination]);

  // Refresh jobs (useful for manual refresh)
  const refreshJobs = useCallback(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Update filters and trigger fetch
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(newFilters);
  }, [setFilters]);

  // Update pagination and trigger fetch
  const updatePagination = useCallback((newPagination: Partial<typeof pagination>) => {
    setPagination(newPagination);
  }, [setPagination]);

  // Auto-fetch when filters or pagination changes
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    filters,
    pagination,
    loading,
    error,
    fetchJobs,
    refreshJobs,
    updateFilters,
    updatePagination,
  };
}

// Hook for creating jobs
export function useCreateJob() {
  const {
    setError,
  } = useJobsStore();

  const createJob = useCallback(async (jobData: CreateJobRequest) => {
    setError(null);

    try {
      const createdJob = await jobsApi.createJob(jobData);
      
      // Add the new job to the store (no optimistic update needed for create since it's fast)
      // The jobs list will be refreshed by the parent component or we could add it directly
      const currentJobs = useJobsStore.getState().jobs;
      const updatedJobs = [...currentJobs, createdJob].sort((a, b) => a.order - b.order);
      useJobsStore.getState().setJobs(updatedJobs);
      
      return createdJob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create job';
      setError(errorMessage);
      throw err;
    }
  }, [setError]);

  return { createJob };
}

// Hook for updating jobs
export function useUpdateJob() {
  const {
    updateJobOptimistically,
    rollbackOptimisticUpdate,
    commitOptimisticUpdate,
    setError,
  } = useJobsStore();

  const updateJob = useCallback(async (jobId: number, updates: UpdateJobRequest) => {
    setError(null);

    // Apply optimistic update
    updateJobOptimistically(jobId, { ...updates, updatedAt: Date.now() });

    try {
      const updatedJob = await jobsApi.updateJob(jobId, updates);
      
      // Update with real data from server
      updateJobOptimistically(jobId, updatedJob);
      commitOptimisticUpdate();
      
      return updatedJob;
    } catch (err) {
      rollbackOptimisticUpdate();
      const errorMessage = err instanceof Error ? err.message : 'Failed to update job';
      setError(errorMessage);
      throw err;
    }
  }, [updateJobOptimistically, rollbackOptimisticUpdate, commitOptimisticUpdate, setError]);

  return { updateJob };
}

// Hook for reordering jobs
export function useReorderJob() {
  const {
    reorderJobOptimistically,
    rollbackOptimisticUpdate,
    commitOptimisticUpdate,
    setError,
  } = useJobsStore();

  const reorderJob = useCallback(async (jobId: number, fromOrder: number, toOrder: number) => {
    setError(null);

    // Apply optimistic reorder
    reorderJobOptimistically(jobId, fromOrder, toOrder);

    try {
      const updatedJob = await jobsApi.reorderJob(jobId, { fromOrder, toOrder });
      commitOptimisticUpdate();
      return updatedJob;
    } catch (err) {
      rollbackOptimisticUpdate();
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder job. Changes have been reverted.';
      setError(errorMessage);
      throw err;
    }
  }, [reorderJobOptimistically, rollbackOptimisticUpdate, commitOptimisticUpdate, setError]);

  return { reorderJob };
}

// Hook for managing selected job
export function useSelectedJob() {
  const { selectedJob, setSelectedJob } = useJobsStore();

  const selectJob = useCallback((job: Job | null) => {
    setSelectedJob(job);
  }, [setSelectedJob]);

  return {
    selectedJob,
    selectJob,
  };
}

// Hook for job operations (combines multiple hooks for convenience)
export function useJobOperations() {
  const { createJob } = useCreateJob();
  const { updateJob } = useUpdateJob();
  const { reorderJob } = useReorderJob();
  const { selectedJob, selectJob } = useSelectedJob();

  return {
    createJob,
    updateJob,
    reorderJob,
    selectedJob,
    selectJob,
  };
}