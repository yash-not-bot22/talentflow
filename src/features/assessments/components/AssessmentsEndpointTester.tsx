import React, { useState } from 'react';
import { assessmentsApi } from '../../../api/assessmentsApi';
import type { Assessment, Section, Question } from '../../../db';

export const AssessmentsEndpointTester: React.FC = () => {
  const [results, setResults] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const log = (message: string) => {
    setResults(prev => prev + message + '\n');
    console.log(message);
  };

  const testGetAssessment = async (jobId?: number) => {
    try {
      if (!jobId) {
        // Get a job ID first
        const jobsResponse = await fetch('/api/jobs?pageSize=1');
        const jobsData = await jobsResponse.json();
        
        if (jobsData.data.length === 0) {
          log('❌ No jobs found to test assessment retrieval');
          return null;
        }
        jobId = jobsData.data[0].id;
      }

      log(`🔍 Testing GET /assessments/${jobId}...`);
      const assessment = await assessmentsApi.getAssessment(jobId!);
      log(`✅ Success: Retrieved assessment with ${assessment.sections.length} sections`);
      
      const totalQuestions = assessment.sections.reduce((sum, section) => sum + section.questions.length, 0);
      log(`   Total questions: ${totalQuestions}`);
      
      if (assessment.sections.length > 0) {
        log(`   First section: "${assessment.sections[0].name}" (${assessment.sections[0].questions.length} questions)`);
      }
      
      return assessment;
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const testGetNonExistentAssessment = async () => {
    try {
      log('🔍 Testing GET /assessments/9999 (non-existent)...');
      await assessmentsApi.getAssessment(9999);
      log('❌ Expected error for non-existent assessment but got success');
    } catch (error) {
      log(`✅ Success: Correctly handled non-existent assessment - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testGetAssessmentInvalidJobId = async () => {
    try {
      log('🔍 Testing GET /assessments/invalid (invalid job ID)...');
      await assessmentsApi.getAssessment(-1);
      log('❌ Expected error for invalid job ID but got success');
    } catch (error) {
      log(`✅ Success: Correctly handled invalid job ID - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const createSampleAssessment = (): Omit<Assessment, 'jobId' | 'updatedAt'> => {
    const sampleQuestions: Question[] = [
      {
        id: 'q1',
        type: 'single-choice',
        text: 'What is your experience level with React?',
        options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        required: true
      },
      {
        id: 'q2',
        type: 'multi-choice',
        text: 'Which testing frameworks have you used?',
        options: ['Jest', 'Cypress', 'Vitest', 'Playwright', 'Testing Library'],
        required: false
      },
      {
        id: 'q3',
        type: 'short-text',
        text: 'What is your preferred IDE/Editor?',
        maxLength: 100,
        required: true
      },
      {
        id: 'q4',
        type: 'long-text',
        text: 'Describe a challenging project you worked on and how you overcame the challenges.',
        maxLength: 1000,
        required: true
      },
      {
        id: 'q5',
        type: 'numeric',
        text: 'How many years of professional programming experience do you have?',
        min: 0,
        max: 50,
        required: true
      }
    ];

    const sections: Section[] = [
      {
        id: 'section-1',
        name: 'Technical Background',
        questions: sampleQuestions.slice(0, 3)
      },
      {
        id: 'section-2',
        name: 'Experience & Portfolio',
        questions: sampleQuestions.slice(3)
      }
    ];

    return { sections };
  };

  const testCreateAssessment = async (jobId?: number) => {
    try {
      if (!jobId) {
        // Get a job ID first
        const jobsResponse = await fetch('/api/jobs?pageSize=1');
        const jobsData = await jobsResponse.json();
        
        if (jobsData.data.length === 0) {
          log('❌ No jobs found to test assessment creation');
          return null;
        }
        jobId = jobsData.data[0].id;
      }

      log(`➕ Testing PUT /assessments/${jobId}...`);
      const sampleAssessment = createSampleAssessment();
      const created = await assessmentsApi.updateAssessment(jobId!, sampleAssessment);
      
      log(`✅ Success: Created assessment with ${created.sections.length} sections`);
      log(`   Job ID: ${created.jobId}, Updated: ${new Date(created.updatedAt).toLocaleString()}`);
      
      return created;
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const testCreateInvalidAssessment = async () => {
    try {
      log('🔍 Testing PUT /assessments/1 with invalid data (no sections)...');
      await assessmentsApi.updateAssessment(1, { sections: [] });
      log('❌ Expected error for invalid assessment but got success');
    } catch (error) {
      log(`✅ Success: Correctly rejected invalid assessment - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      log('🔍 Testing PUT /assessments/1 with duplicate question IDs...');
      const invalidAssessment = {
        sections: [
          {
            id: 'section-1',
            name: 'Test Section',
            questions: [
              { id: 'duplicate', type: 'short-text' as const, text: 'Question 1', required: true },
              { id: 'duplicate', type: 'short-text' as const, text: 'Question 2', required: true }
            ]
          }
        ]
      };
      await assessmentsApi.updateAssessment(1, invalidAssessment);
      log('❌ Expected error for duplicate question IDs but got success');
    } catch (error) {
      log(`✅ Success: Correctly rejected duplicate question IDs - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testSubmitAssessment = async () => {
    try {
      log('📝 Testing POST /assessments/:jobId/submit...');
      
      // First, ensure we have an assessment
      const jobsResponse = await fetch('/api/jobs?pageSize=1');
      const jobsData = await jobsResponse.json();
      
      if (jobsData.data.length === 0) {
        log('❌ No jobs found for submission test');
        return;
      }

      const jobId = jobsData.data[0].id;
      
      // Create assessment if it doesn't exist
      let assessment: Assessment;
      try {
        assessment = await assessmentsApi.getAssessment(jobId);
      } catch (error) {
        log('   Creating assessment for submission test...');
        assessment = await assessmentsApi.updateAssessment(jobId, createSampleAssessment());
      }

      // Get a candidate for this job
      const candidatesResponse = await fetch(`/api/candidates?search=&stage=&page=1&pageSize=1`);
      const candidatesData = await candidatesResponse.json();
      
      if (candidatesData.data.length === 0) {
        log('❌ No candidates found for submission test');
        return;
      }

      // Find a candidate for this job or use the first one
      let candidate = candidatesData.data.find((c: any) => c.jobId === jobId);
      if (!candidate) {
        candidate = candidatesData.data[0];
        log(`   Using candidate ${candidate.name} (different job) for test`);
      }

      // Create sample responses based on the assessment
      const responses: Record<string, string | string[] | number | null> = {};
      
      assessment.sections.forEach(section => {
        section.questions.forEach(question => {
          switch (question.type) {
            case 'single-choice':
              responses[question.id] = question.options?.[0] || 'Test Answer';
              break;
            case 'multi-choice':
              responses[question.id] = question.options?.slice(0, 2) || ['Test Answer'];
              break;
            case 'short-text':
            case 'long-text':
              responses[question.id] = 'This is a test response';
              break;
            case 'numeric':
              responses[question.id] = 5;
              break;
            case 'file-upload':
              responses[question.id] = '/test-file.pdf';
              break;
          }
        });
      });

      const submissionData = {
        candidateId: candidate.id,
        responses
      };

      const result = await assessmentsApi.submitResponse(jobId, submissionData);
      log(`✅ Success: Submitted assessment for ${candidate.name}`);
      log(`   Response ID: ${result.id}, Submitted: ${new Date(result.submittedAt).toLocaleString()}`);
      log(`   Total responses: ${Object.keys(result.responses).length}`);
      
      return result;
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const testSubmitInvalidData = async () => {
    try {
      log('🔍 Testing POST /assessments/1/submit with invalid candidate ID...');
      await assessmentsApi.submitResponse(1, {
        candidateId: 99999,
        responses: { 'test': 'value' }
      });
      log('❌ Expected error for invalid candidate ID but got success');
    } catch (error) {
      log(`✅ Success: Correctly rejected invalid candidate ID - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      log('🔍 Testing POST /assessments/9999/submit with non-existent job...');
      await assessmentsApi.submitResponse(9999, {
        candidateId: 1,
        responses: { 'test': 'value' }
      });
      log('❌ Expected error for non-existent job but got success');
    } catch (error) {
      log(`✅ Success: Correctly rejected non-existent job - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testValidationHelpers = async () => {
    try {
      log('🧪 Testing validation helper methods...');
      
      // Test valid assessment
      const validAssessment = createSampleAssessment();
      const validationErrors = assessmentsApi.validateAssessment(validAssessment);
      if (validationErrors.length === 0) {
        log('✅ Valid assessment passed validation');
      } else {
        log(`❌ Valid assessment failed validation: ${validationErrors.join('; ')}`);
      }

      // Test invalid assessment (no sections)
      const invalidAssessment = { sections: [] };
      const invalidErrors = assessmentsApi.validateAssessment(invalidAssessment);
      if (invalidErrors.length > 0) {
        log(`✅ Invalid assessment correctly rejected: ${invalidErrors[0]}`);
      } else {
        log('❌ Invalid assessment incorrectly passed validation');
      }

      // Test submission validation
      const sampleAssessment = createSampleAssessment();
      const mockAssessment: Assessment = {
        jobId: 1,
        ...sampleAssessment,
        updatedAt: Date.now()
      };

      const validResponses = {
        'q1': 'Intermediate',
        'q3': 'VS Code',
        'q4': 'A challenging project was...',
        'q5': 3
      };

      const submissionErrors = assessmentsApi.validateSubmission(mockAssessment, validResponses);
      if (submissionErrors.length === 0) {
        log('✅ Valid submission passed validation');
      } else {
        log(`❌ Valid submission failed validation: ${submissionErrors.join('; ')}`);
      }

      // Test missing required field
      const incompleteResponses = { 'q2': ['Jest'] }; // Missing required q1, q3, q4, q5
      const incompleteErrors = assessmentsApi.validateSubmission(mockAssessment, incompleteResponses);
      if (incompleteErrors.length > 0) {
        log(`✅ Incomplete submission correctly rejected: Found ${incompleteErrors.length} validation errors`);
      } else {
        log('❌ Incomplete submission incorrectly passed validation');
      }
    } catch (error) {
      log(`❌ Error in validation tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults('🧪 Starting Assessments API Tests...\n\n');
    
    // Test GET operations
    await testGetAssessment();
    await testGetNonExistentAssessment();
    await testGetAssessmentInvalidJobId();
    
    // Test PUT operations
    await testCreateAssessment();
    await testCreateInvalidAssessment();
    
    // Test POST operations
    await testSubmitAssessment();
    await testSubmitInvalidData();
    
    // Test validation helpers
    await testValidationHelpers();
    
    log('\n🎉 All assessments tests completed!');
    setLoading(false);
  };

  const clearResults = () => {
    setResults('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4">Assessments API Endpoint Tester</h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => testGetAssessment()}
          disabled={loading}
          className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          Test GET Assessment
        </button>
        <button
          onClick={() => testCreateAssessment()}
          disabled={loading}
          className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
        >
          Test PUT Assessment
        </button>
        <button
          onClick={testSubmitAssessment}
          disabled={loading}
          className="px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
        >
          Test POST Submit
        </button>
        <button
          onClick={testValidationHelpers}
          disabled={loading}
          className="px-3 py-2 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 disabled:opacity-50"
        >
          Test Validation
        </button>
        <button
          onClick={runAllTests}
          disabled={loading}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Run All Tests'}
        </button>
        <button
          onClick={clearResults}
          disabled={loading}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Clear
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded border">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        <pre className="text-sm whitespace-pre-wrap text-gray-800 max-h-96 overflow-y-auto">
          {results || 'Click a test button to see results...'}
        </pre>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <h4 className="font-semibold mb-2">API Endpoints Tested:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li><code className="bg-gray-100 px-1 rounded">GET /assessments/:jobId</code> - Retrieve assessment for job</li>
          <li><code className="bg-gray-100 px-1 rounded">PUT /assessments/:jobId</code> - Create/update assessment</li>
          <li><code className="bg-gray-100 px-1 rounded">POST /assessments/:jobId/submit</code> - Submit candidate responses</li>
        </ul>
      </div>
    </div>
  );
};