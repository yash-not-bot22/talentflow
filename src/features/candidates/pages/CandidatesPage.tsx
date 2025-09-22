import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandidates, useCandidateStages, useCandidateOperations } from '../hooks/useCandidates';
import { useJobs } from '../../jobs/hooks/useJobs';
import type { Candidate } from '../../../db';
import {
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon,
  ClockIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { CandidateStageBoard } from '../components/CandidateStageBoard';
import toast from 'react-hot-toast';

// Simple candidate card component for list view
interface CandidateCardProps {
  candidate: Candidate;
  getStageInfo: (stage: Candidate['stage']) => any;
  onViewCandidate: (candidate: Candidate) => void;
  onUpdateStage: (candidate: Candidate, newStage: Candidate['stage']) => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, getStageInfo, onViewCandidate, onUpdateStage }) => {
  const stageInfo = getStageInfo(candidate.stage);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // List view
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-2xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer group hover:scale-[1.02] hover:-translate-y-1 relative overflow-hidden"
         onClick={() => onViewCandidate(candidate)}>
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative">
        <div className="flex items-center justify-between">
          {/* Candidate Info */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {getInitials(candidate.name)}
              </div>
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                  {candidate.name}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageInfo.color}`}>
                  {stageInfo.label}
                </span>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-1.5" />
                  <span className="truncate max-w-48">{candidate.email}</span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1.5" />
                  <span>Applied {formatDate(candidate.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1.5" />
                  <span>{candidate.history.length} changes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <select
              value={candidate.stage}
              onChange={(e) => {
                e.stopPropagation();
                onUpdateStage(candidate, e.target.value as Candidate['stage']);
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-xs border border-gray-300 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="applied">Applied</option>
              <option value="screen">Screening</option>
              <option value="tech">Technical</option>
              <option value="offer">Offer</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// Candidate card component for card view
const CandidateCardView: React.FC<CandidateCardProps> = ({ candidate, getStageInfo, onViewCandidate, onUpdateStage }) => {
  const stageInfo = getStageInfo(candidate.stage);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Card view
  return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 hover:shadow-2xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer group hover:scale-[1.05] hover:-translate-y-2 hover:rotate-1 relative overflow-hidden"
         onClick={() => onViewCandidate(candidate)}>
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg group-hover:scale-110 transition-transform duration-300">
            {getInitials(candidate.name)}
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium backdrop-blur-lg border border-white/30 transition-all duration-300 group-hover:scale-105 ${stageInfo.color}`}>
            {stageInfo.label}
          </span>
      </div>

      {/* Candidate Info */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
          {candidate.name}
        </h3>
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <EnvelopeIcon className="h-4 w-4 mr-1.5" />
          <span className="truncate">{candidate.email}</span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4 mr-1.5" />
          <span>Applied {formatDate(candidate.createdAt)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span>{candidate.history.length} changes</span>
        </div>
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span>{candidate.notes.length} notes</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <select
          value={candidate.stage}
          onChange={(e) => {
            e.stopPropagation();
            onUpdateStage(candidate, e.target.value as Candidate['stage']);
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-xs border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          <option value="applied">Applied</option>
          <option value="screen">Screening</option>
          <option value="tech">Technical</option>
          <option value="offer">Offer</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      </div>
    </div>
  );
};

export function CandidatesPage() {
  const navigate = useNavigate();
  const { candidates, loading, error, filters, pagination, updateFilters, updatePagination, refreshCandidates } = useCandidates();
  const { getStageInfo, getStageOptions } = useCandidateStages();
  const { updateCandidate } = useCandidateOperations();
  const { jobs } = useJobs();
  
  const [stageFilter, setStageFilter] = useState(filters.stage || '');
  const [viewMode, setViewMode] = useState<'list' | 'cards' | 'stages'>('list');

  // Use server-side filtering - no client-side filtering needed
  const filteredCandidates = candidates;

  const handleStageFilterChange = (stage: string) => {
    setStageFilter(stage);
    updateFilters({ stage: stage as Candidate['stage'] | '' });
  };

  const handleViewCandidate = useCallback((candidate: Candidate) => {
    navigate(`/candidates/${candidate.id}`);
  }, [navigate]);

  const handleUpdateStage = useCallback(async (candidate: Candidate, newStage: Candidate['stage']) => {
    if (newStage === candidate.stage) return;

    try {
      await updateCandidate(candidate.id, { stage: newStage });
      toast.success(`Moved ${candidate.name} to ${getStageInfo(newStage).label}`);
      refreshCandidates();
    } catch (error) {
      toast.error('Failed to update candidate stage');
    }
  }, [updateCandidate, getStageInfo, refreshCandidates]);

  // Handler for stage board (different signature)
  const handleStageChangeFromBoard = useCallback(async (candidateId: number, newStage: Candidate['stage']) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate || newStage === candidate.stage) return;

    try {
      await updateCandidate(candidateId, { stage: newStage });
      refreshCandidates();
    } catch (error) {
      throw error; // Let the stage board handle the error display
    }
  }, [candidates, updateCandidate, refreshCandidates]);

  const clearFilters = () => {
    setStageFilter('');
    updateFilters({ stage: '' });
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    updatePagination({ page: newPage });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    updatePagination({ page: 1, pageSize: newPageSize });
  };

  // No need for rowData with simple list rendering

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <XMarkIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Candidates</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={refreshCandidates}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-700/30">
      {/* Minimalistic geometric background */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="geometric-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="1" fill="currentColor" className="text-blue-300 dark:text-blue-600" opacity="0.3"/>
              <circle cx="0" cy="0" r="1" fill="currentColor" className="text-purple-300 dark:text-purple-600" opacity="0.2"/>
              <circle cx="100" cy="0" r="1" fill="currentColor" className="text-pink-300 dark:text-pink-600" opacity="0.2"/>
              <circle cx="0" cy="100" r="1" fill="currentColor" className="text-blue-300 dark:text-blue-600" opacity="0.2"/>
              <circle cx="100" cy="100" r="1" fill="currentColor" className="text-purple-300 dark:text-purple-600" opacity="0.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geometric-pattern)" />
        </svg>
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/95 dark:bg-slate-800/95 rounded-3xl shadow-xl border border-white/50 dark:border-slate-700/50 mb-6 relative">
          <div className="relative px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Candidates</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {loading ? 'Loading...' : `${filteredCandidates.length} of ${candidates.length} candidates`}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* View Mode Toggle */}
                <div className="flex items-center backdrop-blur-lg bg-white/60 dark:bg-slate-700/60 rounded-xl p-1 border border-white/30 dark:border-slate-600/30 shadow-lg">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-lg transition-all duration-300 flex items-center hover:scale-105 ${
                      viewMode === 'list' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-600/50'
                    }`}
                    title="List view"
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-2 rounded-lg transition-all duration-300 flex items-center hover:scale-105 ${
                      viewMode === 'cards' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-600/50'
                    }`}
                    title="Card view"
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('stages')}
                    className={`px-3 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 hover:scale-105 ${
                      viewMode === 'stages' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-600/50'
                    }`}
                    title="Candidate Stage Board"
                  >
                    <TableCellsIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Candidate Stage Board</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stage Filter */}
            <div className="space-y-4">
              {/* Filter Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Filter by Stage:
                    </label>
                    <select
                      value={stageFilter}
                      onChange={(e) => handleStageFilterChange(e.target.value)}
                      className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      <option value="">All Stages</option>
                      {getStageOptions().map((stage: any) => (
                        <option key={stage.value} value={stage.value}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Active Filter Badge */}
                  {stageFilter && (
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-600">
                        Stage: {getStageInfo(stageFilter as Candidate['stage']).label}
                        <button
                          onClick={() => handleStageFilterChange('')}
                          className="ml-2 hover:text-green-600"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                      <button
                        onClick={clearFilters}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                      >
                        Clear filter
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {filteredCandidates.length} results
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 rounded-3xl shadow-xl border border-white/30 dark:border-slate-700/30 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl"></div>
          <div className="relative">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading candidates...</p>
              </div>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No candidates found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {stageFilter 
                  ? 'Try adjusting your filter to find what you\'re looking for'
                  : 'Get started by adding your first candidate to the system'
                }
              </p>
            </div>
          ) : (
            <div className="p-4">
              {viewMode === 'stages' ? (
                /* Stage Board View */
                <CandidateStageBoard
                  candidates={candidates}
                  jobs={jobs}
                  onStageChange={handleStageChangeFromBoard}
                  onCandidateClick={handleViewCandidate}
                  isInline={true}
                />
              ) : viewMode === 'cards' ? (
                /* Card Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredCandidates.map((candidate: Candidate) => (
                    <CandidateCardView
                      key={candidate.id}
                      candidate={candidate}
                      getStageInfo={getStageInfo}
                      onViewCandidate={handleViewCandidate}
                      onUpdateStage={handleUpdateStage}
                    />
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="space-y-3">
                  {filteredCandidates.map((candidate: Candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      getStageInfo={getStageInfo}
                      onViewCandidate={handleViewCandidate}
                      onUpdateStage={handleUpdateStage}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-slate-600 mt-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Show</span>
                    <select 
                      value={pagination.pageSize} 
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="border border-gray-300 dark:border-slate-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>
                      of {pagination.totalCount} candidates
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + Math.max(1, pagination.page - 2);
                        if (page > pagination.totalPages) return null;
                        
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              page === pagination.page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}