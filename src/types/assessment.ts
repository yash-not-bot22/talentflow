// Assessment types and interfaces

export type QuestionType = 
  | 'single-choice' 
  | 'multi-choice' 
  | 'short-text' 
  | 'long-text' 
  | 'numeric' 
  | 'file-upload';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  customMessage?: string;
}

export interface ConditionalRule {
  dependsOnQuestion: string; // Question ID
  condition: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than';
  value: string | number | string[];
}

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[]; // For choice questions
  validation?: ValidationRule;
  conditional?: ConditionalRule;
  placeholder?: string;
  order: number;
}

export interface AssessmentSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  order: number;
}

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  jobId: string; // One-to-one mapping with jobs
  sections: AssessmentSection[];
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
  timeLimit?: number; // in minutes
  instructions?: string;
}

export interface QuestionResponse {
  questionId: string;
  value: string | string[] | number | File;
  completedAt: number;
}

export interface AssessmentResponse {
  id: string;
  assessmentId: string;
  candidateId: string;
  responses: QuestionResponse[];
  startedAt: number;
  completedAt?: number;
  isSubmitted: boolean;
  currentSection?: string;
  currentQuestion?: string;
}

export interface AssessmentBuilder {
  assessment: Assessment;
  currentSection?: string;
  currentQuestion?: string;
  previewMode: boolean;
  isDirty: boolean;
}

export interface FormValidationError {
  questionId: string;
  message: string;
}

export interface AssessmentFormState {
  responses: Record<string, QuestionResponse>;
  errors: FormValidationError[];
  currentSection: number;
  isValid: boolean;
}