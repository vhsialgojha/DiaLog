
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
// Added ProcessingPurpose to imports
import { LogType, HealthLog, ProcessingPurpose } from '../types';
import { 
  FileText, 
  Camera, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  ArrowLeft,
  ListFilter,
  ChevronRight,
  Plus,
  Droplet,
  Zap,
  Clock,
  Utensils,
  Activity,
  Smile,
  // Fix: Added missing BrainCircuit import
  BrainCircuit
} from 'lucide-react';

interface ReportScannerProps {
  onAddLog: (log: Omit<HealthLog, 'id' | 'timestamp'>) => void;
  onClose: () => void;
}

interface ExtractedLog {
  type: LogType;
  value: string;
  unit: string;
  notes: string;
  selected: boolean;
}

export const ReportScanner: React.FC<ReportScannerProps> = ({ onAddLog, onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedLogs, setExtractedLogs] = useState<ExtractedLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setExtractedLogs([]);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!image) return;
    setIsScanning(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: 'image/jpeg'
                }
              },
              {
                text: `Analyze this medical lab report or health document. 
                Extract all relevant health metrics into a list of logs. 
                
                CATEGORIZATION RULES:
                - GLUCOSE: Use for Blood Sugar, Fasting Glucose, HbA1c, or glucose tolerance tests.
                - INSULIN: Use for any insulin dosages or types mentioned.
                - MEDICINE: Use for non-insulin medications (e.g., Metformin, Lisinopril), dosages, and frequency.
                - MEAL: Use for nutrition data like carb counts, calories, or weight if specifically mentioned in a nutritional context.
                - EXERCISE: Use for activity levels, step counts, or exercise frequency.
                - MOOD: Use for mental health assessments or self-reported stress levels.

                Be highly accurate with values and units. For notes, include the specific test name (e.g., "HbA1c Level"). Return only the JSON list.`
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { 
                  type: Type.STRING, 
                  enum: ['GLUCOSE', 'MEAL', 'INSULIN', 'EXERCISE', 'MOOD', 'MEDICINE'] 
                },
                value: { type: Type.STRING },
                unit: { type: Type.STRING },
                notes: { type: Type.STRING }
              },
              required: ['type', 'value', 'unit']
            }
          }
        }
      });

      const data = JSON.parse(response.text || '[]');
      setExtractedLogs(data.map((log: any) => ({ ...log, selected: true })));
      if (data.length === 0) {
        setError("No clear health data points were identified in this document.");
      }
    } catch (err) {
      console.error(err);
      setError("AI analysis failed. Please ensure the document is clear and contains medical data.");
    } finally {
      setIsScanning(false);
    }
  };

  const toggleLogSelection = (index: number) => {
    setExtractedLogs(prev => prev.map((log, i) => 
      i === index ? { ...log, selected: !log.selected } : log
    ));
  };

  const handleSaveAll = () => {
    const selected = extractedLogs.filter(l => l.selected);
    selected.forEach(log => {
      onAddLog({
        type: log.type,
        value: log.value,
        unit: log.unit,
        notes: log.notes,
        // Fix: metadata now includes mandatory consentVersion and purpose fields to satisfy HealthLog type
        metadata: { 
          source: 'REPORT_AI_SCAN',
          consentVersion: '',
          purpose: []
        }
      });
    });
    onClose();
  };

  const getLogIcon = (type: LogType) => {
    switch (type) {
      case LogType.GLUCOSE: return <Droplet size={18} />;
      case LogType.INSULIN: return <Zap size={18} />;
      case LogType.MEDICINE: return <Clock size={18} />;
      case LogType.MEAL: return <Utensils size={18} />;
      case LogType.EXERCISE: return <Activity size={18} />;
      case LogType.MOOD: return <Smile size={18} />;
      default: return <FileText size={18} />;
    }
  };

  const getLogColorClasses = (type: LogType, selected: boolean) => {
    if (!selected) return 'bg-slate-950 border-slate-800 opacity-40 grayscale';
    
    switch (type) {
      case LogType.GLUCOSE: return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      case LogType.INSULIN: return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
      case LogType.MEDICINE: return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
      case LogType.MEAL: return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case LogType.EXERCISE: return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case LogType.MOOD: return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      default: return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
    }
  };

  const getBadgeColor = (type: LogType) => {
    switch (type) {
      case LogType.GLUCOSE: return 'bg-rose-500';
      case LogType.INSULIN: return 'bg-cyan-500';
      case LogType.MEDICINE: return 'bg-indigo-500';
      case LogType.MEAL: return 'bg-amber-500';
      case LogType.EXERCISE: return 'bg-emerald-500';
      case LogType.MOOD: return 'bg-purple-500';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900">
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-black text-white">Report AI Scan</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Lab & Document OCR</span>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!image ? (
          <div className="h-full flex flex-col items-center justify-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 bg-indigo-500/10 rounded-[40px] flex items-center justify-center text-indigo-400 border border-dashed border-indigo-500/30">
                <FileText size={48} />
              </div>
              <div className="absolute -top-2 -right-2 bg-indigo-600 p-2 rounded-full shadow-xl">
                <Sparkles size={16} className="text-white" />
              </div>
            </div>
            
            <div className="text-center space-y-2 max-w-xs mx-auto">
              <h3 className="text-2xl font-black text-white">Upload Lab Report</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Upload a photo of your blood test, lab results, or medical summary. DiaLog AI will extract and categorize the data points.
              </p>
            </div>

            <div className="w-full space-y-3 max-w-sm mx-auto">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-indigo-900/40 active:scale-95 transition-all"
              >
                <Camera size={24} /> Snap or Upload
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </div>

            <div className="flex items-center gap-2 text-emerald-500/60 bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck size={14} /> HIPAA Compliant AI Scan
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500 max-w-lg mx-auto w-full">
            {/* Image Preview with Scanning Animation */}
            <div className="relative rounded-[40px] overflow-hidden border border-slate-800 shadow-2xl aspect-[4/3] bg-slate-900">
              <img src={image} alt="Medical Report" className="w-full h-full object-cover opacity-60" />
              {isScanning && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="w-full h-1 bg-indigo-500 shadow-[0_0_20px_#6366f1] absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                  <style>{`
                    @keyframes scan {
                      0%, 100% { top: 0%; }
                      50% { top: 100%; }
                    }
                  `}</style>
                </div>
              )}
              <button 
                onClick={() => { setImage(null); setExtractedLogs([]); }}
                className="absolute top-4 right-4 p-2 bg-slate-950/80 rounded-full text-white hover:bg-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold">
                <AlertCircle size={20} /> {error}
              </div>
            )}

            {!extractedLogs.length && !isScanning && (
              <button 
                onClick={handleScan}
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-indigo-900/40 hover:bg-indigo-500 active:scale-95 transition-all"
              >
                <Sparkles size={24} /> Extract & Categorize
              </button>
            )}

            {isScanning && (
              <div className="p-8 text-center space-y-4">
                <div className="relative inline-block">
                   <Loader2 className="mx-auto animate-spin text-indigo-400" size={64} />
                   <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500/40" size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black text-white">Analyzing Report...</p>
                  <p className="text-slate-500 text-xs uppercase font-black tracking-widest">Identifying Metrics & Vitals</p>
                </div>
              </div>
            )}

            {extractedLogs.length > 0 && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
                <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                      <ListFilter size={18} className="text-indigo-400" />
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">AI Categorized Data</h4>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800">
                      {extractedLogs.length} Points
                    </span>
                  </div>

                  <div className="space-y-3">
                    {extractedLogs.map((log, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => toggleLogSelection(idx)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between relative group overflow-hidden ${getLogColorClasses(log.type, log.selected)}`}
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                            log.selected ? 'bg-slate-900/50 shadow-inner' : 'bg-slate-800 text-slate-600'
                          }`}>
                            {getLogIcon(log.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest text-white ${getBadgeColor(log.type)}`}>
                                {log.type}
                              </span>
                              <span className="text-[10px] font-bold opacity-60 italic truncate max-w-[120px]">
                                {log.notes}
                              </span>
                            </div>
                            <p className="font-black text-lg tracking-tight">
                              {log.value} <span className="text-xs font-bold opacity-70 ml-1">{log.unit}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center gap-2 relative z-10">
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            log.selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-800'
                          }`}>
                            {log.selected && <CheckCircle2 size={14} className="text-white" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {setExtractedLogs([]); setImage(null);}}
                    className="py-5 bg-slate-900 text-slate-400 border border-slate-800 rounded-3xl font-black transition-all hover:bg-slate-800 active:scale-95"
                  >
                    Rescan
                  </button>
                  <button 
                    onClick={handleSaveAll}
                    disabled={!extractedLogs.some(l => l.selected)}
                    className="py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-900/40 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    <CheckCircle2 size={20} /> Import Selected
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
