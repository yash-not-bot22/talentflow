import { useCandidates } from '../hooks/useCandidates';
import type { Candidate } from '../../../db';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

export function SimpleCandidatesPage() {
  const { candidates, loading, error } = useCandidates();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const getStageColor = (stage: Candidate['stage']) => {
    switch (stage) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'screen': return 'bg-yellow-100 text-yellow-800';
      case 'tech': return 'bg-purple-100 text-purple-800';
      case 'offer': return 'bg-green-100 text-green-800';
      case 'hired': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Candidates</h1>
      
      <div className="space-y-4">
        {candidates.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No candidates found</p>
        ) : (
          candidates.map((candidate: Candidate) => (
            <div key={candidate.id} className="bg-white p-6 rounded-lg shadow border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                  <p className="text-gray-600">{candidate.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStageColor(candidate.stage)}`}>
                  {candidate.stage}
                </span>
              </div>
              
              {candidate.notes && candidate.notes.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Notes:</h4>
                  <div className="space-y-2">
                    {candidate.notes.map((note, index) => (
                      <div key={index} className="text-gray-600 text-sm bg-gray-50 p-2 rounded">
                        <p>{note.text}</p>
                        <span className="text-xs text-gray-400">
                          {new Date(note.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                <span>Job ID: {candidate.jobId}</span>
                <span>Applied: {new Date(candidate.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}