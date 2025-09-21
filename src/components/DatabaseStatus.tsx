import { useDatabase } from '../hooks/useDatabase';

export function DatabaseStatus() {
  const { status, isSeeding, seedDatabase, clearDatabase } = useDatabase();

  // Handle clear database with event emission
  const handleClearDatabase = async () => {
    await clearDatabase();
    // Emit custom event to trigger refresh across the app
    window.dispatchEvent(new CustomEvent('database-cleared'));
  };

  // Handle seed database with event emission  
  const handleSeedDatabase = async () => {
    await seedDatabase();
    // Emit custom event to trigger refresh across the app
    window.dispatchEvent(new CustomEvent('database-seeded'));
  };

  if (status.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <h3 className="text-red-800 font-medium">Database Error</h3>
        <p className="text-red-700 text-sm mt-1">{status.error}</p>
      </div>
    );
  }

  if (!status.isOpen) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
        <h3 className="text-yellow-800 font-medium">Database Connecting...</h3>
        <p className="text-yellow-700 text-sm mt-1">Initializing IndexedDB connection.</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-blue-800 font-medium">Database Status</h3>
          <p className="text-blue-700 text-sm mt-1">
            Jobs: {status.jobCount} | Candidates: {status.candidateCount} | Assessments: {status.assessmentCount}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSeeding ? 'Seeding...' : 'Seed Data'}
          </button>
          <button
            onClick={handleClearDatabase}
            disabled={isSeeding}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
          >
            Clear Data
          </button>
        </div>
      </div>
    </div>
  );
}