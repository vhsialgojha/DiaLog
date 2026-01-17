
import { HealthLog, LogType, Reminder, Doctor, User, UserRole, ProcessingPurpose } from '../types';

const STORAGE_KEY = 'dialog_health_logs';
const REMINDER_KEY = 'dialog_reminders';
const DOCTORS_KEY = 'dialog_doctors';
const USER_KEY = 'dialog_current_user';
const ALL_USERS_KEY = 'dialog_known_users';

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

export const getUserByPhone = (phone: string): User | null => {
  const data = localStorage.getItem(ALL_USERS_KEY);
  if (!data) return null;
  try {
    const users: User[] = JSON.parse(data);
    return users.find(u => u.phone === phone) || null;
  } catch (e) {
    return null;
  }
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    const allUsersData = localStorage.getItem(ALL_USERS_KEY);
    let allUsers: User[] = allUsersData ? JSON.parse(allUsersData) : [];
    const index = allUsers.findIndex(u => u.id === user.id || u.phone === user.phone);
    
    if (index > -1) {
      allUsers[index] = user;
    } else {
      allUsers.push(user);
    }
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(allUsers));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

export const getLogs = (): HealthLog[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return getMockData();
  try {
    return JSON.parse(data);
  } catch (e) {
    return getMockData();
  }
};

export const saveLog = (log: Omit<HealthLog, 'id' | 'timestamp'>): HealthLog => {
  const logs = getLogs();
  const currentUser = getCurrentUser();
  
  // Determine processing purposes for the log
  const purposes: ProcessingPurpose[] = [ProcessingPurpose.HEALTH_MONITORING];
  if (log.type === LogType.MEDICINE || log.type === LogType.INSULIN) {
    purposes.push(ProcessingPurpose.ADHERENCE_TRACKING);
  }
  if (currentUser?.consents?.aiAnalysis) {
    purposes.push(ProcessingPurpose.AI_INSIGHTS);
  }

  const newLog: HealthLog = {
    ...log,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    metadata: {
      source: log.metadata?.source || 'MANUAL_ENTRY',
      consentVersion: currentUser?.consents?.version || 'v1.0-DPDP',
      purpose: purposes
    }
  };
  const updated = [newLog, ...logs];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newLog;
};

export const getReminders = (): Reminder[] => {
  const data = localStorage.getItem(REMINDER_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const saveReminder = (reminder: Omit<Reminder, 'id' | 'completed'>): Reminder => {
  const reminders = getReminders();
  const newReminder: Reminder = {
    ...reminder,
    id: Math.random().toString(36).substr(2, 9),
    completed: false,
  };
  const updated = [...reminders, newReminder].sort((a, b) => a.time.localeCompare(b.time));
  localStorage.setItem(REMINDER_KEY, JSON.stringify(updated));
  return newReminder;
};

export const toggleReminder = (id: string): void => {
  const reminders = getReminders();
  const updated = reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r);
  localStorage.setItem(REMINDER_KEY, JSON.stringify(updated));
};

export const deleteReminder = (id: string): void => {
  const reminders = getReminders();
  const updated = reminders.filter(r => r.id !== id);
  localStorage.setItem(REMINDER_KEY, JSON.stringify(updated));
};

export const getDoctors = (): Doctor[] => {
  const data = localStorage.getItem(DOCTORS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const saveDoctor = (doctor: Omit<Doctor, 'id' | 'accessGranted'>): Doctor => {
  const doctors = getDoctors();
  const newDoctor: Doctor = {
    ...doctor,
    id: Math.random().toString(36).substr(2, 9),
    accessGranted: true,
  };
  const updated = [...doctors, newDoctor];
  localStorage.setItem(DOCTORS_KEY, JSON.stringify(updated));
  return newDoctor;
};

export const updateDoctorAccess = (id: string, access: boolean): void => {
  const doctors = getDoctors();
  const updated = doctors.map(d => d.id === id ? { ...d, accessGranted: access } : d);
  localStorage.setItem(DOCTORS_KEY, JSON.stringify(updated));
};

export const deleteDoctor = (id: string): void => {
  const doctors = getDoctors();
  const updated = doctors.filter(d => d.id !== id);
  localStorage.setItem(DOCTORS_KEY, JSON.stringify(updated));
};

export const updateLastShared = (id: string): void => {
  const doctors = getDoctors();
  const updated = doctors.map(d => d.id === id ? { ...d, lastShared: Date.now() } : d);
  localStorage.setItem(DOCTORS_KEY, JSON.stringify(updated));
};

const getMockData = (): HealthLog[] => {
  const now = Date.now();
  return [
    { id: '1', timestamp: now - 3600000 * 2, type: LogType.GLUCOSE, value: 110, unit: 'mg/dL', notes: 'Pre-lunch', metadata: { source: 'SYSTEM', consentVersion: 'v1.0-DPDP', purpose: [ProcessingPurpose.HEALTH_MONITORING] } },
    { id: '2', timestamp: now - 3600000 * 1.5, type: LogType.MEAL, value: 45, unit: 'g', notes: 'Turkey Sandwich', metadata: { source: 'SYSTEM', consentVersion: 'v1.0-DPDP', purpose: [ProcessingPurpose.HEALTH_MONITORING] } },
    { id: '3', timestamp: now - 3600000 * 1, type: LogType.INSULIN, value: 4, unit: 'U', notes: 'Rapid acting', metadata: { source: 'SYSTEM', consentVersion: 'v1.0-DPDP', purpose: [ProcessingPurpose.HEALTH_MONITORING, ProcessingPurpose.ADHERENCE_TRACKING] } },
    { id: '4', timestamp: now - 3600000 * 0.5, type: LogType.GLUCOSE, value: 145, unit: 'mg/dL', notes: 'Post-lunch check', metadata: { source: 'SYSTEM', consentVersion: 'v1.0-DPDP', purpose: [ProcessingPurpose.HEALTH_MONITORING] } },
  ];
};
