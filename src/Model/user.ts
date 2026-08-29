export interface User {
  id: number;
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'STUDENT';
  isActive: boolean;
  createdAt: Date;
}

export interface SafeUser {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
}

export interface StudentSummary {
  id: number;
  fullName: string;
  email: string;
  isActive: boolean;
}
