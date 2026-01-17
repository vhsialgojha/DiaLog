
import React, { useState, useMemo } from 'react';
import { User, UserRole, AppLanguage } from '../types';
import { 
  ShieldCheck, 
  Users, 
  Database, 
  Activity, 
  Server, 
  Globe, 
  AlertTriangle, 
  BarChart3, 
  Cpu, 
  Lock, 
  ShieldAlert,
  ArrowUpRight,
  RefreshCcw,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

interface AdminDashboardProps {
  admin: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ admin }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock global system data
  const stats = useMemo(() => ({
    totalUsers: 14502,
    activePatients: 12400,
    doctors: 850,
    caregivers: 1252,
    totalLogs: 1245000,
    aiProcessingLatency: '420ms',
    uptime: '99.99%',
    dataLocation: 'Mumbai (MH-1)'
  }), []);

  const languageDistribution = [
    { name: 'English', value: 45, color: '#6366f1' },
    { name: 'Hindi', value: 30, color: '#f43f5e' },
    { name: 'Bengali', value: 10, color: '#fbbf24' },
    { name: 'Tamil', value: 7, color: '#10b981' },
    { name: 'Other', value: 8, color: '#94a3b8' },
  ];

  const systemLoadData = [
    { time: '00:00', load: 12 },
    { time: '04:00', load: 8 },
    { time: '08:00', load: 45 },
    { time: '12:00', load: 85 },
    { time: '16:00', load: 92 },
    { time: '20:00', load: 60 },
    { time: '23:59', load: 30 },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Admin Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Systems Command</h2>
          <p className="text-slate-500 font-bold flex items-center gap-2 mt-1">
            <Server size={14} className="text-blue-500" /> System Active • Logged as {admin.name}
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          className="bg-slate-900 border border-slate-800 text-slate-300 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
        >
          <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          Sync Global Stats
        </button>
      </div>

      {/* Global Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminStatCard label="Total Principals" value={stats.totalUsers.toLocaleString()} icon={<Users />} trend="+12%" />
        <AdminStatCard label="Metabolic Logs" value="1.2M" icon={<Activity />} trend="+8%" />
        <AdminStatCard label="AI Latency" value={stats.aiProcessingLatency} icon={<Cpu />} trend="-5ms" />
        <AdminStatCard label="System Uptime" value={stats.uptime} icon={<CheckCircle2 />} trend="Stable" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Load Chart */}
        <section className="lg:col-span-2 bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Activity size={100} />
          </div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">API Traffic Load</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">24 Hour System Throughput</p>
            </div>
            <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-blue-400 uppercase">Realtime Scan</span>
            </div>
          </div>
          <div className="h-[240px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={systemLoadData}>
                <defs>
                  <linearGradient id="adminLoadColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#475569'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#475569'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #334155' }}
                  itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="load" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#adminLoadColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Regional Distribution */}
        <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl">
          <h3 className="text-xl font-black text-white tracking-tight mb-8">Linguistic Reach</h3>
          <div className="h-[240px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languageDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {languageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <Globe size={32} className="text-slate-700 mb-1" />
              <span className="text-xs font-black text-slate-500 uppercase">Global</span>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {languageDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="font-bold text-slate-400">{item.name}</span>
                </div>
                <span className="font-black text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* DPDP Compliance & System Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        <section className="bg-slate-900/50 p-8 rounded-[40px] border border-slate-800/50 space-y-6">
          <div className="flex items-center gap-3">
            <ShieldAlert size={24} className="text-blue-500" />
            <h3 className="text-xl font-black text-white">Privacy Oversight</h3>
          </div>
          <div className="space-y-4">
             <ComplianceItem label="Consent Withdrawal Rate" value="0.42%" status="safe" />
             <ComplianceItem label="Right to Erasure (Requests)" value="12" status="pending" />
             <ComplianceItem label="Data Residency Sync" value="Verified" status="safe" />
             <ComplianceItem label="Grievance Redressal (SLA)" value="100%" status="safe" />
          </div>
          <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
            <p className="text-[10px] font-bold text-blue-400 leading-relaxed uppercase tracking-widest text-center">
              System is operating under India DPDP Act v1.0 parameters
            </p>
          </div>
        </section>

        <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-slate-500" />
              <h3 className="text-xl font-black text-white">System Audit</h3>
            </div>
            <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300">View Detailed Log</button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
            <AuditLogItem time="2m ago" action="CONSENT_UPDATE" user="UID:8321" />
            <AuditLogItem time="15m ago" action="BULK_ENCRYPTION_SYNC" user="SYS:CORE" />
            <AuditLogItem time="42m ago" action="METABOLIC_TRAINING_REBASE" user="SYS:AI" />
            <AuditLogItem time="1h ago" action="USER_DELETION_ERASURE" user="UID:1092" />
            <AuditLogItem time="3h ago" action="NEW_DOCTOR_REGISTRATION" user="UID:0092" />
          </div>
        </section>
      </div>
    </div>
  );
};

const AdminStatCard: React.FC<{ label: string, value: string, icon: React.ReactNode, trend: string }> = ({ label, value, icon, trend }) => (
  <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 shadow-xl relative overflow-hidden group">
    <div className="absolute -bottom-2 -right-2 p-6 opacity-[0.03] group-hover:scale-125 transition-transform">
      {icon}
    </div>
    <div className="flex flex-col h-full justify-between">
      <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20 mb-4">
        {icon}
      </div>
      <div>
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</h4>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-black text-white">{value}</p>
          <span className={`text-[10px] font-bold ${trend.startsWith('+') ? 'text-emerald-500' : 'text-blue-400'}`}>{trend}</span>
        </div>
      </div>
    </div>
  </div>
);

const ComplianceItem: React.FC<{ label: string, value: string, status: 'safe' | 'pending' | 'warning' }> = ({ label, value, status }) => (
  <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
    <span className="text-xs font-bold text-slate-400">{label}</span>
    <div className="flex items-center gap-3">
      <span className="text-xs font-black text-white">{value}</span>
      <div className={`w-2 h-2 rounded-full ${status === 'safe' ? 'bg-emerald-500' : status === 'warning' ? 'bg-rose-500' : 'bg-blue-500 animate-pulse'}`}></div>
    </div>
  </div>
);

const AuditLogItem: React.FC<{ time: string, action: string, user: string }> = ({ time, action, user }) => (
  <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
    <div>
      <p className="text-[10px] font-black text-blue-400 tracking-widest">{action}</p>
      <p className="text-[10px] font-bold text-slate-600 mt-0.5">{user}</p>
    </div>
    <span className="text-[10px] font-black text-slate-500 uppercase">{time}</span>
  </div>
);
