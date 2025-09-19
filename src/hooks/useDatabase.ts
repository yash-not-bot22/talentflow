import { useEffect, useState } from 'react';
import { db } from '../db';
import { generateSeedData } from '../utils/generateSeedData';

interface DatabaseStatus {
  isOpen: boolean;
  hasData: boolean;
  jobCount: number;
  candidateCount: number;
  assessmentCount: number;
  error?: string;
}

export function useDatabase() {
  const [status, setStatus] = useState<DatabaseStatus>({
    isOpen: false,
    hasData: false,
    jobCount: 0,
    candidateCount: 0,
    assessmentCount: 0,
  });

  const [isSeeding, setIsSeeding] = useState(false);

  const checkDatabaseStatus = async () => {
    try {
      const jobCount = await db.jobs.count();
      const candidateCount = await db.candidates.count();
      const assessmentCount = await db.assessments.count();

      setStatus({
        isOpen: true,
        hasData: jobCount > 0 || candidateCount > 0 || assessmentCount > 0,
        jobCount,
        candidateCount,
        assessmentCount,
      });
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown database error',
      }));
    }
  };

  const seedDatabase = async () => {
    setIsSeeding(true);
    try {
      await generateSeedData();
      await checkDatabaseStatus();
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to seed database',
      }));
    } finally {
      setIsSeeding(false);
    }
  };

  const clearDatabase = async () => {
    try {
      await db.transaction('rw', [db.jobs, db.candidates, db.assessments, db.candidateResponses], async () => {
        await db.jobs.clear();
        await db.candidates.clear();
        await db.assessments.clear();
        await db.candidateResponses.clear();
      });
      await checkDatabaseStatus();
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to clear database',
      }));
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  return {
    status,
    isSeeding,
    seedDatabase,
    clearDatabase,
    refreshStatus: checkDatabaseStatus,
  };
}