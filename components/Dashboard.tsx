
import React, { useMemo } from 'react';
import { HealthLog, LogType, Reminder, AppLanguage } from '../types';
import { translations } from '../translations';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Droplet, Utensils, Zap, TrendingUp, AlertCircle, CheckCircle2, Activity, Clock, Plus, CheckCircle, Pill, ShieldCheck
} from 'lucide-react';

interface DashboardProps {
  logs: HealthLog[];
  reminders: Reminder[];
  onToggleReminder: (id: string) => void;
  language: AppLanguage;
}

export const Dashboard: React.FC<DashboardProps> = ({ logs, reminders, onToggleReminder, language }) => {
  const t = translations[language || 'en'];
  
  const stats = useMemo(() => {
    const glucoseLogs = logs.filter(l => l.type === LogType.GLUCOSE);
    const avgGlucose = glucoseLogs.length > 0 
      ? Math.round(glucoseLogs.reduce((acc, curr) => acc + Number(curr.value), 0) / glucoseLogs.length) 
      : '--';
    
    const completedReminders = reminders.filter(r => r.completed).length;
    const totalReminders = reminders.length;
    const adherenceRate = totalReminders > 0 ? Math.round((completedReminders / totalReminders) * 100) : 100;

    const insulinLogs = logs.filter(l => l.type === LogType.INSULIN);
    const totalInsulin = insulinLogs.reduce((acc, curr) => acc + Number(curr.value || 0), 0);

    return { avgGlucose, adherenceRate, totalInsulin };
  }, [logs, reminders]);

  const chartData = useMemo(() => {
    return [...logs]
      .filter(l => l.type === LogType.GLUCOSE)
      .reverse()
      .slice(-10)
      .map(l => ({
        time: new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Number(l.value)
      }));
  }, [logs]);

  const pendingReminders = reminders.filter(r => !r.completed);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          icon={<Droplet className="text-rose-400" />} 
          label={t.avgSugar} 
          value={stats.avgGlucose.toString()} 
          unit="mg/dL" 
          bgClass="bg-rose-500/10"
          borderClass="border-rose-500/20"
        />
        <StatCard 
          icon={<Pill className="text-indigo-400" />} 
          label={t.adherence} 
          value={stats.adherenceRate.toString()} 
          unit="%" 
          bgClass="bg-indigo-500/10"
          borderClass="border-indigo-500/20"
        />
        <StatCard 
          icon={<Zap className="text-cyan-400" />} 
          label={t.totalInsulin} 
          value={stats.totalInsulin.toString()} 
          unit="U" 
          bgClass="bg-cyan-500/10"
          borderClass="border-cyan-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Glucose Trend Chart */}
        <section className="lg:col-span-2 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-400" />
              Sugar Level Trend
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 size={12} /> Stable Range (70-140)
            </span>
          </div>
          
          <div className="h-[200px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} domain={[60, 200]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                <AlertCircle size={32} />
                <p className="text-sm font-medium">No readings recorded today.</p>
              </div>
            )}
          </div>
        </section>

        {/* Reminders Widget */}
        <section className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Clock size={20} className="text-rose-400" />
              {t.dueMed}
            </h3>
            <button className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-500">
              <Plus size={18} />
            </button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
            {pendingReminders.length > 0 ? (
              pendingReminders.map(reminder => (
                <div key={reminder.id} className="group flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-800 p-2 rounded-xl text-rose-400 border border-slate-700">
                      <Pill size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{reminder.label}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{reminder.time}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onToggleReminder(reminder.id)}
                    className="text-slate-600 hover:text-emerald-400 transition-colors"
                  >
                    <CheckCircle size={20} />
                  </button>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-6 text-center">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mb-2 border border-emerald-500/20">
                  <ShieldCheck size={24} />
                </div>
                <p className="text-xs font-bold text-slate-500">All medications logged</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Recent Activity */}
      <section className="space-y-4">
        <h3 className="font-bold text-slate-100 px-1">Health Timeline</h3>
        <div className="space-y-3">
          {logs.slice(0, 5).map((log) => (
            <ActivityItem key={log.id} log={log} />
          ))}
          {logs.length === 0 && (
            <div className="text-center py-12 bg-slate-900 rounded-3xl border border-dashed border-slate-700">
              <p className="text-slate-500 text-sm">No activity logs yet</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, unit: string, bgClass: string, borderClass: string }> = ({ icon, label, value, unit, bgClass, borderClass }) => (
  <div className={`p-4 rounded-3xl ${bgClass} border ${borderClass} flex items-center gap-4`}>
    <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-slate-100">{value}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase">{unit}</span>
      </div>
    </div>
  </div>
);

const ActivityItem: React.FC<{ log: HealthLog }> = ({ log }) => {
  const getIcon = () => {
    switch (log.type) {
      case LogType.GLUCOSE: return <Droplet className="text-rose-400" size={18} />;
      case LogType.MEAL: return <Utensils className="text-amber-400" size={18} />;
      case LogType.INSULIN: return <Zap className="text-cyan-400" size={18} />;
      case LogType.MEDICINE: return <Pill className="text-indigo-400" size={18} />;
      default: return <Activity size={18} />;
    }
  };

  return (
    <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-100">
          {log.type === LogType.MEAL ? `${log.notes || 'Logged Meal'}` : `${log.type.charAt(0) + log.type.slice(1).toLowerCase()}`}
        </p>
        <p className="text-[10px] text-slate-500 font-medium tracking-wide">
          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-slate-100">{log.value} <span className="text-[10px] text-slate-500 font-black uppercase">{log.unit}</span></p>
      </div>
    </div>
  );
};
