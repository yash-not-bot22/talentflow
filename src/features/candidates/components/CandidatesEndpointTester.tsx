import React, { useState } from 'react';
import { candidatesApi } from '../../../api/candidatesApi';
import type { Candidate } from '../../../db';

export const CandidatesEndpointTester: React.FC = () => {
  const [results, setResults] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const log = (message: string) => {
    setResults(prev => prev + message + '\n');
    console.log(message);
  };

  const testGetCandidates = async () => {
    try {
      log('🔍 Testing GET /candidates...');
      const response = await candidatesApi.getCandidates({ page: 1, pageSize: 5 });
      log(`✅ Success: Found ${response.data.length} candidates (${response.pagination.totalCount} total)`);
      if (response.data.length > 0) {
        log(`   First candidate: ${response.data[0].name} (${response.data[0].email}) - Stage: ${response.data[0].stage}`);
      }
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testGetCandidatesWithFilters = async () => {
    try {
      log('🔍 Testing GET /candidates with stage filter...');
      const response = await candidatesApi.getCandidates({ stage: 'applied', page: 1, pageSize: 3 });
      log(`✅ Success: Found ${response.data.length} applied candidates`);
      
      log('🔍 Testing GET /candidates with search filter...');
      const searchResponse = await candidatesApi.getCandidates({ search: 'john', page: 1, pageSize: 3 });
      log(`✅ Success: Found ${searchResponse.data.length} candidates matching 'john'`);
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testCreateCandidate = async () => {
    try {
      log('➕ Testing POST /candidates...');
      
      // First get a job ID
      const jobsResponse = await fetch('/api/jobs?pageSize=1');
      const jobsData = await jobsResponse.json();
      
      if (jobsData.data.length === 0) {
        log('❌ No jobs found to create candidate for');
        return;
      }

      const testCandidate = {
        name: 'Test Candidate',
        email: `test.candidate.${Date.now()}@example.com`,
        jobId: jobsData.data[0].id,
        stage: 'applied' as Candidate['stage']
      };

      const created = await candidatesApi.createCandidate(testCandidate);
      log(`✅ Success: Created candidate ${created.name} with ID ${created.id}`);
      return created.id;
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const testUpdateCandidate = async (candidateId?: number) => {
    try {
      // If no candidateId provided, get one from the list
      if (!candidateId) {
        const response = await candidatesApi.getCandidates({ page: 1, pageSize: 1 });
        if (response.data.length === 0) {
          log('❌ No candidates found to update');
          return;
        }
        candidateId = response.data[0].id;
      }

      log(`📝 Testing PATCH /candidates/${candidateId}...`);
      
      // Test stage transition
      const updated = await candidatesApi.updateCandidate(candidateId, { 
        stage: 'screen',
        notes: 'Moved to screening after initial review'
      });
      log(`✅ Success: Updated candidate to stage '${updated.stage}'`);
      
      // Test invalid stage transition
      try {
        await candidatesApi.updateCandidate(candidateId, { stage: 'hired' }); // Invalid jump
        log('❌ Expected error for invalid stage transition but none occurred');
      } catch (error) {
        log(`✅ Success: Correctly rejected invalid stage transition - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testCandidateTimeline = async () => {
    try {
      log('📅 Testing GET /candidates/:id/timeline...');
      
      // Get a candidate
      const response = await candidatesApi.getCandidates({ page: 1, pageSize: 1 });
      if (response.data.length === 0) {
        log('❌ No candidates found for timeline test');
        return;
      }

      const candidateId = response.data[0].id;
      const timeline = await candidatesApi.getCandidateTimeline(candidateId);
      log(`✅ Success: Retrieved timeline for ${timeline.candidate.name} with ${timeline.timeline.length} entries`);
      
      if (timeline.timeline.length > 0) {
        const latest = timeline.timeline[timeline.timeline.length - 1];
        log(`   Latest entry: ${latest.type} at ${new Date(latest.timestamp).toLocaleString()}`);
      }
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testHelperMethods = async () => {
    try {
      log('🚀 Testing helper methods...');
      
      // Get a candidate in early stage
      const response = await candidatesApi.getCandidates({ stage: 'applied', page: 1, pageSize: 1 });
      if (response.data.length === 0) {
        log('❌ No applied candidates found for helper method test');
        return;
      }

      const candidateId = response.data[0].id;
      
      // Test moveToNextStage
      const advanced = await candidatesApi.moveToNextStage(candidateId);
      log(`✅ Success: Advanced candidate to '${advanced.stage}' stage`);
      
      // Test reject candidate
      const rejected = await candidatesApi.rejectCandidate(candidateId, 'Not a good fit');
      log(`✅ Success: Rejected candidate - now in '${rejected.stage}' stage`);
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults('🧪 Starting Candidates API Tests...\n\n');
    
    await testGetCandidates();
    await testGetCandidatesWithFilters();
    const newCandidateId = await testCreateCandidate();
    await testUpdateCandidate(newCandidateId ?? undefined);
    await testCandidateTimeline();
    await testHelperMethods();
    
    log('\n🎉 All tests completed!');
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4">Candidates API Endpoint Tester</h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={testGetCandidates}
          disabled={loading}
          className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          Test GET /candidates
        </button>
        <button
          onClick={testGetCandidatesWithFilters}
          disabled={loading}
          className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
        >
          Test Filters
        </button>
        <button
          onClick={testCreateCandidate}
          disabled={loading}
          className="px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
        >
          Test POST /candidates
        </button>
        <button
          onClick={() => testUpdateCandidate()}
          disabled={loading}
          className="px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
        >
          Test PATCH /candidates
        </button>
        <button
          onClick={testCandidateTimeline}
          disabled={loading}
          className="px-3 py-2 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 disabled:opacity-50"
        >
          Test Timeline
        </button>
        <button
          onClick={testHelperMethods}
          disabled={loading}
          className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 disabled:opacity-50"
        >
          Test Helpers
        </button>
        <button
          onClick={runAllTests}
          disabled={loading}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Run All Tests'}
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded border">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        <pre className="text-sm whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
          {results || 'Click a test button to see results...'}
        </pre>
      </div>
    </div>
  );
};