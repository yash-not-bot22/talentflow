import type { Job, Candidate, Assessment, Question } from '../db';

/**
 * Validation functions for forms
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateJob(job: Partial<Job>): ValidationResult {
  const errors: string[] = [];

  if (!job.title || job.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (job.title && job.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }

  if (job.tags && job.tags.length > 10) {
    errors.push('Maximum 10 tags allowed');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateCandidate(candidate: Partial<Candidate>): ValidationResult {
  const errors: string[] = [];

  if (!candidate.name || candidate.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!candidate.email || candidate.email.trim().length === 0) {
    errors.push('Email is required');
  }

  if (candidate.email && !isValidEmail(candidate.email)) {
    errors.push('Invalid email format');
  }

  if (!candidate.jobId) {
    errors.push('Job assignment is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateQuestion(question: Partial<Question>): ValidationResult {
  const errors: string[] = [];

  if (!question.text || question.text.trim().length === 0) {
    errors.push('Question text is required');
  }

  if (!question.type) {
    errors.push('Question type is required');
  }

  if ((question.type === 'single-choice' || question.type === 'multi-choice') && 
      (!question.options || question.options.length < 2)) {
    errors.push('Choice questions must have at least 2 options');
  }

  if (question.type === 'numeric') {
    if (question.min !== undefined && question.max !== undefined && question.min >= question.max) {
      errors.push('Minimum value must be less than maximum value');
    }
  }

  if ((question.type === 'short-text' || question.type === 'long-text') && 
      question.maxLength !== undefined && question.maxLength <= 0) {
    errors.push('Maximum length must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateAssessment(assessment: Partial<Assessment>): ValidationResult {
  const errors: string[] = [];

  if (!assessment.jobId) {
    errors.push('Job ID is required');
  }

  if (!assessment.sections || assessment.sections.length === 0) {
    errors.push('At least one section is required');
  }

  if (assessment.sections) {
    assessment.sections.forEach((section, sectionIndex) => {
      if (!section.name || section.name.trim().length === 0) {
        errors.push(`Section ${sectionIndex + 1}: Name is required`);
      }

      if (!section.questions || section.questions.length === 0) {
        errors.push(`Section ${sectionIndex + 1}: At least one question is required`);
      }

      section.questions?.forEach((question, questionIndex) => {
        const questionValidation = validateQuestion(question);
        if (!questionValidation.isValid) {
          questionValidation.errors.forEach(error => {
            errors.push(`Section ${sectionIndex + 1}, Question ${questionIndex + 1}: ${error}`);
          });
        }
      });
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}