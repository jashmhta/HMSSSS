export enum UserRole {
  SUPERADMIN = "SUPERADMIN",
  ADMIN = "ADMIN",
  DOCTOR = "DOCTOR",
  NURSE = "NURSE",
  RECEPTIONIST = "RECEPTIONIST",
  LAB_TECHNICIAN = "LAB_TECHNICIAN",
  PHARMACIST = "PHARMACIST",
  PATIENT = "PATIENT",
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}
