import {
  JobApplication,
  CreateJobRequest,
  UpdateJobRequest,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  JobStats,
  Interview,
  CreateInterviewRequest,
} from '../../../shared/types';

const API_URL = (typeof window !== 'undefined' && (window as any).__API_URL__) || 'https://job-tracker-extension.onrender.com/api';
class ApiClient {
  private token: string | null = null;

  async setToken(token: string): Promise<void> {
    this.token = token;
    await chrome.storage.local.set({ authToken: token });
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      const result = await chrome.storage.local.get('authToken');
      this.token = result.authToken || null;
    }
    return this.token;
  }

  async clearToken(): Promise<void> {
    this.token = null;
    await chrome.storage.local.remove('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'Request failed');
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

// Auth
async register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await this.request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  await this.setToken(response.token);
  return response;
}

async login(data: LoginRequest): Promise<AuthResponse> {
  const response = await this.request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  await this.setToken(response.token);
  return response;
}
  async logout(): Promise<void> {
    await this.clearToken();
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Jobs
  async getJobs(params?: { status?: string; limit?: number; offset?: number }): Promise<JobApplication[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request<JobApplication[]>(`/jobs${query ? `?${query}` : ''}`);
  }

  async getJobById(id: string): Promise<JobApplication> {
    return this.request<JobApplication>(`/jobs/${id}`);
  }

  async createJob(data: CreateJobRequest): Promise<JobApplication> {
    return this.request<JobApplication>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateJob(id: string, data: UpdateJobRequest): Promise<JobApplication> {
    return this.request<JobApplication>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteJob(id: string): Promise<void> {
    return this.request<void>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  async getJobStats(): Promise<JobStats> {
    return this.request<JobStats>('/jobs/stats');
  }

  // Interviews
  async getInterviews(jobId: string): Promise<Interview[]> {
    return this.request<Interview[]>(`/jobs/${jobId}/interviews`);
  }

  async createInterview(jobId: string, data: CreateInterviewRequest): Promise<Interview> {
    return this.request<Interview>(`/jobs/${jobId}/interviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInterview(
    jobId: string,
    interviewId: string,
    data: Partial<CreateInterviewRequest>
  ): Promise<Interview> {
    return this.request<Interview>(`/jobs/${jobId}/interviews/${interviewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInterview(jobId: string, interviewId: string): Promise<void> {
    return this.request<void>(`/jobs/${jobId}/interviews/${interviewId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();