import { db, type Assessment, type Section, type Question } from '../db';

/**
 * Local IndexedDB-based Assessments API
 * Provides persistent storage using Dexie/IndexedDB
 */
export class LocalAssessmentsApi {
  /**
   * Get assessment for a specific job
   */
  async getAssessment(jobId: number): Promise<Assessment> {
    try {
      const assessment = await db.assessments.get(jobId);
      if (!assessment) {
        throw new Error(`Assessment for job ${jobId} not found`);
      }
      return assessment;
    } catch (error) {
      console.error('Error fetching assessment from IndexedDB:', error);
      throw new Error('Failed to fetch assessment from local storage');
    }
  }

  /**
   * Create or update assessment for a specific job
   */
  async updateAssessment(jobId: number, assessmentData: Omit<Assessment, 'jobId' | 'updatedAt'>): Promise<Assessment> {
    try {
      const assessment: Assessment = {
        jobId,
        sections: assessmentData.sections,
        updatedAt: Date.now(),
      };

      await db.assessments.put(assessment);
      return assessment;
    } catch (error) {
      console.error('Error updating assessment in IndexedDB:', error);
      throw new Error('Failed to update assessment in local storage');
    }
  }

  /**
   * Delete assessment for a specific job
   */
  async deleteAssessment(jobId: number): Promise<void> {
    try {
      await db.assessments.delete(jobId);
    } catch (error) {
      console.error('Error deleting assessment from IndexedDB:', error);
      throw new Error('Failed to delete assessment from local storage');
    }
  }

  /**
   * Submit candidate response to an assessment
   */
  async submitResponse(jobId: number, submissionData: {
    candidateId: number;
    responses: Record<string, string | string[] | number | null>;
  }): Promise<{ id: number; candidateId: number; jobId: number; responses: Record<string, string | string[] | number | null>; submittedAt: number }> {
    try {
      const candidateResponse = {
        candidateId: submissionData.candidateId,
        jobId,
        responses: submissionData.responses,
        submittedAt: Date.now(),
      };

      const id = await db.candidateResponses.add(candidateResponse as any);
      return { ...candidateResponse, id: id as number };
    } catch (error) {
      console.error('Error submitting response to IndexedDB:', error);
      throw new Error('Failed to submit response to local storage');
    }
  }

  /**
   * Get all assessments
   */
  async getAllAssessments(): Promise<Assessment[]> {
    try {
      return await db.assessments.toArray();
    } catch (error) {
      console.error('Error fetching all assessments from IndexedDB:', error);
      throw new Error('Failed to fetch assessments from local storage');
    }
  }

  /**
   * Get responses for a specific assessment
   */
  async getAssessmentResponses(jobId: number): Promise<any[]> {
    try {
      return await db.candidateResponses
        .where('jobId')
        .equals(jobId)
        .toArray();
    } catch (error) {
      console.error('Error fetching assessment responses from IndexedDB:', error);
      throw new Error('Failed to fetch assessment responses from local storage');
    }
  }

  /**
   * Create a new section for an assessment
   */
  async addSection(jobId: number, sectionName: string): Promise<Section> {
    try {
      const assessment = await this.getAssessment(jobId);
      
      const newSection: Section = {
        id: crypto.randomUUID(),
        name: sectionName,
        questions: [],
      };

      const updatedAssessment = {
        ...assessment,
        sections: [...assessment.sections, newSection],
        updatedAt: Date.now(),
      };

      await db.assessments.put(updatedAssessment);
      return newSection;
    } catch (error) {
      console.error('Error adding section to assessment in IndexedDB:', error);
      throw new Error('Failed to add section to assessment in local storage');
    }
  }

  /**
   * Update a section in an assessment
   */
  async updateSection(jobId: number, sectionId: string, updates: Partial<Section>): Promise<Assessment> {
    try {
      const assessment = await this.getAssessment(jobId);
      
      const updatedSections = assessment.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      );

      const updatedAssessment = {
        ...assessment,
        sections: updatedSections,
        updatedAt: Date.now(),
      };

      await db.assessments.put(updatedAssessment);
      return updatedAssessment;
    } catch (error) {
      console.error('Error updating section in assessment in IndexedDB:', error);
      throw new Error('Failed to update section in assessment in local storage');
    }
  }

  /**
   * Delete a section from an assessment
   */
  async deleteSection(jobId: number, sectionId: string): Promise<Assessment> {
    try {
      const assessment = await this.getAssessment(jobId);
      
      const updatedSections = assessment.sections.filter(section => section.id !== sectionId);

      const updatedAssessment = {
        ...assessment,
        sections: updatedSections,
        updatedAt: Date.now(),
      };

      await db.assessments.put(updatedAssessment);
      return updatedAssessment;
    } catch (error) {
      console.error('Error deleting section from assessment in IndexedDB:', error);
      throw new Error('Failed to delete section from assessment in local storage');
    }
  }

  /**
   * Add a question to a specific section
   */
  async addQuestion(jobId: number, sectionId: string, question: Omit<Question, 'id'>): Promise<Question> {
    try {
      const assessment = await this.getAssessment(jobId);
      
      const newQuestion: Question = {
        ...question,
        id: crypto.randomUUID(),
      };

      const updatedSections = assessment.sections.map(section =>
        section.id === sectionId
          ? { ...section, questions: [...section.questions, newQuestion] }
          : section
      );

      const updatedAssessment = {
        ...assessment,
        sections: updatedSections,
        updatedAt: Date.now(),
      };

      await db.assessments.put(updatedAssessment);
      return newQuestion;
    } catch (error) {
      console.error('Error adding question to assessment in IndexedDB:', error);
      throw new Error('Failed to add question to assessment in local storage');
    }
  }

  /**
   * Update a question in a specific section
   */
  async updateQuestion(jobId: number, sectionId: string, questionId: string, updates: Partial<Question>): Promise<Assessment> {
    try {
      const assessment = await this.getAssessment(jobId);
      
      const updatedSections = assessment.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map(question =>
                question.id === questionId ? { ...question, ...updates } : question
              ),
            }
          : section
      );

      const updatedAssessment = {
        ...assessment,
        sections: updatedSections,
        updatedAt: Date.now(),
      };

      await db.assessments.put(updatedAssessment);
      return updatedAssessment;
    } catch (error) {
      console.error('Error updating question in assessment in IndexedDB:', error);
      throw new Error('Failed to update question in assessment in local storage');
    }
  }

  /**
   * Delete a question from a specific section
   */
  async deleteQuestion(jobId: number, sectionId: string, questionId: string): Promise<Assessment> {
    try {
      const assessment = await this.getAssessment(jobId);
      
      const updatedSections = assessment.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.filter(question => question.id !== questionId),
            }
          : section
      );

      const updatedAssessment = {
        ...assessment,
        sections: updatedSections,
        updatedAt: Date.now(),
      };

      await db.assessments.put(updatedAssessment);
      return updatedAssessment;
    } catch (error) {
      console.error('Error deleting question from assessment in IndexedDB:', error);
      throw new Error('Failed to delete question from assessment in local storage');
    }
  }

  /**
   * Check if local storage is available and working
   */
  async isAvailable(): Promise<boolean> {
    try {
      await db.assessments.count();
      return true;
    } catch (error) {
      console.error('Local storage not available:', error);
      return false;
    }
  }

  /**
   * Clear all local assessment data
   */
  async clearAllAssessments(): Promise<void> {
    try {
      await db.assessments.clear();
      await db.candidateResponses.clear();
    } catch (error) {
      console.error('Error clearing assessments from IndexedDB:', error);
      throw new Error('Failed to clear assessments from local storage');
    }
  }
}

export const localAssessmentsApi = new LocalAssessmentsApi();