import React, { useState, useEffect } from 'react';
import { db } from '../db';

export const DatabaseDiagnostics: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<string>('Checking...');
  const [jobCount, setJobCount] = useState<number>(0);
  const [candidateCount, setCandidateCount] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        console.log('🔍 Checking database status...');
        
        // Check if database is open
        if (!db.isOpen()) {
          console.log('📂 Opening database...');
          await db.open();
        }
        
        setDbStatus('Connected');
        console.log('✅ Database connected successfully');

        // Check table counts
        const jobs = await db.jobs.count();
        const candidates = await db.candidates.count();
        
        setJobCount(jobs);
        setCandidateCount(candidates);
        
        console.log(`📊 Found ${jobs} jobs and ${candidates} candidates`);

        // Test a simple query
        const firstJob = await db.jobs.orderBy('id').first();
        console.log('🔧 First job:', firstJob);

        const firstCandidate = await db.candidates.orderBy('id').first();
        console.log('🔧 First candidate:', firstCandidate);

      } catch (err) {
        console.error('❌ Database error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setDbStatus('Error');
      }
    };

    checkDatabase();
  }, []);

  const testDirectDbQuery = async () => {
    try {
      console.log('🧪 Testing direct database query...');
      const allJobs = await db.jobs.toArray();
      console.log('✅ Direct query successful, found', allJobs.length, 'jobs');
      alert(`Direct DB query successful: ${allJobs.length} jobs found`);
    } catch (err) {
      console.error('❌ Direct query failed:', err);
      alert(`Direct query failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const testApiCall = async () => {
    try {
      console.log('🌐 Testing API call...');
      const response = await fetch('/api/jobs?pageSize=1');
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ API call successful:', data);
        alert(`API call successful: ${data.data?.length || 0} jobs returned`);
      } else {
        console.error('❌ API call failed:', response.status, data);
        alert(`API call failed: ${response.status} - ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ API call error:', err);
      alert(`API call error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const regenerateData = async () => {
    try {
      console.log('🔄 Regenerating seed data...');
      const { generateSeedData } = await import('../utils/generateSeedData');
      await generateSeedData();
      console.log('✅ Seed data regenerated');
      alert('Seed data regenerated successfully!');
      window.location.reload();
    } catch (err) {
      console.error('❌ Failed to regenerate data:', err);
      alert(`Failed to regenerate data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-yellow-800">🔧 Database Diagnostics</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <strong>Database Status:</strong> 
          <span className={`ml-2 ${dbStatus === 'Connected' ? 'text-green-600' : dbStatus === 'Error' ? 'text-red-600' : 'text-gray-600'}`}>
            {dbStatus}
          </span>
        </div>
        <div>
          <strong>Jobs Count:</strong> <span className="ml-2">{jobCount}</span>
        </div>
        <div>
          <strong>Candidates Count:</strong> <span className="ml-2">{candidateCount}</span>
        </div>
        <div>
          <strong>Database Open:</strong> <span className="ml-2">{db.isOpen() ? 'Yes' : 'No'}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <strong className="text-red-800">Error:</strong>
          <pre className="text-red-700 text-sm mt-1">{error}</pre>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={testDirectDbQuery}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Test Direct DB Query
        </button>
        <button
          onClick={testApiCall}
          className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
        >
          Test API Call
        </button>
        <button
          onClick={regenerateData}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
        >
          Regenerate Seed Data
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};