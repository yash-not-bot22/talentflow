import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandidates, useCandidateStages, useCandidateOperations } from '../hooks/useCandidates';
import { useJobs } from '../../jobs/hooks/useJobs';
import type { Candidate } from '../../../db';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  EyeIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon,
  BriefcaseIcon,
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
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-slate-500 transition-all cursor-pointer group"
         onClick={() => onViewCandidate(candidate)}>
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

            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewCandidate(candidate);
              }}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="View candidate"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
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
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-slate-500 transition-all cursor-pointer group"
         onClick={() => onViewCandidate(candidate)}>
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          {getInitials(candidate.name)}
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${stageInfo.color}`}>
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
          <BriefcaseIcon className="h-4 w-4 mr-1" />
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

        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewCandidate(candidate);
          }}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View candidate"
        >
          <EyeIcon className="h-4 w-4" />
        </button>
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
  
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [stageFilter, setStageFilter] = useState(filters.stage || '');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'cards' | 'stages'>('list');

  // Use server-side filtering - no client-side filtering needed
  const filteredCandidates = candidates;

  // Handle search with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    updateFilters({ search: value });
  }, [updateFilters]);

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
    setSearchTerm('');
    setStageFilter('');
    updateFilters({ search: '', stage: '' });
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 mb-6">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Candidates</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {loading ? 'Loading...' : `${filteredCandidates.length} of ${candidates.length} candidates`}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-md transition-colors flex items-center ${
                      viewMode === 'list' 
                        ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    title="List view"
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-2 rounded-md transition-colors flex items-center ${
                      viewMode === 'cards' 
                        ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    title="Card view"
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('stages')}
                    className={`px-3 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                      viewMode === 'stages' 
                        ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    title="Candidate Stage Board"
                  >
                    <TableCellsIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Candidate Stage Board</span>
                  </button>
                </div>


                <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                  <BriefcaseIcon className="h-4 w-4 mr-2" />
                  Import
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Candidate
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search candidates by name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:bg-white dark:focus:bg-slate-600 transition-colors"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${
                      showFilters 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 shadow-sm' 
                        : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600'
                    }`}
                  >
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    Filters
                  </button>

                  {/* Active Filter Badges */}
                  {(searchTerm || stageFilter) && (
                    <div className="flex items-center space-x-2">
                      {searchTerm && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-600">
                          Search: "{searchTerm}"
                          <button
                            onClick={() => handleSearchChange('')}
                            className="ml-2 hover:text-blue-600"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {stageFilter && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-600">
                          Stage: {getStageInfo(stageFilter as Candidate['stage']).label}
                          <button
                            onClick={() => handleStageFilterChange('')}
                            className="ml-2 hover:text-green-600"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      <button
                        onClick={clearFilters}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {filteredCandidates.length} results
                </div>
              </div>

              {/* Expanded Filters */}
              {showFilters && (
                <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Filter by Stage
                      </label>
                      <select
                        value={stageFilter}
                        onChange={(e) => handleStageFilterChange(e.target.value)}
                        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      >
                        <option value="">All Stages</option>
                        {getStageOptions().map((stage: any) => (
                          <option key={stage.value} value={stage.value}>
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sort By
                      </label>
                      <select className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                        <option value="created_desc">Recently Added</option>
                        <option value="created_asc">Oldest First</option>
                        <option value="name_asc">Name A-Z</option>
                        <option value="name_desc">Name Z-A</option>
                        <option value="stage">Stage</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Job Filter
                      </label>
                      <select className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                        <option value="">All Jobs</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date Range
                      </label>
                      <select className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                        <option value="">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600">
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
                {searchTerm || stageFilter 
                  ? 'Try adjusting your search or filters to find what you\'re looking for'
                  : 'Get started by adding your first candidate to the system'
                }
              </p>
              {!searchTerm && !stageFilter && (
                <button className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Your First Candidate
                </button>
              )}
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
  );
}