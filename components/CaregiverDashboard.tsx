
import React, { useMemo } from 'react';
import { User, HealthLog, LogType } from '../types';
import { 
  Activity, 
  Droplet, 
  TrendingUp, 
  Phone, 
  MessageCircle, 
  Clock, 
  AlertCircle,
  Heart,
  ChevronRight,
  Zap,
  Utensils,
  // Fix: Added missing User import as UserIcon to resolve recursive call bug below
  User as UserIcon
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface CaregiverDashboardProps {
  caregiver: User;
  patientLogs: HealthLog[];
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({ caregiver, patientLogs }) => {
  const latestGlucose = useMemo(() => {
    return patientLogs.find(l => l.type === LogType.GLUCOSE);
  }, [patientLogs]);

  const glucoseStatus = useMemo(() => {
    if (!latestGlucose) return 'unknown';
    const val = Number(latestGlucose.value);
    if (val > 180) return 'high';
    if (val < 70) return 'low';
    return 'normal';
  }, [latestGlucose]);

  const chartData = useMemo(() => {
    return [...patientLogs]
      .filter(l => l.type === LogType.GLUCOSE)
      .reverse()
      .slice(-10)
      .map(l => ({
        time: new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Number(l.value)
      }));
  }, [patientLogs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Patient Profile Header */}
      <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/10 p-8 rounded-[40px] border border-amber-500/20 shadow-2xl shadow-amber-900/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Heart size={120} />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-amber-600 rounded-3xl flex items-center justify-center text-white shadow-xl">
              <UserIcon size={40} />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Monitoring Patient</p>
              <h2 className="text-3xl font-black text-white tracking-tight">Patient {caregiver.linkedPatientPhone}</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${glucoseStatus === 'normal' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Live Status: {glucoseStatus}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-200 font-bold hover:bg-slate-800 transition-all">
              <MessageCircle size={20} className="text-amber-400" /> Ping
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-amber-600 text-white rounded-2xl font-black shadow-lg shadow-amber-900/40 hover:bg-amber-500 transition-all">
              <Phone size={20} /> Call Patient
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Latest Reading */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-amber-400" /> Latest Metric
            </h3>
            {latestGlucose && (
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                {new Date(latestGlucose.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          
          {latestGlucose ? (
            <div className="flex items-baseline gap-4">
              <span className={`text-7xl font-black tracking-tighter ${glucoseStatus === 'normal' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {latestGlucose.value}
              </span>
              <span className="text-lg font-bold text-slate-600 uppercase">mg/dL</span>
            </div>
          ) : (
            <div className="py-8 text-center">
              <AlertCircle size={40} className="mx-auto text-slate-800 mb-2" />
              <p className="text-slate-500 font-bold text-sm">No recent readings</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
             <QuickStat label="Today Avg" value="112" unit="mg/dL" icon={<Droplet size={14} />} />
             <QuickStat label="Last Meal" value="45" unit="g" icon={<Utensils size={14} />} />
          </div>
        </div>

        {/* Glucose Chart */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] shadow-xl">
           <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest flex items-center gap-2 mb-8">
              <TrendingUp size={16} className="text-amber-400" /> Metabolic Trend
            </h3>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="careColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                  <YAxis hide domain={[60, 200]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#careColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="space-y-4">
        <h3 className="font-black text-slate-100 uppercase text-[10px] tracking-[0.2em] px-1">Recent Monitoring Feed</h3>
        <div className="space-y-3">
          {patientLogs.slice(0, 4).map(log => (
            <div key={log.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center justify-between group hover:border-amber-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
                  <CareLogIcon type={log.type} />
                </div>
                <div>
                  <p className="font-black text-slate-100">{log.notes || log.type}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-slate-100">{log.value}</span>
                <span className="text-[10px] ml-1 text-slate-500 font-bold uppercase">{log.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const QuickStat: React.FC<{ label: string, value: string, unit: string, icon: React.ReactNode }> = ({ label, value, unit, icon }) => (
  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 flex items-center gap-1">
      {icon} {label}
    </p>
    <p className="text-lg font-black text-slate-200">
      {value} <span className="text-[8px] text-slate-500">{unit}</span>
    </p>
  </div>
);

const CareLogIcon: React.FC<{ type: LogType }> = ({ type }) => {
  switch (type) {
    case LogType.GLUCOSE: return <Droplet size={18} className="text-rose-400" />;
    case LogType.MEAL: return <Utensils size={18} className="text-amber-400" />;
    case LogType.INSULIN: return <Zap size={18} className="text-cyan-400" />;
    default: return <Clock size={18} className="text-slate-500" />;
  }
};
