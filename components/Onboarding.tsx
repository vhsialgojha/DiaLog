
import React, { useState } from 'react';
import { 
  Activity, 
  Mic, 
  Droplet, 
  ShieldCheck, 
  ChevronRight, 
  BrainCircuit,
  Sparkles,
  Pill,
  Zap
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Control your sugar.",
      description: "A specialized AI companion designed specifically for strict glucose management and medical adherence.",
      icon: <div className="bg-rose-500 p-6 rounded-3xl text-white shadow-2xl shadow-rose-500/30"><Droplet size={48} /></div>,
      color: "rose"
    },
    {
      title: "Log Sugar & Meds",
      description: "Record your levels and confirm medication doses effortlessly via voice. AI cross-checks your adherence daily.",
      icon: <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-2xl shadow-indigo-500/30"><Pill size={48} /></div>,
      color: "indigo"
    },
    {
      title: "Smart Treatment Scan",
      description: "Our AI scans your trends to identify medication timing gaps and metabolic spikes, ensuring your treatment stays on track.",
      icon: <div className="bg-amber-500 p-6 rounded-3xl text-white shadow-2xl shadow-amber-500/30"><BrainCircuit size={48} /></div>,
      color: "amber"
    },
    {
      title: "Secure Care Circle",
      description: "Privacy is paramount. Securely share your adherence reports with your doctor to improve your treatment plan.",
      icon: <div className="bg-emerald-500 p-6 rounded-3xl text-white shadow-2xl shadow-emerald-500/30"><ShieldCheck size={48} /></div>,
      color: "emerald"
    }
  ];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950 flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-slate-950 to-rose-500/5 pointer-events-none"></div>
      
      <div className="max-w-md w-full space-y-12 text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="flex justify-center">
          {currentStep.icon}
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-black text-slate-100 tracking-tight leading-tight">{currentStep.title}</h2>
          <p className="text-lg text-slate-400 font-medium leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        <div className="space-y-8">
          <div className="flex justify-center gap-2">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === step ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-800'
                }`}
              />
            ))}
          </div>

          <button 
            onClick={nextStep}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xl transition-all shadow-2xl shadow-indigo-900/40 flex items-center justify-center gap-3 active:scale-95"
          >
            {step === steps.length - 1 ? 'Start Monitoring' : 'Next Step'}
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
