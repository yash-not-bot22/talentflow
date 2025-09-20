import { useEffect, useState } from 'react';
import { candidatesApi } from '../api/candidatesApi';
import type { Candidate } from '../db';

export function DebugCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔧 Debug: Fetching candidates...');
        const response = await candidatesApi.getCandidates({ pageSize: 10 });
        console.log('🔧 Debug: Response:', response);
        setCandidates(response.data);
        setLoading(false);
      } catch (err) {
        console.error('🔧 Debug: Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Debug: Candidates Data</h2>
      <p>Found {candidates.length} candidates</p>
      <pre>{JSON.stringify(candidates, null, 2)}</pre>
    </div>
  );
}