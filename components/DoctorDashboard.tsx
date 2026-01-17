
import React, { useState } from 'react';
import { User, HealthLog, LogType } from '../types';
import { 
  Users, 
  Search, 
  ArrowUpRight, 
  Activity, 
  Droplet, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';

interface DoctorDashboardProps {
  doctor: User;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ doctor }) => {
  // Mock patient list for a doctor
  const [patients] = useState([
    { id: 'p1', name: 'John Doe', age: 42, condition: 'Type 2 Diabetes', lastUpdate: '2h ago', glucoseAvg: 124, status: 'stable' },
    { id: 'p2', name: 'Sarah Smith', age: 28, condition: 'Gestational Diabetes', lastUpdate: '15m ago', glucoseAvg: 168, status: 'warning' },
    { id: 'p3', name: 'Mike Johnson', age: 56, condition: 'Pre-diabetes', lastUpdate: '1d ago', glucoseAvg: 102, status: 'good' }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Professional Portal</h2>
          <p className="text-slate-500 font-medium">Dr. {doctor.name} • {doctor.specialization}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
          <input 
            type="text" 
            placeholder="Search patients..." 
            className="bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-6 py-3.5 text-sm text-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none w-full md:w-80"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InsightCard title="Active Patients" value={patients.length.toString()} icon={<Users />} color="indigo" />
        <InsightCard title="Alerts Required" value="1" icon={<AlertTriangle />} color="rose" />
        <InsightCard title="Reports Generated" value="12" icon={<ClipboardList />} color="emerald" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-black text-slate-100 uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
            <Users size={14} className="text-indigo-400" /> Patient Directory
          </h3>
          <button className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">View History</button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {patients.map(patient => (
            <PatientListItem key={patient.id} patient={patient} />
          ))}
        </div>
      </div>
    </div>
  );
};

const InsightCard: React.FC<{ title: string, value: string, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => {
  const colorMap: any = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  };

  return (
    <div className={`p-6 rounded-[32px] border flex items-center gap-5 shadow-xl ${colorMap[color]}`}>
      <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{title}</p>
        <p className="text-3xl font-black text-white">{value}</p>
      </div>
    </div>
  );
};

const PatientListItem: React.FC<{ patient: any }> = ({ patient }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 hover:border-slate-700 transition-all group cursor-pointer shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-all">
        <Users size={24} />
      </div>
      <div>
        <h4 className="text-xl font-black text-white">{patient.name}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{patient.condition}</span>
          <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Age {patient.age}</span>
        </div>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-8">
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Glucose</p>
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-black ${patient.status === 'warning' ? 'text-rose-400' : 'text-emerald-400'}`}>
            {patient.glucoseAvg}
          </span>
          <span className="text-[10px] font-bold text-slate-600 uppercase">mg/dL</span>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Activity</p>
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-indigo-400" />
          <span className="text-sm font-bold text-slate-200">{patient.lastUpdate}</span>
        </div>
      </div>

      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${
        patient.status === 'good' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
        patient.status === 'warning' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]' :
        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      }`}>
        {patient.status}
      </div>

      <ChevronRight className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
    </div>
  </div>
);
