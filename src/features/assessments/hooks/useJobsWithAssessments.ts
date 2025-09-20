import { useState, useEffect } from 'react';
import type { Assessment } from '../../../db';
import { assessmentsApi } from '../../../api/assessmentsApi';

export interface JobWithAssessmentStatus {
  jobId: number;
  hasAssessment: boolean;
  assessment?: Assessment;
}

export function useJobsWithAssessments(jobIds: number[]) {
  const [assessmentStatuses, setAssessmentStatuses] = useState<Map<number, JobWithAssessmentStatus>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (jobIds.length === 0) {
      setAssessmentStatuses(new Map());
      return;
    }

    loadAssessmentStatuses();
  }, [jobIds]);

  const loadAssessmentStatuses = async () => {
    setLoading(true);
    
    try {
      // Check each job for assessments
      const assessmentPromises = jobIds.map(async (jobId) => {
        try {
          const assessment = await assessmentsApi.getAssessment(jobId);
          return {
            jobId,
            hasAssessment: true,
            assessment,
          };
        } catch (error) {
          // No assessment found for this job
          return {
            jobId,
            hasAssessment: false,
          };
        }
      });

      const results = await Promise.all(assessmentPromises);
      
      const statusMap = new Map<number, JobWithAssessmentStatus>();
      results.forEach(result => {
        statusMap.set(result.jobId, result);
      });
      
      setAssessmentStatuses(statusMap);
    } catch (error) {
      console.error('Failed to load assessment statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssessmentStatus = (jobId: number): JobWithAssessmentStatus => {
    return assessmentStatuses.get(jobId) || {
      jobId,
      hasAssessment: false,
    };
  };

  const refreshAssessmentStatus = (jobId: number) => {
    // Reload a specific job's assessment status
    assessmentsApi.getAssessment(jobId)
      .then(assessment => {
        setAssessmentStatuses(prev => new Map(prev.set(jobId, {
          jobId,
          hasAssessment: true,
          assessment,
        })));
      })
      .catch(() => {
        setAssessmentStatuses(prev => new Map(prev.set(jobId, {
          jobId,
          hasAssessment: false,
        })));
      });
  };

  return {
    assessmentStatuses: assessmentStatuses,
    loading,
    getAssessmentStatus,
    refreshAssessmentStatus,
    reload: loadAssessmentStatuses,
  };
}