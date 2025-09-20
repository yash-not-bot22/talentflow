import { useState, useEffect, useMemo, useCallback } from 'react';
import { candidatesApi } from '../../../api/candidatesApi';
import type { Candidate } from '../../../db';
import type { CandidatesFilters } from '../../../api/candidatesApi';

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50, // Higher page size for virtualization
    totalCount: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<CandidatesFilters>({
    search: '',
    stage: '',
  });

  // Fetch candidates with current filters and pagination
  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await candidatesApi.getCandidates({
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      
      setCandidates(response.data || []);
      setPagination(response.pagination);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
      setCandidates([]);
      setError('Failed to load candidates');
      setLoading(false);
    }
  }, [filters.search, filters.stage, pagination.page, pagination.pageSize]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<CandidatesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  // Update pagination
  const updatePagination = useCallback((updates: Partial<typeof pagination>) => {
    setPagination(prev => ({ ...prev, ...updates }));
  }, []);

  // Refresh candidates (useful for after updates)
  const refreshCandidates = useCallback(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Fetch on mount and when filters/pagination change
  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  return {
    candidates,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    updatePagination,
    refreshCandidates,
  };
}

// Hook for candidate operations (create, update, etc.)
export function useCandidateOperations() {
  const [loading, setLoading] = useState(false);

  const updateCandidate = async (candidateId: number, updates: { stage?: Candidate['stage']; notes?: string }) => {
    try {
      setLoading(true);
      await candidatesApi.updateCandidate(candidateId, updates);
      return true;
    } catch (error) {
      console.error('Failed to update candidate:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createCandidate = async (data: { name: string; email: string; jobId: number; stage?: Candidate['stage'] }) => {
    try {
      setLoading(true);
      const response = await candidatesApi.createCandidate(data);
      return response;
    } catch (error) {
      console.error('Failed to create candidate:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    updateCandidate,
    createCandidate,
  };
}

// Hook for candidate stage management
export function useCandidateStages() {
  const stages = useMemo(() => [
    { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
    { value: 'screen', label: 'Screening', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'tech', label: 'Technical', color: 'bg-purple-100 text-purple-800' },
    { value: 'offer', label: 'Offer', color: 'bg-green-100 text-green-800' },
    { value: 'hired', label: 'Hired', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  ] as const, []);

  const getStageInfo = (stage: Candidate['stage']) => {
    return stages.find(s => s.value === stage) || stages[0];
  };

  const getStageOptions = () => stages;

  return {
    stages,
    getStageInfo,
    getStageOptions,
  };
}