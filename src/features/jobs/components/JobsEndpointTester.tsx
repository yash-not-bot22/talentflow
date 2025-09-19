import React from 'react';
import { jobsApi } from '../../../api/jobsApi';

export function JobsEndpointTester() {
  const [results, setResults] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testGetJobs = async () => {
    setLoading(true);
    try {
      addResult('Testing GET /jobs...');
      const response = await jobsApi.getJobs(
        { search: '', status: '', sort: 'order' },
        { page: 1, pageSize: 5 }
      );
      addResult(`✅ GET /jobs - Success: Found ${response.data.length} jobs`);
    } catch (error) {
      addResult(`❌ GET /jobs - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const testCreateJob = async () => {
    setLoading(true);
    try {
      addResult('Testing POST /jobs...');
      const newJob = await jobsApi.createJob({
        title: `Test Job ${Date.now()}`,
        status: 'active',
        tags: ['test', 'frontend']
      });
      addResult(`✅ POST /jobs - Success: Created job "${newJob.title}" with ID ${newJob.id}`);
    } catch (error) {
      addResult(`❌ POST /jobs - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const testUpdateJob = async () => {
    setLoading(true);
    try {
      addResult('Testing PATCH /jobs/:id...');
      // First get a job to update
      const jobsResponse = await jobsApi.getJobs(
        { search: '', status: '', sort: 'order' },
        { page: 1, pageSize: 1 }
      );
      
      if (jobsResponse.data.length === 0) {
        addResult('❌ PATCH /jobs/:id - Error: No jobs available to update');
        setLoading(false);
        return;
      }

      const jobToUpdate = jobsResponse.data[0];
      const updatedJob = await jobsApi.updateJob(jobToUpdate.id, {
        title: `Updated ${jobToUpdate.title}`,
        tags: [...(jobToUpdate.tags || []), 'updated']
      });
      addResult(`✅ PATCH /jobs/:id - Success: Updated job "${updatedJob.title}"`);
    } catch (error) {
      addResult(`❌ PATCH /jobs/:id - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const testReorderJob = async () => {
    setLoading(true);
    try {
      addResult('Testing PATCH /jobs/:id/reorder...');
      // First get jobs to reorder
      const jobsResponse = await jobsApi.getJobs(
        { search: '', status: '', sort: 'order' },
        { page: 1, pageSize: 5 }
      );
      
      if (jobsResponse.data.length < 2) {
        addResult('❌ PATCH /jobs/:id/reorder - Error: Need at least 2 jobs to test reordering');
        setLoading(false);
        return;
      }

      const sortedJobs = jobsResponse.data.sort((a, b) => a.order - b.order);
      const jobToMove = sortedJobs[0];
      const targetOrder = sortedJobs[1].order;
      
      const reorderedJob = await jobsApi.reorderJob(jobToMove.id, {
        fromOrder: jobToMove.order,
        toOrder: targetOrder
      });
      addResult(`✅ PATCH /jobs/:id/reorder - Success: Moved job "${reorderedJob.title}" from order ${jobToMove.order} to ${targetOrder}`);
    } catch (error) {
      addResult(`❌ PATCH /jobs/:id/reorder - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const clearResults = () => setResults([]);

  return (
    <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 mb-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">🧪 Jobs API Endpoint Tester</h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={testGetJobs}
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test GET /jobs
        </button>
        
        <button
          onClick={testCreateJob}
          disabled={loading}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test POST /jobs
        </button>
        
        <button
          onClick={testUpdateJob}
          disabled={loading}
          className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          Test PATCH /jobs/:id
        </button>
        
        <button
          onClick={testReorderJob}
          disabled={loading}
          className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test PATCH /jobs/:id/reorder
        </button>
        
        <button
          onClick={clearResults}
          disabled={loading}
          className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 disabled:opacity-50"
        >
          Clear Results
        </button>
      </div>

      {loading && (
        <div className="text-blue-600 text-sm mb-2">🔄 Testing endpoint...</div>
      )}

      <div className="bg-white rounded border p-3 h-64 overflow-y-auto">
        {results.length === 0 ? (
          <div className="text-gray-500 text-sm">Click any test button to see results...</div>
        ) : (
          <div className="space-y-1">
            {results.map((result, index) => (
              <div key={index} className="text-xs font-mono text-gray-700">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}