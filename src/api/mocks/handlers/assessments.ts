import { http, HttpResponse } from 'msw';
import { db } from '../../../db';
import type { Assessment, CandidateResponse } from '../../../db';

// Helper function to simulate network delays
const delay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200));

// Helper function to simulate errors (7.5% chance)
const shouldError = () => Math.random() < 0.075;

// Helper function to validate question IDs are unique within assessment
const validateQuestionIds = (assessment: Omit<Assessment, 'jobId' | 'updatedAt'>): string[] => {
  const questionIds = new Set<string>();
  const errors: string[] = [];
  
  assessment.sections.forEach((section, sectionIndex) => {
    section.questions.forEach((question, questionIndex) => {
      if (questionIds.has(question.id)) {
        errors.push(`Duplicate question ID "${question.id}" in section ${sectionIndex + 1}, question ${questionIndex + 1}`);
      } else {
        questionIds.add(question.id);
      }
    });
  });
  
  return errors;
};

export const assessmentsHandlers = [
  // GET /assessments/:jobId
  http.get('/api/assessments/:jobId', async ({ params }) => {

    try {
      console.log('🔍 GET /assessments/:jobId - Starting handler...');
      
      // Ensure database is open
      if (!db.isOpen()) {
        console.log('📂 Database not open, opening...');
        await db.open();
      }

      const jobId = parseInt(params.jobId as string);
      console.log('🔍 GET /assessments with jobId:', jobId);

      // Validate jobId
      if (isNaN(jobId) || jobId <= 0) {
        console.log('❌ Invalid jobId:', params.jobId);
        return new HttpResponse(
          JSON.stringify({ error: 'Invalid job ID', details: 'Job ID must be a positive integer' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if job exists
      const job = await db.jobs.get(jobId);
      if (!job) {
        console.log('❌ Job not found:', jobId);
        return new HttpResponse(
          JSON.stringify({ error: 'Job not found', details: `No job found with ID ${jobId}` }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log('🔍 GET /assessments - Fetching assessment for job:', job.title);
      const assessment = await db.assessments.get(jobId);
      
      if (!assessment) {
        console.log('❌ Assessment not found for job:', jobId);
        return new HttpResponse(
          JSON.stringify({ 
            error: 'Assessment not found', 
            details: `No assessment configured for job "${job.title}"` 
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const response = {
        data: assessment
      };

      console.log('✅ Returning assessment with', assessment.sections.length, 'sections');
      return HttpResponse.json(response);
    } catch (error) {
      console.error('❌ Error in GET /assessments/:jobId:', error);
      return new HttpResponse(
        JSON.stringify({ error: 'Database error', details: error instanceof Error ? error.message : 'Unknown error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }),

  // PUT /assessments/:jobId
  http.put('/api/assessments/:jobId', async ({ params, request }) => {
    await delay();
    
    if (shouldError()) {
      return new HttpResponse(
        JSON.stringify({ error: 'Failed to update assessment' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      console.log('🔧 PUT /assessments/:jobId - Starting handler...');
      
      // Ensure database is open
      if (!db.isOpen()) {
        console.log('📂 Database not open, opening...');
        await db.open();
      }

      const jobId = parseInt(params.jobId as string);
      console.log('🔧 PUT /assessments with jobId:', jobId);

      // Validate jobId
      if (isNaN(jobId) || jobId <= 0) {
        console.log('❌ Invalid jobId:', params.jobId);
        return new HttpResponse(
          JSON.stringify({ error: 'Invalid job ID', details: 'Job ID must be a positive integer' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if job exists
      const job = await db.jobs.get(jobId);
      if (!job) {
        console.log('❌ Job not found:', jobId);
        return new HttpResponse(
          JSON.stringify({ error: 'Job not found', details: `No job found with ID ${jobId}` }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Parse request body
      const assessmentData = await request.json() as Omit<Assessment, 'jobId' | 'updatedAt'>;
      console.log('🔧 PUT /assessments - Received assessment data with', assessmentData.sections?.length || 0, 'sections');

      // Validate assessment structure
      if (!assessmentData.sections || !Array.isArray(assessmentData.sections)) {
        return new HttpResponse(
          JSON.stringify({ error: 'Invalid assessment data', details: 'Assessment must have sections array' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (assessmentData.sections.length === 0) {
        return new HttpResponse(
          JSON.stringify({ error: 'Invalid assessment data', details: 'Assessment must have at least one section' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Validate section and question structure
      for (let i = 0; i < assessmentData.sections.length; i++) {
        const section = assessmentData.sections[i];
        
        if (!section.id || typeof section.id !== 'string') {
          return new HttpResponse(
            JSON.stringify({ 
              error: 'Invalid section data', 
              details: `Section ${i + 1}: Must have a valid ID` 
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (!section.name || typeof section.name !== 'string') {
          return new HttpResponse(
            JSON.stringify({ 
              error: 'Invalid section data', 
              details: `Section ${i + 1}: Must have a name` 
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (!section.questions || !Array.isArray(section.questions)) {
          return new HttpResponse(
            JSON.stringify({ 
              error: 'Invalid section data', 
              details: `Section ${i + 1}: Must have questions array` 
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (section.questions.length === 0) {
          return new HttpResponse(
            JSON.stringify({ 
              error: 'Invalid section data', 
              details: `Section ${i + 1}: Must have at least one question` 
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Validate each question
        for (let j = 0; j < section.questions.length; j++) {
          const question = section.questions[j];
          
          if (!question.id || typeof question.id !== 'string') {
            return new HttpResponse(
              JSON.stringify({ 
                error: 'Invalid question data', 
                details: `Section ${i + 1}, Question ${j + 1}: Must have a valid ID` 
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if (!question.text || typeof question.text !== 'string') {
            return new HttpResponse(
              JSON.stringify({ 
                error: 'Invalid question data', 
                details: `Section ${i + 1}, Question ${j + 1}: Must have question text` 
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const validTypes = ['single-choice', 'multi-choice', 'short-text', 'long-text', 'numeric', 'file-upload'];
          if (!question.type || !validTypes.includes(question.type)) {
            return new HttpResponse(
              JSON.stringify({ 
                error: 'Invalid question data', 
                details: `Section ${i + 1}, Question ${j + 1}: Must have a valid type (${validTypes.join(', ')})` 
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // Validate choice questions have options
          if (['single-choice', 'multi-choice'].includes(question.type)) {
            if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
              return new HttpResponse(
                JSON.stringify({ 
                  error: 'Invalid question data', 
                  details: `Section ${i + 1}, Question ${j + 1}: Choice questions must have at least 2 options` 
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
              );
            }
          }
        }
      }

      // Validate unique question IDs
      const questionIdErrors = validateQuestionIds(assessmentData);
      if (questionIdErrors.length > 0) {
        return new HttpResponse(
          JSON.stringify({ 
            error: 'Duplicate question IDs', 
            details: questionIdErrors.join('; ') 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Create the complete assessment object
      const assessment: Assessment = {
        jobId,
        sections: assessmentData.sections,
        updatedAt: Date.now()
      };

      // Store or update in database
      await db.assessments.put(assessment);
      console.log('✅ Assessment saved successfully for job:', job.title);

      const response = {
        data: assessment
      };

      return HttpResponse.json(response);
    } catch (error) {
      console.error('❌ Error in PUT /assessments/:jobId:', error);
      return new HttpResponse(
        JSON.stringify({ error: 'Database error', details: error instanceof Error ? error.message : 'Unknown error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }),

  // POST /assessments/:jobId/submit
  http.post('/api/assessments/:jobId/submit', async ({ params, request }) => {
    await delay();
    
    if (shouldError()) {
      return new HttpResponse(
        JSON.stringify({ error: 'Failed to submit assessment response' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      console.log('📝 POST /assessments/:jobId/submit - Starting handler...');
      
      // Ensure database is open
      if (!db.isOpen()) {
        console.log('📂 Database not open, opening...');
        await db.open();
      }

      const jobId = parseInt(params.jobId as string);
      console.log('📝 POST /assessments/:jobId/submit with jobId:', jobId);

      // Validate jobId
      if (isNaN(jobId) || jobId <= 0) {
        console.log('❌ Invalid jobId:', params.jobId);
        return new HttpResponse(
          JSON.stringify({ error: 'Invalid job ID', details: 'Job ID must be a positive integer' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if job exists
      const job = await db.jobs.get(jobId);
      if (!job) {
        console.log('❌ Job not found:', jobId);
        return new HttpResponse(
          JSON.stringify({ error: 'Job not found', details: `No job found with ID ${jobId}` }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if assessment exists
      const assessment = await db.assessments.get(jobId);
      if (!assessment) {
        console.log('❌ Assessment not found for job:', jobId);
        return new HttpResponse(
          JSON.stringify({ 
            error: 'Assessment not found', 
            details: `No assessment configured for job "${job.title}"` 
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Parse request body
      const submissionData = await request.json() as { candidateId: number; responses: Record<string, string | string[] | number | null> };
      console.log('📝 POST /assessments/:jobId/submit - Received submission from candidate:', submissionData.candidateId);

      // Validate candidateId
      if (!submissionData.candidateId || typeof submissionData.candidateId !== 'number') {
        return new HttpResponse(
          JSON.stringify({ error: 'Invalid candidate ID', details: 'Candidate ID must be a positive integer' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if candidate exists
      const candidate = await db.candidates.get(submissionData.candidateId);
      if (!candidate) {
        console.log('❌ Candidate not found:', submissionData.candidateId);
        return new HttpResponse(
          JSON.stringify({ 
            error: 'Candidate not found', 
            details: `No candidate found with ID ${submissionData.candidateId}` 
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Validate candidate is applying for the correct job
      if (candidate.jobId !== jobId) {
        console.log('❌ Candidate job mismatch. Candidate job:', candidate.jobId, 'Assessment job:', jobId);
        return new HttpResponse(
          JSON.stringify({ 
            error: 'Job mismatch', 
            details: `Candidate ${candidate.name} is not applying for this job` 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Validate responses object
      if (!submissionData.responses || typeof submissionData.responses !== 'object') {
        return new HttpResponse(
          JSON.stringify({ error: 'Invalid responses', details: 'Responses must be an object' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Get all questions from assessment for validation
      const allQuestions = assessment.sections.flatMap(section => section.questions);
      const questionMap = new Map(allQuestions.map(q => [q.id, q]));

      // Validate each response
      const validationErrors: string[] = [];
      
      // Check required questions are answered
      allQuestions.forEach(question => {
        if (question.required) {
          const response = submissionData.responses[question.id];
          if (response === null || response === undefined || response === '') {
            validationErrors.push(`Question "${question.text}" is required but not answered`);
          }
        }
      });

      // Validate response types and constraints
      Object.entries(submissionData.responses).forEach(([questionId, response]) => {
        const question = questionMap.get(questionId);
        if (!question) {
          validationErrors.push(`Unknown question ID: ${questionId}`);
          return;
        }

        if (response === null || response === undefined) {
          return; // Skip validation for empty responses (already checked required above)
        }

        switch (question.type) {
          case 'single-choice':
            if (typeof response !== 'string') {
              validationErrors.push(`Question "${question.text}": Expected single choice (string)`);
            } else if (question.options && !question.options.includes(response)) {
              validationErrors.push(`Question "${question.text}": Invalid choice "${response}"`);
            }
            break;

          case 'multi-choice':
            if (!Array.isArray(response)) {
              validationErrors.push(`Question "${question.text}": Expected multiple choices (array)`);
            } else if (question.options) {
              const invalidChoices = response.filter(choice => !question.options!.includes(choice));
              if (invalidChoices.length > 0) {
                validationErrors.push(`Question "${question.text}": Invalid choices: ${invalidChoices.join(', ')}`);
              }
            }
            break;

          case 'short-text':
          case 'long-text':
            if (typeof response !== 'string') {
              validationErrors.push(`Question "${question.text}": Expected text (string)`);
            } else if (question.maxLength && response.length > question.maxLength) {
              validationErrors.push(`Question "${question.text}": Text too long (${response.length}/${question.maxLength} characters)`);
            }
            break;

          case 'numeric':
            if (typeof response !== 'number') {
              validationErrors.push(`Question "${question.text}": Expected number`);
            } else {
              if (question.min !== undefined && response < question.min) {
                validationErrors.push(`Question "${question.text}": Value ${response} is below minimum ${question.min}`);
              }
              if (question.max !== undefined && response > question.max) {
                validationErrors.push(`Question "${question.text}": Value ${response} exceeds maximum ${question.max}`);
              }
            }
            break;

          case 'file-upload':
            if (typeof response !== 'string') {
              validationErrors.push(`Question "${question.text}": Expected file path/URL (string)`);
            }
            break;
        }
      });

      if (validationErrors.length > 0) {
        return new HttpResponse(
          JSON.stringify({ 
            error: 'Validation failed', 
            details: validationErrors.join('; ') 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if candidate has already submitted for this job
      const existingResponse = await db.candidateResponses
        .where('[candidateId+jobId]')
        .equals([submissionData.candidateId, jobId])
        .first();

      if (existingResponse) {
        console.log('❌ Candidate has already submitted for this job');
        return new HttpResponse(
          JSON.stringify({ 
            error: 'Already submitted', 
            details: `Candidate ${candidate.name} has already submitted an assessment for this job` 
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Create candidate response record
      const candidateResponse: Omit<CandidateResponse, 'id'> = {
        candidateId: submissionData.candidateId,
        jobId,
        responses: submissionData.responses,
        submittedAt: Date.now()
      };

      // Store in database
      const id = await db.candidateResponses.add(candidateResponse as CandidateResponse);
      const savedResponse = { ...candidateResponse, id };

      console.log('✅ Assessment response saved successfully for candidate:', candidate.name);

      const response = {
        data: savedResponse,
        message: `Assessment submitted successfully for ${candidate.name}`
      };

      return HttpResponse.json(response);
    } catch (error) {
      console.error('❌ Error in POST /assessments/:jobId/submit:', error);
      return new HttpResponse(
        JSON.stringify({ error: 'Database error', details: error instanceof Error ? error.message : 'Unknown error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }),
];