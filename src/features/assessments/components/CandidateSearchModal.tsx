import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { Candidate } from '../../../db';
import { candidatesApi } from '../../../api/candidatesApi';

interface CandidateSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCandidate: (candidate: Candidate) => void;
  jobId: number;
}

export function CandidateSearchModal({ isOpen, onClose, onSelectCandidate, jobId }: CandidateSearchModalProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCandidates();
    }
  }, [isOpen, jobId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCandidates(candidates);
    } else {
      const filtered = candidates.filter(candidate =>
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCandidates(filtered);
    }
  }, [searchQuery, candidates]);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      // Get candidates for this specific job
      const response = await candidatesApi.getCandidates({ jobId });
      setCandidates(response.data);
      setFilteredCandidates(response.data);
    } catch (error) {
      console.error('Error loading candidates:', error);
      setCandidates([]);
      setFilteredCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candidate: Candidate) => {
    onSelectCandidate(candidate);
    onClose();
    setSearchQuery('');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStageColor = (stage: Candidate['stage']) => {
    const colors = {
      applied: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
      screen: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
      tech: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
      offer: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
      hired: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
      rejected: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    };
    return colors[stage] || 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300';
  };

  const getStageName = (stage: Candidate['stage']) => {
    const names = {
      applied: 'Applied',
      screen: 'Screening',
      tech: 'Technical',
      offer: 'Offer',
      hired: 'Hired',
      rejected: 'Rejected',
    };
    return names[stage] || stage;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-black dark:bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select Candidate</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-600">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search candidates by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Candidates List */}
          <div className="overflow-y-auto max-h-96">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading candidates...</span>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="text-center p-8">
                <UserIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'No matching candidates' : 'No candidates found'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery 
                    ? 'Try adjusting your search terms.' 
                    : 'There are no candidates for this job yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-slate-600">
                {filteredCandidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => handleSelectCandidate(candidate)}
                    className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700 focus:bg-gray-50 dark:focus:bg-slate-700 focus:outline-none transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {getInitials(candidate.name)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {candidate.name}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(candidate.stage)}`}>
                            {getStageName(candidate.stage)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {candidate.email}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Applied {new Date(candidate.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Select a candidate to simulate taking this assessment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}