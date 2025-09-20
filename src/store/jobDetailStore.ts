import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Job } from '../db';

interface JobDetailStore {
  // State
  currentJob: Job | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentJob: (job: Job) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCurrentJob: () => void;
  
  // Helper to find job from jobs list
  findJobById: (jobId: number, jobs: Job[]) => Job | null;
}

export const useJobDetailStore = create<JobDetailStore>()(
  devtools(
    (set) => ({
      // Initial state
      currentJob: null,
      isLoading: false,
      error: null,
      
      // Actions
      setCurrentJob: (job: Job) => 
        set({ currentJob: job, error: null }, false, 'setCurrentJob'),
      
      setLoading: (loading: boolean) => 
        set({ isLoading: loading }, false, 'setLoading'),
      
      setError: (error: string | null) => 
        set({ error, isLoading: false }, false, 'setError'),
      
      clearCurrentJob: () => 
        set({ currentJob: null, error: null, isLoading: false }, false, 'clearCurrentJob'),
      
      findJobById: (jobId: number, jobs: Job[]) => {
        return jobs.find(job => job.id === jobId) || null;
      },
    }),
    {
      name: 'job-detail-store',
    }
  )
);