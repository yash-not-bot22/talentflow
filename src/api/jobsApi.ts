import type { Job } from '../db';
import type { JobsFilters, JobsPagination } from '../store/jobsStore';

// API Response types
export interface JobsApiResponse {
  data: Job[];
  pagination: JobsPagination;
}

export interface ApiError {
  error: string;
}

// Request types
export interface CreateJobRequest {
  title: string;
  status?: 'active' | 'archived';
  tags?: string[];
}

export interface UpdateJobRequest {
  title?: string;
  status?: 'active' | 'archived';
  tags?: string[];
}

export interface ReorderJobRequest {
  fromOrder: number;
  toOrder: number;
}

// Base API client
class ApiClient {
  private baseUrl = '/api';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    
    return this.request<T>(url, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient();

// Jobs API functions
export const jobsApi = {
  // GET /jobs?search=&status=&page=&pageSize=&sort=
  getJobs: async (filters: JobsFilters, pagination: { page: number; pageSize: number }): Promise<JobsApiResponse> => {
    const params: Record<string, string> = {
      page: pagination.page.toString(),
      pageSize: pagination.pageSize.toString(),
    };

    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.sort) params.sort = filters.sort;

    return apiClient.get<JobsApiResponse>('/jobs', params);
  },

  // POST /jobs
  createJob: async (jobData: CreateJobRequest): Promise<Job> => {
    return apiClient.post<Job>('/jobs', jobData);
  },

  // PATCH /jobs/:id
  updateJob: async (jobId: number, updates: UpdateJobRequest): Promise<Job> => {
    return apiClient.patch<Job>(`/jobs/${jobId}`, updates);
  },

  // PATCH /jobs/:id/reorder
  reorderJob: async (jobId: number, reorderData: ReorderJobRequest): Promise<Job> => {
    return apiClient.patch<Job>(`/jobs/${jobId}/reorder`, reorderData);
  },

  // GET /jobs/:id (for getting single job details if needed)
  getJob: async (jobId: number): Promise<Job> => {
    return apiClient.get<Job>(`/jobs/${jobId}`);
  },
};

export default apiClient;