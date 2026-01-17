
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { VoiceLogger } from './components/VoiceLogger';
import { ManualEntry } from './components/ManualEntry';
import { CalendarView } from './components/CalendarView';
import { DoctorsView } from './components/DoctorsView';
import { DoctorDashboard } from './components/DoctorDashboard';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Onboarding } from './components/Onboarding';
import { SettingsModal } from './components/SettingsModal';
import { InformationPortal } from './components/InformationPortal';
import { Auth } from './components/Auth';
import { HealthLog, Reminder, User, UserRole } from './types';
import { getLogs, saveLog, getReminders, toggleReminder, deleteReminder, getCurrentUser } from './services/dataService';
import { translations } from './translations';
import { 
  LayoutDashboard, 
  Mic, 
  PlusCircle, 
  Settings, 
  Activity,
  Calendar as CalendarIcon,
  Bell,
  Stethoscope,
  LogOut,
  Users,
  HeartHandshake,
  ShieldCheck
} from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'voice' | 'manual' | 'calendar' | 'doctors'>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [infoPortalPage, setInfoPortalPage] = useState<'privacy' | 'terms' | 'rights' | 'ai' | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    
    setLogs(getLogs());
    setReminders(getReminders());
    
    const hasOnboarded = localStorage.getItem('dialog_onboarded');
    if (!hasOnboarded && user?.role === UserRole.PATIENT) {
      setShowOnboarding(true);
    }
  }, []);

  const handleAddLog = (log: Omit<HealthLog, 'id' | 'timestamp'>) => {
    const newLog = saveLog(log);
    setLogs(prev => [newLog, ...prev]);
  };

  const handleRefreshData = () => {
    setLogs(getLogs());
    setReminders(getReminders());
  };

  const handleToggleReminder = (id: string) => {
    toggleReminder(id);
    setReminders(getReminders());
  };

  const handleDeleteReminder = (id: string) => {
    deleteReminder(id);
    setReminders(getReminders());
  };

  const completeOnboarding = () => {
    localStorage.setItem('dialog_onboarded', 'true');
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('dialog_current_user');
    window.location.reload();
  };

  if (!currentUser) {
    return <Auth onAuthComplete={setCurrentUser} />;
  }

  const t = translations[currentUser.language || 'en'];
  const isDoctor = currentUser.role === UserRole.DOCTOR;
  const isCaregiver = currentUser.role === UserRole.CAREGIVER;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-slate-900 shadow-2xl overflow-hidden md:my-4 md:rounded-3xl border border-slate-800 relative">
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {infoPortalPage && (
        <InformationPortal 
          initialPage={infoPortalPage} 
          language={currentUser.language} 
          onClose={() => setInfoPortalPage(null)} 
        />
      )}
      
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900 z-10">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl text-white shadow-lg ${
            isDoctor ? 'bg-emerald-600' : isCaregiver ? 'bg-amber-600' : isAdmin ? 'bg-blue-600' : 'bg-indigo-600'
          }`}>
            {isAdmin ? <ShieldCheck size={24} /> : isCaregiver ? <HeartHandshake size={24} /> : <Activity size={24} />}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100 leading-none">{t.appTitle}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
              {isAdmin ? 'Systems Command' : isDoctor ? 'Pro Portal' : isCaregiver ? 'Caregiver Hub' : 'Health Companion'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isDoctor && !isCaregiver && !isAdmin && (
            <div className="flex items-center gap-1 bg-slate-800 rounded-full px-3 py-1.5 border border-slate-700">
              <Bell size={14} className="text-indigo-400" />
              <span className="text-xs font-bold text-slate-300">{reminders.filter(r => !r.completed).length}</span>
            </div>
          )}
          <button onClick={() => setShowSettings(true)} className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
            <Settings size={20} />
          </button>
          <button onClick={handleLogout} title="Logout" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-400 font-bold border border-slate-700 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-6 pb-24 md:pb-6 custom-scrollbar">
        {isAdmin ? (
          <AdminDashboard admin={currentUser} />
        ) : isDoctor ? (
          <DoctorDashboard doctor={currentUser} />
        ) : isCaregiver ? (
          <CaregiverDashboard caregiver={currentUser} patientLogs={logs} />
        ) : (
          <div className="flex flex-col min-h-full">
            <div className="flex-1">
              {activeTab === 'dashboard' && <Dashboard logs={logs} reminders={reminders} onToggleReminder={handleToggleReminder} language={currentUser.language} />}
              {activeTab === 'voice' && <VoiceLogger onLogCreated={handleAddLog} onRefreshReminders={handleRefreshData} />}
              {activeTab === 'manual' && <ManualEntry onAddLog={handleAddLog} language={currentUser.language} />}
              {activeTab === 'calendar' && <CalendarView logs={logs} />}
              {activeTab === 'doctors' && <DoctorsView logs={logs} />}
            </div>
            
            {/* Contextual Footer Links */}
            <footer className="mt-12 py-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
              <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                <button onClick={() => setInfoPortalPage('privacy')} className="hover:text-indigo-400 transition-colors">{t.footerPrivacy}</button>
                <button onClick={() => setInfoPortalPage('rights')} className="hover:text-indigo-400 transition-colors">{t.footerRights}</button>
                <button onClick={() => setInfoPortalPage('ai')} className="hover:text-indigo-400 transition-colors">{t.footerAI}</button>
                <button onClick={() => setInfoPortalPage('terms')} className="hover:text-indigo-400 transition-colors">{t.footerTerms}</button>
              </div>
              <p className="opacity-40">© 2024 {t.appTitle} Health • India DPDP v1.0</p>
            </footer>
          </div>
        )}
      </main>

      {/* Navigation Bar (Patient Only) */}
      {!isDoctor && !isCaregiver && !isAdmin && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 px-6 py-3 flex justify-around items-center md:relative md:border-t-0 md:bg-slate-900 md:pb-8">
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={22} />} label={t.home} />
          <NavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<CalendarIcon size={22} />} label={t.log} />
          <div className="relative -top-6">
            <button onClick={() => setActiveTab('voice')} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${activeTab === 'voice' ? 'bg-indigo-500 text-white scale-110 ring-4 ring-indigo-500/20' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/40'}`}>
              <Mic size={28} />
            </button>
          </div>
          <NavButton active={activeTab === 'doctors'} onClick={() => setActiveTab('doctors')} icon={<Stethoscope size={22} />} label={t.doctors} />
          <NavButton active={activeTab === 'manual'} onClick={() => setActiveTab('manual')} icon={<PlusCircle size={22} />} label={t.add} />
        </nav>
      )}

      {/* System Admin Footer Nav */}
      {isAdmin && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 px-6 py-3 flex justify-around items-center md:relative md:border-t-0 md:bg-slate-900 md:pb-8">
           <NavButton active={true} onClick={() => {}} icon={<ShieldCheck size={22} />} label="Overview" />
           <NavButton active={false} onClick={() => {}} icon={<Users size={22} />} label="User Management" />
           <NavButton active={false} onClick={() => {}} icon={<Activity size={22} />} label="System Health" />
        </nav>
      )}
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default App;
