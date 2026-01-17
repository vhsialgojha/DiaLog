
import React, { useState } from 'react';
import { HealthLog, LogType, AppLanguage } from '../types';
import { translations } from '../translations';
import { 
  Droplet, 
  Utensils, 
  Zap, 
  Clipboard, 
  Check, 
  Camera, 
  Sparkles, 
  Pill, 
  ArrowRight, 
  FileText,
  ScanLine,
  ChevronRight,
  Clock,
  FlaskConical,
  Activity
} from 'lucide-react';
import { PrescriptionScanner } from './PrescriptionScanner';
import { ReportScanner } from './ReportScanner';

interface ManualEntryProps {
  onAddLog: (log: Omit<HealthLog, 'id' | 'timestamp'>) => void;
  language: AppLanguage;
}

export const ManualEntry: React.FC<ManualEntryProps> = ({ onAddLog, language }) => {
  const t = translations[language || 'en'];
  const [type, setType] = useState<LogType>(LogType.GLUCOSE);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('mg/dL');
  const [notes, setNotes] = useState('');
  
  // Specific fields for Medicine
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');

  const [isSuccess, setIsSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showReportScanner, setShowReportScanner] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === LogType.MEDICINE) {
      if (!medName || !dosage) return;
      onAddLog({
        type: LogType.MEDICINE,
        value: `${medName} (${dosage})`,
        unit: frequency,
        notes: notes
      });
    } else {
      if (!value) return;
      onAddLog({
        type,
        value,
        unit,
        notes
      });
    }

    setIsSuccess(true);
    setValue('');
    setNotes('');
    setMedName('');
    setDosage('');
    setFrequency('');
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleTypeChange = (newType: LogType) => {
    setType(newType);
    if (newType === LogType.GLUCOSE) setUnit('mg/dL');
    else if (newType === LogType.MEAL) setUnit('g');
    else if (newType === LogType.INSULIN) setUnit('U');
    else if (newType === LogType.MEDICINE) setUnit('dose');
  };

  const isFormValid = type === LogType.MEDICINE 
    ? (medName.length > 0 && dosage.length > 0)
    : value.length > 0;

  return (
    <div className="max-w-md mx-auto space-y-6 py-4">
      {showScanner && (
        <PrescriptionScanner 
          onAddLog={onAddLog} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {showReportScanner && (
        <ReportScanner 
          onAddLog={onAddLog} 
          onClose={() => setShowReportScanner(false)} 
        />
      )}

      <div className="text-center space-y-1">
        <h2 className="text-3xl font-black text-slate-100 tracking-tight">Health Record</h2>
        <p className="text-sm text-slate-500 font-medium tracking-wide uppercase text-[10px]">AI-Powered Metabolic Tracking</p>
      </div>

      {/* SCANNER BUTTONS GRID */}
      <div className="grid grid-cols-1 gap-4">
        {/* PRESCRIPTION SCANNER */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[38px] blur-md opacity-40 group-hover:opacity-75 transition duration-500"></div>
          <button 
            onClick={() => setShowScanner(true)}
            className="relative w-full bg-slate-900 border border-white/10 rounded-[36px] p-1 flex items-center transition-all overflow-hidden"
          >
            <div className="flex-1 flex items-center gap-4 p-5 pl-6">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-2xl transform group-hover:rotate-6 transition-transform duration-300">
                <Pill size={28} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-lg font-black text-white leading-tight">Scan Medicine</span>
                  <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">Sync Rx to Reminders</p>
              </div>
            </div>
            <div className="pr-6 text-indigo-400 group-hover:translate-x-1 transition-transform">
               <ChevronRight size={24} />
            </div>
          </button>
        </div>

        {/* LAB REPORT SCANNER */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-[38px] blur-md opacity-40 group-hover:opacity-75 transition duration-500"></div>
          <button 
            onClick={() => setShowReportScanner(true)}
            className="relative w-full bg-slate-900 border border-white/10 rounded-[36px] p-1 flex items-center transition-all overflow-hidden"
          >
            <div className="flex-1 flex items-center gap-4 p-5 pl-6">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center text-white shadow-2xl transform group-hover:-rotate-6 transition-transform duration-300">
                <FlaskConical size={28} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-lg font-black text-white leading-tight">Scan Lab Report</span>
                  <Activity size={14} className="text-emerald-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">Extract Vitals & Trends</p>
              </div>
            </div>
            <div className="pr-6 text-emerald-400 group-hover:translate-x-1 transition-transform">
               <ChevronRight size={24} />
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <TypeSelector 
          active={type === LogType.GLUCOSE} 
          onClick={() => handleTypeChange(LogType.GLUCOSE)} 
          icon={<Droplet size={20} />} 
          label="Glucose"
          color="rose"
        />
        <TypeSelector 
          active={type === LogType.MEDICINE} 
          onClick={() => handleTypeChange(LogType.MEDICINE)} 
          icon={<Pill size={20} />} 
          label="Medicine"
          color="indigo"
        />
        <TypeSelector 
          active={type === LogType.INSULIN} 
          onClick={() => handleTypeChange(LogType.INSULIN)} 
          icon={<Zap size={20} />} 
          label="Insulin"
          color="cyan"
        />
        <TypeSelector 
          active={type === LogType.MEAL} 
          onClick={() => handleTypeChange(LogType.MEAL)} 
          icon={<Utensils size={20} />} 
          label="Meal"
          color="amber"
        />
      </div>

      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-2xl space-y-6">
          {type === LogType.MEDICINE ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Medication Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Metformin"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-200 placeholder:text-slate-800 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Dosage</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 500mg"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-200 placeholder:text-slate-800 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Frequency</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Twice Daily"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-200 placeholder:text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  {type === LogType.GLUCOSE ? "Sugar Level" : "Value"} ({unit})
                </label>
              </div>
              <input 
                type="text" 
                inputMode="numeric"
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full text-5xl font-black bg-slate-950 border border-slate-800 rounded-2xl p-6 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-100 placeholder:text-slate-800 outline-none"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Additional Notes</label>
            <textarea 
              placeholder={type === LogType.GLUCOSE ? "How do you feel? (e.g. lightheaded, tired)" : "e.g. Taken with breakfast..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-200 placeholder:text-slate-700 resize-none h-28 outline-none"
            />
          </div>

          <button 
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-5 rounded-2xl font-black text-white transition-all shadow-xl flex items-center justify-center gap-2 text-lg ${
              isSuccess 
                ? 'bg-emerald-500 shadow-emerald-900/20' 
                : !isFormValid 
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-indigo-600 shadow-indigo-900/40 hover:bg-indigo-500 active:scale-95'
            }`}
          >
            {isSuccess ? <Check /> : <Clipboard size={22} />}
            {isSuccess ? 'Treatment Logged!' : 'Save Entry'}
          </button>
        </form>
      </div>
    </div>
  );
};

const TypeSelector: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color: string }> = ({ active, onClick, icon, label, color }) => {
  const colorMap: Record<string, string> = {
    rose: active ? 'bg-rose-500 text-white' : 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    amber: active ? 'bg-amber-500 text-white' : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    cyan: active ? 'bg-cyan-500 text-white' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    indigo: active ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-[24px] border transition-all ${colorMap[color]} ${active ? 'scale-105 shadow-lg' : 'grayscale-[0.3]'}`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
};
