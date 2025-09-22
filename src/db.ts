import Dexie, { type Table } from 'dexie';

// Define interfaces for type safety
export interface Job {
  id: number; // Auto-increment
  title: string; // e.g., "Frontend Engineer"
  slug: string; // Unique, generated from title (e.g., "frontend-engineer-1")
  status: 'active' | 'archived';
  tags: string[]; // e.g., ['remote', 'senior']
  order: number; // For drag-and-drop reordering (1 to 25 initially)
  salary?: string; // e.g., "$80,000 - $120,000" or "Competitive"
  location?: string; // e.g., "San Francisco, CA" or "Remote"
  department?: string; // e.g., "Engineering", "Product", "Marketing"
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship'; // Employment type
  createdAt: number; // Date.now()
  updatedAt: number; // Date.now() on update
}

export interface Candidate {
  id: number; // Auto-increment
  name: string; // e.g., "John Doe"
  email: string; // e.g., "john.doe@example.com"
  jobId: number; // Foreign key to jobs.id
  stage: 'applied' | 'screen' | 'tech' | 'offer' | 'hired' | 'rejected';
  history: { stage: Candidate['stage']; timestamp: number }[]; // Timeline of stage changes
  notes: { text: string; timestamp: number }[]; // Notes with @mentions
  createdAt: number;
}

export type QuestionType = 'single-choice' | 'multi-choice' | 'short-text' | 'long-text' | 'numeric' | 'file-upload';

export interface Question {
  id: string; // UUID (crypto.randomUUID())
  type: QuestionType;
  text: string; // e.g., "What is React?"
  options?: string[]; // For choice types, e.g., ["Class", "Function", "Both"]
  required?: boolean; // Default false
  maxLength?: number; // For short/long-text (e.g., 100 or 1000)
  min?: number; // For numeric
  max?: number; // For numeric
  conditional?: boolean; // If true, this question can have sub-questions
  subQuestions?: Question[]; // Sub-questions that appear when this question is answered
  dependsOn?: { questionId: string; value: string | number | string[] }; // Conditional logic
}

export interface Section {
  id: string; // UUID
  name: string; // e.g., "Technical Skills"
  questions: Question[];
}

export interface Assessment {
  jobId: number; // Primary key, foreign to jobs.id (only 1-3 seeded)
  sections: Section[]; // 2-3 sections, total 10+ questions
  updatedAt: number;
}

export interface CandidateResponse {
  id: number; // Auto-increment
  candidateId: number; // Foreign to candidates.id
  jobId: number; // Foreign to jobs.id
  responses: Record<string, string | string[] | number | null>; // questionId -> answer
  submittedAt: number;
}

// Dexie setup
export class TalentFlowDB extends Dexie {
  jobs!: Table<Job>;
  candidates!: Table<Candidate>;
  assessments!: Table<Assessment>;
  candidateResponses!: Table<CandidateResponse>;

  constructor() {
    super('TalentFlowDB');
    this.version(1).stores({
      jobs: '++id, &slug, status, order', // &slug for unique
      candidates: '++id, jobId, stage, email, createdAt, [jobId+stage]', // Added email and createdAt indexes
      assessments: 'jobId', // 1:1 with job
      candidateResponses: '++id, [candidateId+jobId]', // Unique per candidate-job
    });
    
    // Version 2: Add jobId index to candidateResponses
    this.version(2).stores({
      jobs: '++id, &slug, status, order', // &slug for unique
      candidates: '++id, jobId, stage, email, createdAt, [jobId+stage]', // Added email and createdAt indexes
      assessments: 'jobId', // 1:1 with job
      candidateResponses: '++id, jobId, candidateId, [candidateId+jobId]', // Added jobId index
    });
  }
}

export const db = new TalentFlowDB();