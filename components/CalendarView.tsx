
import React, { useState, useMemo, useEffect } from 'react';
import { HealthLog, LogType } from '../types';
import { GoogleGenAI } from '@google/genai';
import { GLUCOVITAL_MASTER_PROMPT } from '../constants';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Droplet, 
  Utensils, 
  Zap, 
  Clock,
  Activity,
  BrainCircuit,
  Loader2,
  CalendarDays,
  CalendarRange,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface CalendarViewProps {
  logs: HealthLog[];
}

type ViewType = 'day' | 'month' | 'range';

const LOADING_STEPS = [
  "Collating patient logs...",
  "Analyzing glucose stability patterns...",
  "Scanning meal impact on trends...",
  "Checking medication consistency...",
  "Crafting personalized coaching plan..."
];

export const CalendarView: React.FC<CalendarViewProps> = ({ logs }) => {
  const [viewType, setViewType] = useState<ViewType>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [insight, setInsight] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % LOADING_STEPS.length);
      }, 1500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const logDate = new Date(l.timestamp);
      if (viewType === 'day') return logDate.toDateString() === selectedDate.toDateString();
      if (viewType === 'month') return logDate.getMonth() === selectedDate.getMonth() && logDate.getFullYear() === selectedDate.getFullYear();
      if (viewType === 'range') {
        const start = new Date(startDate); start.setHours(0, 0, 0, 0);
        const end = new Date(endDate); end.setHours(23, 59, 59, 999);
        return logDate >= start && logDate <= end;
      }
      return false;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [logs, selectedDate, viewType, startDate, endDate]);

  const generateAIInsight = async () => {
    if (filteredLogs.length === 0) return;
    setIsGenerating(true);
    setInsight(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const displayLogs = filteredLogs.slice(0, 50);
      const logsSummary = displayLogs.map(l => 
        `[${new Date(l.timestamp).toLocaleString()}] ${l.type}: ${l.value} ${l.unit || ''} (Note: ${l.notes || 'N/A'})`
      ).join('\n');
      
      const periodDescription = viewType === 'day' ? selectedDate.toDateString() : viewType === 'month' ? selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : `the range ${startDate} to ${endDate}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `PATIENT LOGS SUMMARY (${periodDescription}):\n${logsSummary}\n\nGOAL: Provide a metabolic health coaching scan. \n1. Identify 1 specific metabolic pattern (e.g. dawn phenomenon, meal spikes, or great consistency).\n2. Suggest 1 practical habit shift (Habit Swap).\n3. Use the DiaLog strict-but-caring health coach tone.\nKeep it concise (max 3 sentences).`,
        config: { systemInstruction: GLUCOVITAL_MASTER_PROMPT }
      });
      
      setInsight(response.text);
    } catch (err) {
      console.error(err);
      setInsight("Metabolic scan failed. Let's keep logging and try again later!");
    } finally {
      setIsGenerating(false);
    }
  };

  const changeDay = (offset: number) => {
    const newDate = new Date(selectedDate);
    if (viewType === 'day') newDate.setDate(newDate.getDate() + offset);
    else newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
    setInsight(null);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-2">
      {/* View Switcher */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-lg">
        <TabButton active={viewType === 'day'} onClick={() => { setViewType('day'); setInsight(null); }} icon={<CalendarIcon size={16} />} label="Daily" />
        <TabButton active={viewType === 'month'} onClick={() => { setViewType('month'); setInsight(null); }} icon={<CalendarDays size={16} />} label="Monthly" />
        <TabButton active={viewType === 'range'} onClick={() => { setViewType('range'); setInsight(null); }} icon={<CalendarRange size={16} />} label="Range" />
      </div>

      {/* Date Selectors */}
      <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-xl">
        {viewType !== 'range' ? (
          <div className="flex items-center justify-between">
            <button onClick={() => changeDay(-1)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"><ChevronLeft /></button>
            <div className="flex flex-col items-center">
              <span className="font-black text-slate-100 text-lg">{viewType === 'day' ? selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{viewType === 'day' ? 'Current Day' : 'Current Month'}</span>
            </div>
            <button onClick={() => changeDay(1)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"><ChevronRight /></button>
          </div>
        ) : (
          <div className="flex items-center gap-4 justify-between">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Start</label>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setInsight(null); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
            <ArrowRight className="text-slate-700 mt-5" size={20} />
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">End</label>
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setInsight(null); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
          </div>
        )}
      </div>

      {/* AI Insight Card */}
      <div className={`p-8 rounded-[40px] border transition-all duration-700 relative overflow-hidden ${insight ? 'bg-indigo-600 text-white border-transparent shadow-indigo-900/40' : 'bg-slate-900 border-slate-800'}`}>
        {insight && <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none rotate-12 scale-150"><BrainCircuit size={100} /></div>}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${insight ? 'bg-white/20' : 'bg-indigo-500/10'}`}>
               <Sparkles size={20} className={insight ? 'text-white animate-pulse' : 'text-indigo-400'} />
            </div>
            <h3 className="font-black text-lg">AI Metabolic Scan</h3>
          </div>
          {filteredLogs.length > 0 && !insight && (
            <button 
              onClick={generateAIInsight}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-indigo-500 text-white text-xs font-black rounded-2xl hover:bg-indigo-400 transition-all flex items-center gap-2 shadow-xl shadow-indigo-900/30 active:scale-95"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
              Scan {viewType === 'day' ? 'Day' : viewType === 'month' ? 'Month' : 'Range'}
            </button>
          )}
        </div>
        
        {isGenerating ? (
          <div className="py-4 space-y-5 relative z-10">
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin text-indigo-400" size={18} />
              <p className="text-sm font-bold text-slate-400 animate-pulse">{LOADING_STEPS[loadingStep]}</p>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${(loadingStep + 1) * 20}%` }}></div>
            </div>
          </div>
        ) : insight ? (
          <div className="relative z-10">
             <p className="text-lg leading-relaxed font-bold italic">"{insight}"</p>
             <button onClick={() => setInsight(null)} className="mt-6 text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Close Insight</button>
          </div>
        ) : (
          <div className="text-center py-6 relative z-10">
            <p className="text-sm text-slate-500 font-bold max-w-xs mx-auto">
              {filteredLogs.length > 0 
                ? "Your logs are ready. Scan for metabolic patterns and habit shifts." 
                : "Record health data to unlock DiaLog's metabolic scanning."}
            </p>
          </div>
        )}
      </div>

      {/* History List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Activity size={14} /> Log Timeline
          </h4>
          <span className="text-[10px] font-black text-slate-600 uppercase bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            {filteredLogs.length} Entries
          </span>
        </div>

        <div className="space-y-3">
          {filteredLogs.length > 0 ? (
            filteredLogs.map(log => (
              <div key={log.id} className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center justify-between shadow-lg group hover:border-slate-700 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center border border-slate-800 group-hover:bg-slate-800 transition-colors">
                    <LogIcon type={log.type} />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-100">{log.notes || log.type}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-100">{log.value}</span>
                  <span className="text-[10px] ml-1.5 text-slate-500 font-black uppercase">{log.unit}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-900/50 rounded-[40px] border border-dashed border-slate-800 flex flex-col items-center gap-3">
              <AlertCircle size={40} className="text-slate-800" />
              <p className="text-slate-600 font-black uppercase text-xs tracking-widest">No Activity Recorded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${
      active 
        ? 'bg-slate-800 text-indigo-400 shadow-md border border-slate-700' 
        : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    {icon}
    {label}
  </button>
);

const LogIcon: React.FC<{ type: LogType }> = ({ type }) => {
  switch (type) {
    case LogType.GLUCOSE: return <Droplet size={20} className="text-rose-400" />;
    case LogType.MEAL: return <Utensils size={20} className="text-amber-400" />;
    case LogType.INSULIN: return <Zap size={20} className="text-cyan-400" />;
    case LogType.MEDICINE: return <Clock size={20} className="text-indigo-400" />;
    default: return <Activity size={20} className="text-slate-500" />;
  }
};
