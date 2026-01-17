
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Bell, 
  Database, 
  Shield, 
  Info, 
  ChevronRight, 
  RefreshCcw, 
  Check,
  Droplet,
  Settings,
  Download,
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  Eye,
  Eraser,
  FileJson,
  Activity,
  History,
  Lock,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { getLogs, getReminders, getDoctors, getCurrentUser, setCurrentUser } from '../services/dataService';
import { UserConsents, AppLanguage } from '../types';
import { translations } from '../translations';

interface SettingsModalProps {
  onClose: () => void;
}

type Tab = 'GENERAL' | 'PRIVACY' | 'ABOUT' | 'LANGUAGE';

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('GENERAL');
  const [isResetting, setIsResetting] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
  const [tempLang, setTempLang] = useState<AppLanguage>(user?.language || 'en');

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const t = translations[user?.language || 'en'];

  const handleUpdateConsents = (newConsents: UserConsents) => {
    if (!user) return;
    const updatedUser = { ...user, consents: newConsents };
    setCurrentUser(updatedUser);
    setUser(updatedUser);
  };

  const handleUpdateLanguage = (newLang: AppLanguage) => {
    if (!user) return;
    const updatedUser = { ...user, language: newLang };
    setCurrentUser(updatedUser);
    setUser(updatedUser);
    setTempLang(newLang);
    window.location.reload(); // Refresh to apply UI changes
  };

  const handleResetData = () => {
    if (!window.confirm("ERASURE: All health data will be deleted. Proceed?")) return;
    localStorage.clear();
    window.location.reload();
  };

  const handleDownloadData = () => {
    const data = { user, logs: getLogs(), reminders: getReminders() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dialog_report_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[2000] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            {activeTab !== 'GENERAL' && (
              <button onClick={() => setActiveTab('GENERAL')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
                <ArrowLeft size={20} />
              </button>
            )}
            <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <Settings className="text-indigo-400" /> 
              {activeTab === 'GENERAL' ? t.language : activeTab === 'PRIVACY' ? t.privacyCenter : activeTab === 'LANGUAGE' ? 'App Language' : 'About'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-300 bg-slate-800 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {activeTab === 'GENERAL' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Settings</h4>
                <div className="space-y-3">
                  <MenuButton 
                    icon={<Globe size={18} className="text-indigo-400" />} 
                    label="Language" 
                    description={`Current: ${tempLang.toUpperCase()}`}
                    onClick={() => setActiveTab('LANGUAGE')}
                  />
                  <MenuButton 
                    icon={<ShieldCheck size={18} className="text-emerald-400" />} 
                    label={t.privacyCenter} 
                    description="Exercise your DPDP rights"
                    onClick={() => setActiveTab('PRIVACY')}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'LANGUAGE' && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <p className="text-sm text-slate-400 font-medium mb-4">Select your preferred language for the app interface and AI interactions.</p>
              <div className="grid grid-cols-2 gap-3">
                <LangOption active={tempLang === 'en'} label="English" onClick={() => handleUpdateLanguage('en')} />
                <LangOption active={tempLang === 'hi'} label="हिन्दी (Hindi)" onClick={() => handleUpdateLanguage('hi')} />
                <LangOption active={tempLang === 'bn'} label="বাংলা (Bengali)" onClick={() => handleUpdateLanguage('bn')} />
                <LangOption active={tempLang === 'ta'} label="தமிழ் (Tamil)" onClick={() => handleUpdateLanguage('ta')} />
                <LangOption active={tempLang === 'te'} label="తెలుగు (Telugu)" onClick={() => handleUpdateLanguage('te')} />
                <LangOption active={tempLang === 'mr'} label="मराठी (Marathi)" onClick={() => handleUpdateLanguage('mr')} />
              </div>
            </div>
          )}

          {activeTab === 'PRIVACY' && (
            <div className="space-y-6">
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-center gap-5">
                <ShieldCheck size={40} className="text-emerald-400" />
                <div>
                  <h4 className="font-black text-lg text-slate-100">{t.privacyCenter}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">DPDP COMPLIANT</p>
                </div>
              </div>

              <div className="space-y-3">
                <button onClick={handleDownloadData} className="w-full p-5 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <FileJson className="text-indigo-400" />
                    <span className="font-bold text-slate-200">{t.portability}</span>
                  </div>
                  <Download size={20} className="text-slate-600" />
                </button>
                <button onClick={handleResetData} className="w-full p-5 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-between group text-rose-400">
                  <div className="flex items-center gap-4">
                    <Trash2 />
                    <span className="font-bold">{t.erasure}</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LangOption: React.FC<{ active: boolean, label: string, onClick: () => void }> = ({ active, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`p-4 border rounded-2xl font-bold transition-all text-center ${
      active ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
    }`}
  >
    {label}
  </button>
);

const MenuButton: React.FC<{ icon: React.ReactNode, label: string, description: string, onClick: () => void }> = ({ icon, label, description, onClick }) => (
  <button onClick={onClick} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between transition-all hover:border-slate-700 group">
    <div className="flex items-center gap-4">
      <div className="transition-transform group-hover:scale-110">{icon}</div>
      <div className="text-left">
        <span className="text-sm font-bold text-slate-200 block">{label}</span>
        <span className="text-[10px] text-slate-500 font-medium">{description}</span>
      </div>
    </div>
    <ChevronRight size={16} className="text-slate-700" />
  </button>
);

const InfoItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs">
    <span className="font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    <span className="font-black text-slate-200">{value}</span>
  </div>
);
