import type { Assessment, CandidateResponse } from '../db';

export interface AssessmentResponse {
  data: Assessment;
}

export interface SubmissionData {
  candidateId: number;
  responses: Record<string, string | string[] | number | null>;
}

export interface SubmissionResponse {
  data: CandidateResponse;
  message: string;
}

export interface AssessmentApiError {
  error: string;
  details?: string;
}

class AssessmentsApiClient {
  private baseUrl = '/api/assessments';

  /**
   * Get assessment for a specific job
   * GET /assessments/:jobId
   */
  async getAssessment(jobId: number): Promise<Assessment> {
    const response = await fetch(`${this.baseUrl}/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: AssessmentApiError = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch assessment`);
    }

    const result: AssessmentResponse = await response.json();
    return result.data;
  }

  /**
   * Update/create assessment for a specific job
   * PUT /assessments/:jobId
   */
  async updateAssessment(jobId: number, assessment: Omit<Assessment, 'jobId' | 'updatedAt'>): Promise<Assessment> {
    const response = await fetch(`${this.baseUrl}/${jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assessment),
    });

    if (!response.ok) {
      const errorData: AssessmentApiError = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to update assessment`);
    }

    const result: AssessmentResponse = await response.json();
    return result.data;
  }

  /**
   * Submit assessment responses as a candidate
   * POST /assessments/:jobId/submit
   */
  async submitResponse(jobId: number, submissionData: SubmissionData): Promise<CandidateResponse> {
    const response = await fetch(`${this.baseUrl}/${jobId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData),
    });

    if (!response.ok) {
      const errorData: AssessmentApiError = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to submit assessment`);
    }

    const result: SubmissionResponse = await response.json();
    return result.data;
  }

  /**
   * Helper method to validate assessment structure
   */
  validateAssessment(assessment: Omit<Assessment, 'jobId' | 'updatedAt'>): string[] {
    const errors: string[] = [];

    if (!assessment.sections || !Array.isArray(assessment.sections)) {
      errors.push('Assessment must have sections array');
      return errors;
    }

    if (assessment.sections.length === 0) {
      errors.push('Assessment must have at least one section');
    }

    assessment.sections.forEach((section, sectionIndex) => {
      if (!section.id || typeof section.id !== 'string') {
        errors.push(`Section ${sectionIndex + 1}: Must have a valid ID`);
      }

      if (!section.name || typeof section.name !== 'string') {
        errors.push(`Section ${sectionIndex + 1}: Must have a name`);
      }

      if (!section.questions || !Array.isArray(section.questions)) {
        errors.push(`Section ${sectionIndex + 1}: Must have questions array`);
        return;
      }

      if (section.questions.length === 0) {
        errors.push(`Section ${sectionIndex + 1}: Must have at least one question`);
      }

      section.questions.forEach((question, questionIndex) => {
        if (!question.id || typeof question.id !== 'string') {
          errors.push(`Section ${sectionIndex + 1}, Question ${questionIndex + 1}: Must have a valid ID`);
        }

        if (!question.text || typeof question.text !== 'string') {
          errors.push(`Section ${sectionIndex + 1}, Question ${questionIndex + 1}: Must have question text`);
        }

        if (!question.type || !['single-choice', 'multi-choice', 'short-text', 'long-text', 'numeric', 'file-upload'].includes(question.type)) {
          errors.push(`Section ${sectionIndex + 1}, Question ${questionIndex + 1}: Must have a valid type`);
        }

        // Validate choice questions have options
        if (['single-choice', 'multi-choice'].includes(question.type)) {
          if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
            errors.push(`Section ${sectionIndex + 1}, Question ${questionIndex + 1}: Choice questions must have at least 2 options`);
          }
        }

        // Validate numeric questions have valid min/max
        if (question.type === 'numeric') {
          if (question.min !== undefined && question.max !== undefined && question.min >= question.max) {
            errors.push(`Section ${sectionIndex + 1}, Question ${questionIndex + 1}: Min value must be less than max value`);
          }
        }

        // Validate text questions have reasonable maxLength
        if (['short-text', 'long-text'].includes(question.type) && question.maxLength !== undefined) {
          if (question.maxLength <= 0) {
            errors.push(`Section ${sectionIndex + 1}, Question ${questionIndex + 1}: Max length must be positive`);
          }
          if (question.type === 'short-text' && question.maxLength > 500) {
            errors.push(`Section ${sectionIndex + 1}, Question ${questionIndex + 1}: Short text max length should be ≤ 500 characters`);
          }
        }
      });
    });

    return errors;
  }

  /**
   * Helper method to validate submission responses
   */
  validateSubmission(assessment: Assessment, responses: Record<string, string | string[] | number | null>): string[] {
    const errors: string[] = [];

    // Get all questions from all sections
    const allQuestions = assessment.sections.flatMap(section => section.questions);

    // Check required questions are answered
    allQuestions.forEach(question => {
      if (question.required) {
        const response = responses[question.id];
        if (response === null || response === undefined || response === '') {
          errors.push(`Question "${question.text}" is required but not answered`);
        }
      }
    });

    // Validate response types and constraints
    Object.entries(responses).forEach(([questionId, response]) => {
      const question = allQuestions.find(q => q.id === questionId);
      if (!question) {
        errors.push(`Unknown question ID: ${questionId}`);
        return;
      }

      if (response === null || response === undefined) {
        return; // Skip validation for empty responses (already checked required above)
      }

      switch (question.type) {
        case 'single-choice':
          if (typeof response !== 'string') {
            errors.push(`Question "${question.text}": Expected single choice (string)`);
          } else if (question.options && !question.options.includes(response)) {
            errors.push(`Question "${question.text}": Invalid choice "${response}"`);
          }
          break;

        case 'multi-choice':
          if (!Array.isArray(response)) {
            errors.push(`Question "${question.text}": Expected multiple choices (array)`);
          } else if (question.options) {
            const invalidChoices = response.filter(choice => !question.options!.includes(choice));
            if (invalidChoices.length > 0) {
              errors.push(`Question "${question.text}": Invalid choices: ${invalidChoices.join(', ')}`);
            }
          }
          break;

        case 'short-text':
        case 'long-text':
          if (typeof response !== 'string') {
            errors.push(`Question "${question.text}": Expected text (string)`);
          } else if (question.maxLength && response.length > question.maxLength) {
            errors.push(`Question "${question.text}": Text too long (${response.length}/${question.maxLength} characters)`);
          }
          break;

        case 'numeric':
          if (typeof response !== 'number') {
            errors.push(`Question "${question.text}": Expected number`);
          } else {
            if (question.min !== undefined && response < question.min) {
              errors.push(`Question "${question.text}": Value ${response} is below minimum ${question.min}`);
            }
            if (question.max !== undefined && response > question.max) {
              errors.push(`Question "${question.text}": Value ${response} exceeds maximum ${question.max}`);
            }
          }
          break;

        case 'file-upload':
          if (typeof response !== 'string') {
            errors.push(`Question "${question.text}": Expected file path/URL (string)`);
          }
          break;
      }
    });

    return errors;
  }
}

export const assessmentsApi = new AssessmentsApiClient();