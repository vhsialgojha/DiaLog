
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, Modality, LiveServerMessage } from '@google/genai';
import { LogType, HealthLog, ProcessingPurpose } from '../types';
import { decode, decodeAudioData, encode, createBlob } from '../services/audioUtils';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  Pill, 
  ArrowLeft,
  Mic,
  MicOff,
  BrainCircuit,
  Volume2,
  VolumeX,
  User as UserIcon,
  Calendar,
  Stethoscope,
  History,
  Edit3
} from 'lucide-react';

interface PrescriptionScannerProps {
  onAddLog: (log: Omit<HealthLog, 'id' | 'timestamp'>) => void;
  onClose: () => void;
}

interface PrescriptionResult {
  medication: string;
  dosage: string;
  frequency: string;
  instructions: string;
  doctorName: string;
  patientName: string;
  patientAge: string;
  prescriptionDate: string;
}

export const PrescriptionScanner: React.FC<PrescriptionScannerProps> = ({ onAddLog, onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [result, setResult] = useState<PrescriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
        setIsEditing(false);
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
        model: 'gemini-3-flash-preview',
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
                text: "Extract FULL prescription details. Identify: 1. Medication Name, 2. Dosage (e.g. 500mg), 3. Frequency, 4. Detailed Instructions, 5. Prescribing Doctor's Name, 6. Patient's Full Name on sheet, 7. Patient's Age (if listed), 8. Date of the Prescription. Return as JSON."
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              medication: { type: Type.STRING },
              dosage: { type: Type.STRING },
              frequency: { type: Type.STRING },
              instructions: { type: Type.STRING },
              doctorName: { type: Type.STRING, description: "Name of the prescribing physician" },
              patientName: { type: Type.STRING, description: "Name of the patient on the prescription" },
              patientAge: { type: Type.STRING, description: "Age of patient if visible" },
              prescriptionDate: { type: Type.STRING, description: "Date when prescription was written" }
            },
            required: ['medication', 'dosage', 'frequency', 'doctorName', 'prescriptionDate']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please ensure the photo is clear and contains both doctor and medication details.");
    } finally {
      setIsScanning(false);
    }
  };

  const startVoiceSession = async () => {
    if (isVoiceActive) return;
    try {
      setError(null);
      setPartialTranscript('');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      await audioContextRef.current.resume();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are a medical scribe. Listen to the user dictate details of a prescription.
          Extract: medication name, dosage, frequency, instructions, doctor name, patient name, age, and date.
          Respond briefly to acknowledge (e.g., "Got it, extracting details...").
          Once you have gathered the key details, call the 'updatePrescription' tool.`,
          tools: [{
            functionDeclarations: [{
              name: 'updatePrescription',
              description: 'Updates the prescription form with extracted data from speech.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  medication: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  instructions: { type: Type.STRING },
                  doctorName: { type: Type.STRING },
                  patientName: { type: Type.STRING },
                  patientAge: { type: Type.STRING },
                  prescriptionDate: { type: Type.STRING }
                },
                required: ['medication', 'dosage', 'doctorName', 'prescriptionDate']
              }
            }]
          }],
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                if (session) session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
            setIsVoiceActive(true);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setPartialTranscript(prev => prev + ' ' + message.serverContent!.inputTranscription!.text);
            }
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'updatePrescription') {
                  setResult(fc.args as any);
                  stopVoiceSession();
                }
              }
            }
          },
          onerror: (e) => {
            console.error("Live session error", e);
            stopVoiceSession();
          },
          onclose: () => setIsVoiceActive(false),
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { 
      console.error(err);
      setError("Microphone access denied or session failed."); 
    }
  };

  const stopVoiceSession = () => {
    if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
    if (scriptProcessorRef.current) { scriptProcessorRef.current.disconnect(); scriptProcessorRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    setIsVoiceActive(false);
  };

  const handleResultChange = (field: keyof PrescriptionResult, value: string) => {
    if (!result) return;
    setResult({ ...result, [field]: value });
  };

  const handleSave = () => {
    if (!result) return;
    
    onAddLog({
      type: LogType.MEDICINE,
      value: `${result.medication} (${result.dosage})`,
      unit: result.frequency,
      notes: `Prescribed by: Dr. ${result.doctorName}\nPatient: ${result.patientName} (${result.patientAge || 'Age N/A'})\nPrescription Date: ${result.prescriptionDate}\n\nInstructions: ${result.instructions}`,
      metadata: { 
        source: isVoiceActive ? 'VOICE_DICTATION' : 'OCR_SCAN',
        consentVersion: 'v1.0-DPDP',
        purpose: [ProcessingPurpose.ADHERENCE_TRACKING]
      }
    });
    
    onClose();
  };

  const isPrescriptionOld = (dateStr: string) => {
    try {
      const pDate = new Date(dateStr);
      const now = new Date();
      if (isNaN(pDate.getTime())) return false;
      const diffMonths = (now.getFullYear() - pDate.getFullYear()) * 12 + (now.getMonth() - pDate.getMonth());
      return diffMonths > 6;
    } catch (e) { return false; }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-y-auto">
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-center text-center">
          <h2 className="text-lg font-black text-white">Smart Prescription Input</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">AI-Powered Extraction</span>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {!image && !isVoiceActive && !result && (
          <div className="h-full flex flex-col items-center justify-center space-y-8 py-12">
            <div className="w-32 h-32 bg-indigo-500/10 rounded-[40px] flex items-center justify-center text-indigo-400 border border-dashed border-indigo-500/30">
              <Camera size={48} />
            </div>
            <div className="text-center space-y-2 max-w-xs">
              <h3 className="text-2xl font-black text-white">Capture or Dictate</h3>
              <p className="text-slate-500 text-sm font-medium">Use your camera or voice to extract medication, doctor, and date details automatically.</p>
            </div>
            <div className="w-full space-y-4 max-w-sm">
              <button onClick={() => fileInputRef.current?.click()} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 shadow-xl">
                <Camera size={24} /> Scan Prescription Photo
              </button>
              <button onClick={startVoiceSession} className="w-full py-5 bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-800 active:scale-95 shadow-xl">
                <Mic size={24} className="text-indigo-400" /> Dictate Rx Details
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" capture="environment" />
            </div>
          </div>
        )}

        {isVoiceActive && (
          <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in py-12">
             <div className="relative">
                <div className="w-32 h-32 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 border-4 border-indigo-500/40 animate-pulse">
                   <Mic size={48} />
                </div>
                <Sparkles className="absolute -top-2 -right-2 text-indigo-400 animate-bounce" />
             </div>
             <div className="text-center space-y-2">
                <p className="text-xl font-black text-white">Listening...</p>
                <p className="text-slate-500 text-sm italic max-w-xs mx-auto">
                  "I was prescribed Metformin 500mg twice a day by Dr. Gupta yesterday..."
                </p>
             </div>
             {partialTranscript && (
               <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 w-full max-w-sm text-slate-400 text-center text-sm font-medium leading-relaxed italic">
                 "{partialTranscript.trim()}..."
               </div>
             )}
             <button onClick={stopVoiceSession} className="px-12 py-4 bg-rose-500 text-white rounded-2xl font-black shadow-xl active:scale-95">Stop Dictation</button>
          </div>
        )}

        {image && !result && (
          <div className="space-y-6 animate-in fade-in">
            <div className="relative rounded-[40px] overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 aspect-[4/3]">
              <img src={image} alt="Prescription" className="w-full h-full object-cover opacity-80" />
              {isScanning && (
                <div className="absolute inset-0 bg-indigo-500/10 flex flex-col items-center justify-center">
                  <div className="w-full h-1 bg-indigo-500 shadow-[0_0_20px_#6366f1] animate-[scan_2s_infinite]"></div>
                  <style>{`@keyframes scan { 0% { top: 0% } 50% { top: 100% } 100% { top: 0% } }`}</style>
                </div>
              )}
            </div>
            {!isScanning && (
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setImage(null)} className="py-5 bg-slate-900 text-slate-400 rounded-3xl font-black border border-slate-800">Clear</button>
                 <button onClick={handleScan} className="py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3">Extract AI</button>
              </div>
            )}
            {isScanning && (
              <div className="p-8 text-center space-y-4">
                <Loader2 className="mx-auto animate-spin text-indigo-400" size={48} />
                <p className="text-lg font-black text-white">Identifying Doctor & Medication...</p>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 pb-12 max-w-md mx-auto">
            {isPrescriptionOld(result.prescriptionDate) && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-500 text-xs font-bold">
                <AlertCircle size={18} /> This prescription appears to be over 6 months old.
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between mb-2">
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <CheckCircle2 size={16} className="text-emerald-500" /> Verify Details
                 </h4>
                 <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                 >
                   <Edit3 size={18} />
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-6">
                <Field label="Doctor" icon={<Stethoscope size={12} />} value={result.doctorName} editing={isEditing} onChange={(v) => handleResultChange('doctorName', v)} />
                <Field label="Issued On" icon={<Calendar size={12} />} value={result.prescriptionDate} editing={isEditing} onChange={(v) => handleResultChange('prescriptionDate', v)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Patient" icon={<UserIcon size={12} />} value={result.patientName} editing={isEditing} onChange={(v) => handleResultChange('patientName', v)} />
                <Field label="Age" icon={<History size={12} />} value={result.patientAge} editing={isEditing} onChange={(v) => handleResultChange('patientAge', v)} />
              </div>

              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400"><Pill size={24} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Medication</p>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={result.medication} 
                        onChange={(e) => handleResultChange('medication', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                      />
                    ) : (
                      <h4 className="text-xl font-black text-white">{result.medication}</h4>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Dosage</p>
                      {isEditing ? (
                        <input type="text" value={result.dosage} onChange={(e) => handleResultChange('dosage', e.target.value)} className="w-full bg-transparent border-none p-0 text-white font-bold outline-none" />
                      ) : (
                        <p className="font-bold text-slate-200">{result.dosage}</p>
                      )}
                   </div>
                   <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Frequency</p>
                      {isEditing ? (
                        <input type="text" value={result.frequency} onChange={(e) => handleResultChange('frequency', e.target.value)} className="w-full bg-transparent border-none p-0 text-white font-bold outline-none" />
                      ) : (
                        <p className="font-bold text-slate-200">{result.frequency}</p>
                      )}
                   </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Instructions</p>
                  {isEditing ? (
                    <textarea value={result.instructions} onChange={(e) => handleResultChange('instructions', e.target.value)} className="w-full bg-transparent border-none p-0 text-white text-xs outline-none h-16 resize-none" />
                  ) : (
                    <p className="text-xs text-slate-400 italic">"{result.instructions}"</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => {setResult(null); setImage(null); setIsEditing(false);}} className="py-5 bg-slate-900 text-slate-400 rounded-3xl font-black border border-slate-800">Discard</button>
              <button onClick={handleSave} className="py-5 bg-emerald-600 text-white rounded-3xl font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/20 active:scale-95">
                <CheckCircle2 size={20} /> Confirm & Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string, icon: React.ReactNode, value: string, editing: boolean, onChange: (v: string) => void }> = ({ label, icon, value, editing, onChange }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">{icon} {label}</p>
    {editing ? (
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs font-bold"
      />
    ) : (
      <p className="font-bold text-slate-100 text-sm truncate">{value || 'N/A'}</p>
    )}
  </div>
);
