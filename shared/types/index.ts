export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ApplicationStatus {
  SAVED = 'saved',
  APPLIED = 'applied',
  INTERVIEWING = 'interviewing',
  REJECTED = 'rejected',
  OFFER = 'offer',
  ACCEPTED = 'accepted'
}

export enum InterviewType {
  PHONE = 'phone',
  VIDEO = 'video',
  ONSITE = 'onsite',
  TECHNICAL = 'technical'
}

export interface JobApplication {
  id: string;
  userId: string;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  url: string;
  status: ApplicationStatus;
  dateAdded: Date;
  dateApplied?: Date;
  notes?: string;
  resumeVersion?: string;
  coverLetterUsed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Interview {
  id: string;
  jobApplicationId: string;
  date: Date;
  type: InterviewType;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface JobStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  responseRate: number;
  averageTimeToResponse: number;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface CreateJobRequest {
  title: string;
  company: string;
  location?: string;
  salary?: string;
  url: string;
  status?: ApplicationStatus;
  notes?: string;
}

export interface UpdateJobRequest {
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  url?: string;
  status?: ApplicationStatus;
  dateApplied?: Date;
  notes?: string;
  resumeVersion?: string;
  coverLetterUsed?: boolean;
}

export interface CreateInterviewRequest {
  date: Date;
  type: InterviewType;
  notes?: string;
}