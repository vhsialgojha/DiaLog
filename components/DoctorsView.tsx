
import React, { useState, useEffect } from 'react';
import { Doctor, HealthLog } from '../types';
import { getDoctors, saveDoctor, updateDoctorAccess, deleteDoctor, updateLastShared } from '../services/dataService';
import { GoogleGenAI } from '@google/genai';
import { 
  UserPlus, 
  Mail, 
  Shield, 
  ShieldOff, 
  Trash2, 
  Share2, 
  CheckCircle2, 
  Stethoscope,
  X,
  Loader2,
  AlertCircle,
  ShieldCheck,
  AlertTriangle,
  Lock,
  FileText,
  Copy,
  ExternalLink
} from 'lucide-react';

interface DoctorsViewProps {
  logs: HealthLog[];
}

export const DoctorsView: React.FC<DoctorsViewProps> = ({ logs }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmingShare, setConfirmingShare] = useState<Doctor | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Doctor | null>(null);
  const [confirmingRevoke, setConfirmingRevoke] = useState<Doctor | null>(null);
  const [isSharing, setIsSharing] = useState<string | null>(null);
  const [sharingSuccess, setSharingSuccess] = useState<string | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [lastGeneratedReport, setLastGeneratedReport] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('Endocrinologist');

  useEffect(() => {
    setDoctors(getDoctors());
  }, []);

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    const newDoc = saveDoctor({ name, email, specialization });
    setDoctors([...doctors, newDoc]);
    setShowAddModal(false);
    setName('');
    setEmail('');
  };

  const handleToggleAccess = (doctor: Doctor) => {
    if (doctor.accessGranted) {
      setConfirmingRevoke(doctor);
    } else {
      executeToggleAccess(doctor.id, false);
    }
  };

  const executeToggleAccess = (id: string, currentAccess: boolean) => {
    updateDoctorAccess(id, !currentAccess);
    setDoctors(doctors.map(d => d.id === id ? { ...d, accessGranted: !currentAccess } : d));
    setConfirmingRevoke(null);
  };

  const handleDelete = (doctor: Doctor) => {
    setConfirmingDelete(doctor);
  };

  const executeDelete = (id: string) => {
    deleteDoctor(id);
    setDoctors(doctors.filter(d => d.id !== id));
    setConfirmingDelete(null);
  };

  const triggerShareConfirmation = (doctor: Doctor) => {
    setHasConsented(false);
    setLastGeneratedReport(null);
    setConfirmingShare(doctor);
  };

  const handleCopyReport = () => {
    if (lastGeneratedReport) {
      navigator.clipboard.writeText(lastGeneratedReport);
      setSharingSuccess(isSharing || 'copied');
      setTimeout(() => setSharingSuccess(null), 2000);
    }
  };

  const handleShareReport = async () => {
    if (!confirmingShare || !hasConsented) return;
    const doctor = confirmingShare;
    setIsSharing(doctor.id);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const recentLogs = logs.slice(0, 30).map(l => 
        `${new Date(l.timestamp).toLocaleString()}: ${l.type} - ${l.value} ${l.unit || ''} (${l.notes || ''})`
      ).join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a concise, professional medical summary for a doctor based on the following patient logs. 
        Format it for an email. Include a clear subject line at the very top.
        Recipient Doctor: Dr. ${doctor.name} (${doctor.specialization})
        Logs:
        ${recentLogs}`,
      });

      const reportText = response.text || '';
      setLastGeneratedReport(reportText);

      // Trigger Mailto Link
      const subject = encodeURIComponent(`DiaLog Health Summary: ${doctor.name}'s Patient Update`);
      const body = encodeURIComponent(reportText);
      window.location.href = `mailto:${doctor.email}?subject=${subject}&body=${body}`;

      updateLastShared(doctor.id);
      setDoctors(doctors.map(d => d.id === doctor.id ? { ...d, lastShared: Date.now() } : d));
      setSharingSuccess(doctor.id);
      setTimeout(() => {
        setSharingSuccess(null);
        setConfirmingShare(null);
      }, 3000);
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setIsSharing(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Care Team</h2>
          <p className="text-sm text-slate-500 font-medium">Manage who can view your health data</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
        >
          <UserPlus size={18} />
          Add Doctor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {doctors.map(doctor => (
          <div key={doctor.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden group">
            {!doctor.accessGranted && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                  <ShieldOff size={14} /> Access Revoked
                </div>
              </div>
            )}
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 border border-slate-700">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-100 text-lg">Dr. {doctor.name}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{doctor.specialization}</p>
                </div>
              </div>
              <div className="flex gap-2 relative z-20">
                <button 
                  onClick={() => handleToggleAccess(doctor)}
                  title={doctor.accessGranted ? "Revoke Access" : "Grant Access"}
                  className={`p-2 rounded-xl border transition-all ${doctor.accessGranted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                >
                  {doctor.accessGranted ? <Shield size={18} /> : <ShieldOff size={18} />}
                </button>
                <button 
                  onClick={() => handleDelete(doctor)}
                  className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                <Mail size={14} className="text-indigo-400" />
                <span className="font-medium truncate">{doctor.email}</span>
              </div>
              
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
                <span>Last Shared</span>
                <span>{doctor.lastShared ? new Date(doctor.lastShared).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>

            <button 
              disabled={!doctor.accessGranted || isSharing === doctor.id}
              onClick={() => triggerShareConfirmation(doctor)}
              className={`w-full py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition-all relative z-20 ${
                sharingSuccess === doctor.id 
                  ? 'bg-emerald-500 text-white'
                  : doctor.accessGranted 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-500 active:scale-95' 
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              {isSharing === doctor.id ? (
                <Loader2 size={18} className="animate-spin" />
              ) : sharingSuccess === doctor.id ? (
                <CheckCircle2 size={18} />
              ) : (
                <Share2 size={18} />
              )}
              {sharingSuccess === doctor.id ? 'Report Ready' : 'Share AI Summary'}
            </button>
          </div>
        ))}
      </div>

      {/* Share Confirmation Modal */}
      {confirmingShare && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-8 space-y-6">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 mx-auto">
                <FileText size={32} />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-slate-100">Share Health Report?</h3>
                <p className="text-sm text-slate-400">
                  DiaLog will generate a professional summary for <strong>Dr. {confirmingShare.name}</strong> and open your email app.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3 text-xs text-slate-400">
                  <div className="mt-0.5 text-indigo-400"><AlertCircle size={14} /></div>
                  <p>AI will analyze your last 30 logs for metabolic trends.</p>
                </div>
                <div className="flex items-start gap-3 text-xs text-slate-400">
                  <div className="mt-0.5 text-indigo-400"><ExternalLink size={14} /></div>
                  <p>This environment will open your system's default mail client.</p>
                </div>
              </div>

              {!lastGeneratedReport ? (
                <>
                  <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={hasConsented}
                      onChange={(e) => setHasConsented(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-200">
                      I consent to DiaLog analyzing and sharing my logs.
                    </span>
                  </label>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setConfirmingShare(null)}
                      className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={!hasConsented || !!isSharing}
                      onClick={handleShareReport}
                      className={`flex-1 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${
                        hasConsented 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-500 active:scale-95' 
                          : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                      {isSharing ? 'Generating...' : 'Open Email'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                   <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                     <p className="text-xs font-bold text-emerald-400 text-center">AI Report Generated & Email App Triggered</p>
                   </div>
                   <div className="flex flex-col gap-2">
                      <button 
                        onClick={handleCopyReport}
                        className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Copy size={18} /> Copy Report Text
                      </button>
                      <button 
                        onClick={() => setConfirmingShare(null)}
                        className="w-full py-3 text-slate-500 font-bold hover:text-slate-300 transition-colors text-sm"
                      >
                        Dismiss
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-100">Add New Doctor</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-500 hover:text-slate-300"><X /></button>
            </div>
            <form onSubmit={handleAddDoctor} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Sarah Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                <input 
                  required
                  type="email" 
                  placeholder="dr.smith@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Specialization</label>
                <select 
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                >
                  <option>Endocrinologist</option>
                  <option>General Practitioner</option>
                  <option>Nutritionist</option>
                  <option>Cardiologist</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-900/40 active:scale-95"
              >
                Add to Care Team
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
