
import React, { useState } from 'react';
import { 
  X, 
  Shield, 
  BookOpen, 
  Scale, 
  Cpu, 
  ArrowLeft, 
  ExternalLink, 
  Lock, 
  Fingerprint, 
  Info,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { AppLanguage } from '../types';
import { translations } from '../translations';

interface InformationPortalProps {
  initialPage?: 'privacy' | 'terms' | 'rights' | 'ai';
  language: AppLanguage;
  onClose: () => void;
}

type PortalPage = 'privacy' | 'terms' | 'rights' | 'ai';

export const InformationPortal: React.FC<InformationPortalProps> = ({ initialPage = 'privacy', language, onClose }) => {
  const [currentPage, setCurrentPage] = useState<PortalPage>(initialPage);
  const t = translations[language];

  const pages = [
    { id: 'privacy', label: t.footerPrivacy, icon: <Shield size={18} /> },
    { id: 'rights', label: t.footerRights, icon: <Fingerprint size={18} /> },
    { id: 'terms', label: t.footerTerms, icon: <Scale size={18} /> },
    { id: 'ai', label: t.footerAI, icon: <Cpu size={18} /> }
  ];

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950 flex flex-col md:flex-row animate-in fade-in duration-300">
      {/* Sidebar Nav */}
      <div className="w-full md:w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <BookOpen size={20} />
            </div>
            <h2 className="font-black text-white text-xl">Info Portal</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white md:hidden">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {pages.map(page => (
            <button
              key={page.id}
              onClick={() => setCurrentPage(page.id as PortalPage)}
              className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all font-bold text-sm ${
                currentPage === page.id 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-500 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {page.icon}
                {page.label}
              </div>
              <ChevronRight size={14} className={currentPage === page.id ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-800 hidden md:block">
           <button onClick={onClose} className="flex items-center gap-2 text-slate-500 font-bold hover:text-white transition-colors">
             <ArrowLeft size={18} /> {t.home}
           </button>
        </div>
      </div>

      {/* Main Reading Area */}
      <div className="flex-1 overflow-y-auto p-8 md:p-16 bg-slate-950 custom-scrollbar">
        <div className="max-w-2xl mx-auto space-y-12 animate-in slide-in-from-right-8 duration-500">
          {currentPage === 'privacy' && <PrivacyContent language={language} />}
          {currentPage === 'rights' && <RightsContent language={language} />}
          {currentPage === 'terms' && <TermsContent language={language} />}
          {currentPage === 'ai' && <AIContent language={language} />}
        </div>
      </div>
    </div>
  );
};

const PrivacyContent: React.FC<{ language: AppLanguage }> = ({ language }) => (
  <article className="prose prose-invert prose-slate max-w-none">
    <h1 className="text-4xl font-black text-white mb-8">Privacy Policy (DPDP 2023)</h1>
    <p className="text-slate-400 leading-relaxed text-lg">
      Your privacy is governed by the Digital Personal Data Protection Act (DPDP) 2023. DiaLog acts as a Data Fiduciary for your health metrics.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-12">
      <InfoCard icon={<Lock className="text-emerald-400" />} title="Data Storage" desc="All logs are stored locally on your device or in encrypted cloud instances within India." />
      <InfoCard icon={<Shield className="text-indigo-400" />} title="Processing Purpose" desc="Data is processed solely for monitoring glucose stability and providing metabolic insights." />
    </div>

    <section className="space-y-6">
      <h2 className="text-2xl font-black text-white">1. Data Collection</h2>
      <p className="text-slate-400">We collect glucose levels, medication dosages, and dietary information through manual entry and AI scanning of reports.</p>
      
      <h2 className="text-2xl font-black text-white">2. Consent Management</h2>
      <p className="text-slate-400">Your consent is specific, informed, and unconditional. You can withdraw consent for AI analysis at any time via the Privacy Center.</p>
    </section>
  </article>
);

const RightsContent: React.FC<{ language: AppLanguage }> = ({ language }) => (
  <article className="prose prose-invert prose-slate max-w-none">
    <h1 className="text-4xl font-black text-white mb-8">Your Data Rights</h1>
    <p className="text-slate-400 text-lg">As a "Data Principal" under Indian law, you hold several inalienable rights over your personal health information.</p>
    
    <div className="space-y-8 mt-12">
      <RightItem title="Right to Correction" desc="Request modification of inaccurate logs or profiles." />
      <RightItem title="Right to Erasure" desc="Complete 'Right to be Forgotten'—delete your health history and account instantly." />
      <RightItem title="Right to Grievance Redressal" desc="Access to a designated Data Protection Officer for privacy concerns." />
      <RightItem title="Right to Nominate" desc="Designate a legal heir or caregiver to manage your data in the event of incapacity." />
    </div>
  </article>
);

const AIContent: React.FC<{ language: AppLanguage }> = ({ language }) => (
  <article className="prose prose-invert prose-slate max-w-none">
    <h1 className="text-4xl font-black text-white mb-8 flex items-center gap-4">
      <Sparkles className="text-indigo-400" /> AI Ethics & Disclosure
    </h1>
    <p className="text-slate-400 text-lg">DiaLog utilizes Gemini 3.0 advanced reasoning to analyze your metabolic trends.</p>
    
    <div className="p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-[32px] my-12 space-y-4">
      <h3 className="text-indigo-400 font-black uppercase text-xs tracking-widest">Important Disclaimer</h3>
      <p className="text-white font-bold leading-relaxed">
        DiaLog AI is an assistant, not a medical professional. Never change your medication dosage based solely on AI insights. Always consult your prescribing doctor.
      </p>
    </div>

    <section className="space-y-6">
      <h2 className="text-2xl font-black text-white">How it works</h2>
      <p className="text-slate-400">Our models are trained to identify glycemic patterns like the "Dawn Phenomenon" or post-prandial spikes. The analysis happens in transient memory to minimize data exposure.</p>
    </section>
  </article>
);

const TermsContent: React.FC<{ language: AppLanguage }> = ({ language }) => (
  <article className="prose prose-invert prose-slate max-w-none">
    <h1 className="text-4xl font-black text-white mb-8">Terms of Service</h1>
    <p className="text-slate-400 text-lg">By using DiaLog, you agree to these fundamental rules of engagement.</p>
    <section className="space-y-8 mt-12">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">No Medical Advice</h3>
        <p className="text-slate-500 italic">This app provides tracking and educational insights only.</p>
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Account Responsibility</h3>
        <p className="text-slate-500">You are responsible for maintaining the security of your phone number and OTP access.</p>
      </div>
    </section>
  </article>
);

const InfoCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
    {icon}
    <h4 className="font-black text-white">{title}</h4>
    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const RightItem: React.FC<{ title: string, desc: string }> = ({ title, desc }) => (
  <div className="flex gap-4 p-6 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all group">
    <div className="w-1.5 h-12 bg-indigo-600 rounded-full group-hover:scale-y-110 transition-transform"></div>
    <div>
      <h4 className="font-black text-white text-lg">{title}</h4>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const TermsItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs">
    <span className="font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    <span className="font-black text-slate-200">{value}</span>
  </div>
);
