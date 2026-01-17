
import React, { useState, useRef, useEffect } from 'react';
import { UserRole, User, UserConsents, AppLanguage } from '../types';
import { translations } from '../translations';
import { setCurrentUser, getUserByPhone } from '../services/dataService';
import { 
  Activity, 
  User as UserIcon, 
  Stethoscope, 
  ArrowRight, 
  Mail, 
  Phone,
  ShieldCheck,
  Sparkles,
  Lock,
  MessageSquare,
  KeyRound,
  HeartHandshake,
  Mic,
  Camera,
  LineChart,
  BrainCircuit,
  ChevronDown,
  Globe,
  Database,
  ArrowUpRight,
  Pill,
  Droplet,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AuthProps {
  onAuthComplete: (user: User) => void;
}

type AuthStep = 'LANDING' | 'NOTICE' | 'PHONE' | 'OTP' | 'ROLE_SELECT' | 'PROFILE';

export const Auth: React.FC<AuthProps> = ({ onAuthComplete }) => {
  const [step, setStep] = useState<AuthStep>('LANDING');
  const [lang, setLang] = useState<AppLanguage>('en');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [linkedPatientPhone, setLinkedPatientPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const t = translations[lang];

  // Consent State
  const [consents, setConsents] = useState<UserConsents>({
    healthLogging: true,
    aiAnalysis: true,
    doctorSharing: false,
    timestamp: Date.now(),
    version: 'v1.0-DPDP'
  });

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 'OTP' && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }
    setError('');
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('OTP');
    }, 800);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpVerify = () => {
    if (otp.some(digit => !digit)) {
      setError('Please enter the full 6-digit code');
      return;
    }
    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const existingUser = getUserByPhone(phone);
      if (existingUser) {
        setCurrentUser(existingUser);
        onAuthComplete(existingUser);
      } else {
        setStep('ROLE_SELECT');
      }
    }, 1200);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role) return;
    setIsSubmitting(true);
    
    setTimeout(() => {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        phone,
        name,
        email,
        role,
        language: lang,
        specialization: role === UserRole.DOCTOR ? specialization : undefined,
        linkedPatientPhone: role === UserRole.CAREGIVER ? linkedPatientPhone : undefined,
        healthGoals: role === UserRole.PATIENT ? ['Maintain glucose stability'] : undefined,
        consents: {
          ...consents,
          timestamp: Date.now() // Finalized at profile completion
        }
      };
      
      setCurrentUser(newUser);
      onAuthComplete(newUser);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950 flex flex-col items-center overflow-y-auto custom-scrollbar">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-rose-600/10 rounded-full blur-[120px] animate-pulse duration-700"></div>
      </div>

      <div className="max-w-4xl w-full relative z-10 px-6 py-12 md:py-24">
        {step === 'LANDING' && (
          <div className="space-y-24 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {/* Hero Section */}
            <div className="text-center space-y-8 max-w-3xl mx-auto">
              <div className="flex flex-col items-center gap-6">
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full text-indigo-400 text-xs font-black uppercase tracking-[0.2em] animate-bounce">
                  <Sparkles size={14} /> Powered by Gemini 3.0
                </div>
                
                {/* Language Picker */}
                <div className="flex flex-wrap justify-center gap-2">
                  <LangChip active={lang === 'en'} onClick={() => setLang('en')} label="English" />
                  <LangChip active={lang === 'hi'} onClick={() => setLang('hi')} label="हिन्दी" />
                  <LangChip active={lang === 'bn'} onClick={() => setLang('bn')} label="বাংলা" />
                  <LangChip active={lang === 'ta'} onClick={() => setLang('ta')} label="தமிழ்" />
                  <LangChip active={lang === 'te'} onClick={() => setLang('te')} label="తెలుగు" />
                  <LangChip active={lang === 'mr'} onClick={() => setLang('mr')} label="मराठी" />
                </div>
              </div>

              <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">
                {t.heroTitle}
              </h1>
              <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                {t.heroSub}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button 
                  onClick={() => setStep('NOTICE')}
                  className="w-full sm:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[24px] font-black text-xl transition-all shadow-2xl shadow-indigo-900/40 flex items-center justify-center gap-3 active:scale-95 group"
                >
                  {t.startBtn} <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-bold bg-slate-900/50 px-6 py-5 rounded-[24px] border border-slate-800">
                  <ShieldCheck size={20} className="text-emerald-500" /> DPDP Act Compliant
                </div>
              </div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FeatureCard 
                icon={<Droplet className="text-rose-400" />} 
                title="Smart Glucose Logs" 
                description="Easily record your sugar levels via voice or scan. AI tracks trends and provides immediate feedback."
                color="rose"
              />
              <FeatureCard 
                icon={<Pill className="text-indigo-400" />} 
                title="Medication Adherence" 
                description="Scan prescriptions to set smart reminders. Never miss a dose of insulin or oral medication again."
                color="indigo"
              />
              <FeatureCard 
                icon={<Activity className="text-emerald-400" />} 
                title="Metabolic Stability" 
                description="Real-time scanning of your logs to identify spikes and provide practical swaps for better stability."
                color="emerald"
              />
              <FeatureCard 
                icon={<HeartHandshake className="text-amber-400" />} 
                title="Care Team Portal" 
                description="Direct port for your Doctor to monitor your sugar levels and treatment compliance in real-time."
                color="amber"
              />
            </div>
          </div>
        )}

        {step === 'NOTICE' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-12">
            <div className="text-center space-y-4">
              <div className="inline-flex bg-indigo-600/10 p-5 rounded-[32px] text-indigo-400 border border-indigo-500/20 mb-2">
                <ShieldCheck size={48} />
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight">{t.privacyNotice}</h2>
              <p className="text-slate-400 font-medium">As per the Digital Personal Data Protection Act (DPDP), we require your consent to process your health data.</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[40px] shadow-2xl space-y-8">
              <div className="space-y-6">
                <ConsentToggle 
                  active={consents.healthLogging} 
                  title="Health Data Processing" 
                  description="Required to store and display your glucose levels, medication, and meals."
                  icon={<Droplet size={18} />}
                  onToggle={() => setConsents({...consents, healthLogging: !consents.healthLogging})}
                />
                <ConsentToggle 
                  active={consents.aiAnalysis} 
                  title="AI Pattern Analysis" 
                  description="Use of Gemini 3.0 to analyze your trends and provide metabolic insights."
                  icon={<BrainCircuit size={18} />}
                  onToggle={() => setConsents({...consents, aiAnalysis: !consents.aiAnalysis})}
                />
                <ConsentToggle 
                  active={consents.doctorSharing} 
                  title="Third-Party Data Sharing" 
                  description="Allowing secure sharing of generated reports with registered doctors."
                  icon={<Stethoscope size={18} />}
                  onToggle={() => setConsents({...consents, doctorSharing: !consents.doctorSharing})}
                />
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                  Notice Version: {consents.version} • Processing in {lang.toUpperCase()}
                </p>
              </div>

              <button 
                disabled={!consents.healthLogging}
                onClick={() => setStep('PHONE')}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {t.acceptProceed} <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 'PHONE' && (
          <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center space-y-4">
              <button onClick={() => setStep('LANDING')} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 transition-colors mb-4 block mx-auto">← Back</button>
              <div className="inline-flex bg-indigo-600 p-5 rounded-[32px] text-white shadow-2xl shadow-indigo-500/30 mb-2">
                <Activity size={48} />
              </div>
              <h1 className="text-4xl font-black text-slate-100 tracking-tight">Access DiaLog</h1>
            </div>

            <form onSubmit={handlePhoneSubmit} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[40px] shadow-2xl space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Mobile Number</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors">
                    <Phone size={20} />
                  </div>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 pl-12 text-xl font-bold text-slate-100 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-800"
                  />
                </div>
              </div>
              <button className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-2 active:scale-95">
                Verify Identity <ArrowRight size={20} />
              </button>
            </form>
          </div>
        )}

        {step === 'OTP' && (
          <div className="max-w-md mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-white">Verify Phone</h2>
              <p className="text-slate-400 text-sm">Code sent to {phone}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] space-y-8">
              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { otpRefs.current[idx] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 bg-slate-950 border border-slate-800 rounded-xl text-center text-2xl font-black text-white outline-none"
                  />
                ))}
              </div>
              <button onClick={handleOtpVerify} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg">
                Verify Code
              </button>
            </div>
          </div>
        )}

        {step === 'ROLE_SELECT' && (
          <div className="max-w-md mx-auto space-y-6">
            <h2 className="text-3xl font-black text-white text-center">Select Your Role</h2>
            <div className="grid grid-cols-1 gap-3">
              <RoleCard icon={<UserIcon size={24} />} title={t.rolePatient} onClick={() => { setRole(UserRole.PATIENT); setStep('PROFILE'); }} color="indigo" />
              <RoleCard icon={<HeartHandshake size={24} />} title={t.roleCaregiver} onClick={() => { setRole(UserRole.CAREGIVER); setStep('PROFILE'); }} color="amber" />
              <RoleCard icon={<Stethoscope size={24} />} title={t.roleDoctor} onClick={() => { setRole(UserRole.DOCTOR); setStep('PROFILE'); }} color="emerald" />
              <RoleCard icon={<ShieldCheck size={24} />} title={t.roleAdmin} onClick={() => { setRole(UserRole.ADMIN); setStep('PROFILE'); }} color="blue" />
            </div>
          </div>
        )}

        {step === 'PROFILE' && (
          <div className="max-w-md mx-auto space-y-8">
            <h2 className="text-3xl font-black text-white text-center">Complete Setup</h2>
            <form onSubmit={handleProfileSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] space-y-6">
              <InputGroup label="Full Name" icon={<UserIcon size={18} />} value={name} onChange={setName} placeholder="e.g. John Doe" />
              <InputGroup label="Email" icon={<Mail size={18} />} type="email" value={email} onChange={setEmail} placeholder="john@example.com" />
              <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg">
                Finish Setup
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const LangChip: React.FC<{ active: boolean, onClick: () => void, label: string }> = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-black transition-all border ${
      active ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
    }`}
  >
    {label}
  </button>
);

const ConsentToggle: React.FC<{ active: boolean, title: string, description: string, icon: React.ReactNode, onToggle: () => void }> = ({ active, title, description, icon, onToggle }) => (
  <button 
    onClick={onToggle}
    className={`w-full p-6 border rounded-[24px] text-left transition-all flex gap-4 ${active ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-950 border-slate-800'}`}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500'}`}>
      {icon}
    </div>
    <div className="flex-1 space-y-1">
      <h4 className={`font-black text-sm ${active ? 'text-white' : 'text-slate-400'}`}>{title}</h4>
      <p className="text-xs text-slate-500 font-medium leading-relaxed">{description}</p>
    </div>
  </button>
);

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string, color: string }> = ({ icon, title, description, color }) => (
  <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[32px] transition-all group hover:bg-slate-900">
    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 mb-6 w-fit">{icon}</div>
    <h3 className="text-xl font-black text-white mb-2">{title}</h3>
    <p className="text-slate-500 text-sm font-medium leading-relaxed">{description}</p>
  </div>
);

const RoleCard: React.FC<{ icon: React.ReactNode, title: string, onClick: () => void, color: string }> = ({ icon, title, onClick, color }) => {
  const colorClasses: any = {
    indigo: 'bg-indigo-600',
    amber: 'bg-amber-600',
    emerald: 'bg-emerald-600',
    blue: 'bg-blue-600'
  };

  return (
    <button onClick={onClick} className="p-5 border border-slate-800 rounded-[28px] text-left transition-all bg-slate-900/50 flex items-center gap-4 hover:border-indigo-500/50 group">
      <div className={`${colorClasses[color] || 'bg-indigo-600'} p-3 rounded-xl text-white shadow-lg`}>{icon}</div>
      <h3 className="font-black text-lg text-white">{title}</h3>
    </button>
  );
};

const InputGroup: React.FC<{ label: string, icon: React.ReactNode, value: string, onChange: (v: string) => void, placeholder: string, type?: string }> = ({ label, icon, value, onChange, placeholder, type = 'text' }) => (
  <div className="space-y-1.5 text-left">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors">
        {icon}
      </div>
      <input 
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-slate-200 outline-none focus:border-indigo-500 transition-all"
      />
    </div>
  </div>
);
