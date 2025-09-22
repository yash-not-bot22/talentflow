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
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
        <h3 className="text-red-800 dark:text-red-400 font-medium">Database Error</h3>
        <p className="text-red-700 dark:text-red-300 text-sm mt-1">{status.error}</p>
      </div>
    );
  }

  if (!status.isOpen) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-4">
        <h3 className="text-yellow-800 dark:text-yellow-400 font-medium">Database Connecting...</h3>
        <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">Initializing IndexedDB connection.</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-blue-800 dark:text-blue-400 font-medium">Database Status</h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
            Jobs: {status.jobCount} | Candidates: {status.candidateCount} | Assessments: {status.assessmentCount}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm rounded disabled:opacity-50 transition-colors"
          >
            {isSeeding ? 'Seeding...' : 'Seed Data'}
          </button>
          <button
            onClick={handleClearDatabase}
            disabled={isSeeding}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white text-sm rounded disabled:opacity-50 transition-colors"
          >
            Clear Data
          </button>
        </div>
      </div>
    </div>
  );
}