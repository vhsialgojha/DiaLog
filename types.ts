
export enum LogType {
  GLUCOSE = 'GLUCOSE',
  MEAL = 'MEAL',
  INSULIN = 'INSULIN',
  EXERCISE = 'EXERCISE',
  MOOD = 'MOOD',
  MEDICINE = 'MEDICINE'
}

export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  CAREGIVER = 'CAREGIVER',
  ADMIN = 'ADMIN'
}

export enum ProcessingPurpose {
  HEALTH_MONITORING = 'HEALTH_MONITORING',
  AI_INSIGHTS = 'AI_INSIGHTS',
  ADHERENCE_TRACKING = 'ADHERENCE_TRACKING',
  DOCTOR_REVIEW = 'DOCTOR_REVIEW'
}

export type AppLanguage = 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr';

export interface UserConsents {
  healthLogging: boolean;
  aiAnalysis: boolean;
  doctorSharing: boolean;
  timestamp: number;
  version: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email: string;
  role: UserRole;
  language: AppLanguage;
  specialization?: string;
  healthGoals?: string[];
  linkedPatientPhone?: string;
  profileImage?: string;
  consents?: UserConsents;
}

export interface HealthLog {
  id: string;
  timestamp: number;
  type: LogType;
  value: string | number;
  unit?: string;
  notes?: string;
  metadata?: {
    source: string;
    consentVersion: string;
    purpose: ProcessingPurpose[];
  };
}

export interface Reminder {
  id: string;
  time: string;
  label: string;
  type: 'INSULIN' | 'MEDICINE';
  completed: boolean;
  repeat: boolean;
}

export interface TranscriptionItem {
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization: string;
  accessGranted: boolean;
  lastShared?: number;
}
