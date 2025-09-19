import type { Candidate } from '../db';

// API Response types
export interface CandidatesResponse {
  data: Candidate[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  filters: {
    search: string;
    stage: string;
  };
}

export interface CandidateTimelineEntry {
  type: 'stage_change' | 'note';
  timestamp: number;
  stage?: Candidate['stage'];
  text?: string;
}

export interface CandidateTimelineResponse {
  candidateId: number;
  candidate: {
    id: number;
    name: string;
    email: string;
    currentStage: Candidate['stage'];
  };
  timeline: CandidateTimelineEntry[];
}

// Request types
export interface CreateCandidateRequest {
  name: string;
  email: string;
  jobId: number;
  stage?: Candidate['stage'];
}

export interface UpdateCandidateRequest {
  stage?: Candidate['stage'];
  notes?: string;
}

export interface CandidatesFilters {
  search?: string;
  stage?: Candidate['stage'] | '';
  page?: number;
  pageSize?: number;
}

// API Client
class CandidatesApi {
  private baseUrl = '/api';

  async getCandidates(filters: CandidatesFilters = {}): Promise<CandidatesResponse> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.stage) params.append('stage', filters.stage);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

    const url = `${this.baseUrl}/candidates?${params.toString()}`;
    console.log('🌐 API Call: GET', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async createCandidate(candidateData: CreateCandidateRequest): Promise<Candidate> {
    const url = `${this.baseUrl}/candidates`;
    console.log('🌐 API Call: POST', url, candidateData);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(candidateData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async updateCandidate(candidateId: number, updates: UpdateCandidateRequest): Promise<Candidate> {
    const url = `${this.baseUrl}/candidates/${candidateId}`;
    console.log('🌐 API Call: PATCH', url, updates);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getCandidateTimeline(candidateId: number): Promise<CandidateTimelineResponse> {
    const url = `${this.baseUrl}/candidates/${candidateId}/timeline`;
    console.log('🌐 API Call: GET', url);

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Helper method to move candidate to next stage
  async moveToNextStage(candidateId: number): Promise<Candidate> {
    // First get current candidate to determine next stage
    const candidates = await this.getCandidates();
    const candidate = candidates.data.find(c => c.id === candidateId);
    
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    const stageProgression: Record<Candidate['stage'], Candidate['stage'] | null> = {
      'applied': 'screen',
      'screen': 'tech',
      'tech': 'offer',
      'offer': 'hired',
      'hired': null,
      'rejected': null
    };

    const nextStage = stageProgression[candidate.stage];
    if (!nextStage) {
      throw new Error(`Cannot advance from stage: ${candidate.stage}`);
    }

    return this.updateCandidate(candidateId, { stage: nextStage });
  }

  // Helper method to reject candidate
  async rejectCandidate(candidateId: number, reason?: string): Promise<Candidate> {
    const updates: UpdateCandidateRequest = { stage: 'rejected' };
    if (reason) {
      updates.notes = `Rejected: ${reason}`;
    }
    return this.updateCandidate(candidateId, updates);
  }
}

// Export singleton instance
export const candidatesApi = new CandidatesApi();