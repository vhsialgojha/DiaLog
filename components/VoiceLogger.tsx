
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { TranscriptionItem, LogType, HealthLog, AppLanguage } from '../types';
import { saveReminder, getCurrentUser } from '../services/dataService';
import { decode, decodeAudioData, encode, createBlob } from '../services/audioUtils';
import { 
  Mic, 
  MicOff, 
  BrainCircuit, 
  XCircle, 
  Sparkles, 
  Loader2, 
  Activity, 
  CheckCircle2, 
  Volume2, 
  VolumeX,
  Pill, 
  BellRing, 
  Database,
  Square,
  Play,
  Droplet,
  Zap,
  Utensils
} from 'lucide-react';
import { GLUCOVITAL_MASTER_PROMPT } from '../constants';

interface VoiceLoggerProps {
  onLogCreated: (log: Omit<HealthLog, 'id' | 'timestamp'>) => void;
  onRefreshReminders: () => void;
}

const AudioVisualizer: React.FC<{ analyser: AnalyserNode | null; isActive: boolean }> = ({ analyser, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive || !analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 40;
      const barWidth = canvas.width / barCount;
      const spacing = 4;
      
      for (let i = 0; i < barCount; i++) {
        const index = Math.floor((i / barCount) * (bufferLength / 2));
        const value = dataArray[index];
        const percent = value / 255;
        const height = Math.max(4, percent * canvas.height);
        const y = (canvas.height - height) / 2;
        const x = i * barWidth;
        
        ctx.fillStyle = `rgba(99, 102, 241, ${0.3 + percent * 0.7})`;
        const bw = barWidth - spacing;
        
        ctx.beginPath();
        if ((ctx as any).roundRect) {
          (ctx as any).roundRect(x + spacing / 2, y, bw, height, 4);
        } else {
          ctx.rect(x + spacing / 2, y, bw, height);
        }
        ctx.fill();
      }
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isActive, analyser]);

  return (
    <div className="w-full h-16 bg-slate-900/40 rounded-3xl border border-slate-800/50 backdrop-blur-sm overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} width={600} height={64} className="w-full h-full" />
    </div>
  );
};

const useGeminiLive = (onLogCreated: (log: any) => void, onRefreshReminders: () => void) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [partialInput, setPartialInput] = useState('');
  const [partialOutput, setPartialOutput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  
  const user = getCurrentUser();
  const userLang = user?.language || 'en';

  const onLogCreatedRef = useRef(onLogCreated);
  const onRefreshRemindersRef = useRef(onRefreshReminders);
  const ttsSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    onLogCreatedRef.current = onLogCreated;
    onRefreshRemindersRef.current = onRefreshReminders;
  }, [onLogCreated, onRefreshReminders]);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const currentInputText = useRef('');
  const currentOutputText = useRef('');

  const logDataTool: FunctionDeclaration = {
    name: 'logData',
    parameters: {
      type: Type.OBJECT,
      description: 'MANDATORY: Log health data mentioned by the user immediately.',
      properties: {
        type: { 
          type: Type.STRING, 
          enum: ['GLUCOSE', 'MEAL', 'INSULIN', 'EXERCISE', 'MOOD', 'MEDICINE'],
          description: 'The category of health data.' 
        },
        value: { type: Type.STRING, description: 'The specific numeric value or meal description.' },
        unit: { type: Type.STRING, description: 'The unit (mg/dL, grams, units, minutes).' },
        notes: { type: Type.STRING, description: 'Additional context.' }
      },
      required: ['type', 'value'],
    },
  };

  const setReminderTool: FunctionDeclaration = {
    name: 'setReminder',
    parameters: {
      type: Type.OBJECT,
      description: 'Set a future reminder for insulin or medicine.',
      properties: {
        time: { type: Type.STRING, description: 'Time in HH:mm (24h format).' },
        label: { type: Type.STRING, description: 'Reminder message.' },
        type: { type: Type.STRING, enum: ['INSULIN', 'MEDICINE'], description: 'Category.' },
        doctorName: { type: Type.STRING, description: "Doctor who prescribed it." },
        prescriptionDate: { type: Type.STRING, description: "Date of the prescription." }
      },
      required: ['time', 'label', 'type'],
    },
  };

  const stopTTS = () => {
    if (ttsSourceRef.current) {
      try {
        ttsSourceRef.current.stop();
      } catch (e) {}
      ttsSourceRef.current = null;
      setIsSpeaking(null);
    }
  };

  const playSpeech = async (text: string, index: number) => {
    if (isSpeaking === index) {
      stopTTS();
      return;
    }
    
    stopTTS();
    setIsSpeaking(index);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!outAudioContextRef.current) {
          outAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = outAudioContextRef.current;
        await ctx.resume();
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.addEventListener('ended', () => {
          if (ttsSourceRef.current === source) {
            setIsSpeaking(null);
            ttsSourceRef.current = null;
          }
        });
        source.start();
        ttsSourceRef.current = source;
      } else {
        setIsSpeaking(null);
      }
    } catch (err) {
      console.error("Speech playback error:", err);
      setIsSpeaking(null);
    }
  };

  const startSession = async () => {
    if (isActive) return;
    try {
      setError(null);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      outAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      await audioContextRef.current.resume();
      await outAudioContextRef.current.resume();

      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: GLUCOVITAL_MASTER_PROMPT + `\n\nUSER PREFERENCE: Primary language is ${userLang.toUpperCase()}.
          Please converse primarily in this language but remain flexible if the user switches.
          ADHERENCE CHECK: If someone logs sugar, ask "Have you taken your medication today?" in their language.
          PRESCRIPTION LOGGING: When logging medicine via voice, try to extract the doctor's name and the prescription date mentioned by the user.`,
          tools: [{ functionDeclarations: [logDataTool, setReminderTool] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
        callbacks: {
          onopen: () => {
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            source.connect(analyser);

            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              setAudioLevel(Math.sqrt(sum / inputData.length));
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
            setIsActive(true);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.find(p => p.inlineData)?.inlineData?.data;
            if (base64Audio && outAudioContextRef.current && !isMuted) {
              const ctx = outAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentInputText.current += text;
              setPartialInput(currentInputText.current);
            }
            if (message.serverContent?.outputTranscription) { 
              const text = message.serverContent.outputTranscription.text;
              currentOutputText.current += text; 
              setPartialOutput(currentOutputText.current);
              setIsAiThinking(true); 
            }

            if (message.serverContent?.turnComplete) {
              if (currentInputText.current) {
                setTranscriptions(prev => [...prev, { sender: 'user', text: currentInputText.current, timestamp: Date.now() }]);
              }
              if (currentOutputText.current) {
                setTranscriptions(prev => [...prev, { sender: 'ai', text: currentOutputText.current, timestamp: Date.now() }]);
              }
              currentInputText.current = ''; 
              currentOutputText.current = ''; 
              setPartialInput('');
              setPartialOutput('');
              setIsAiThinking(false);
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'logData') {
                  const logType = (fc.args.type as string).toUpperCase() as LogType;
                  const logPayload = {
                    ...fc.args,
                    type: logType,
                    value: String(fc.args.value)
                  };
                  onLogCreatedRef.current(logPayload);
                  
                  setTranscriptions(prev => [...prev, { 
                    sender: 'ai', 
                    text: `[SYSTEM] Logged: ${fc.args.value} ${fc.args.unit || ''} (${logType.toLowerCase()}).`, 
                    timestamp: Date.now() 
                  }]);

                  sessionPromise.then(session => {
                    session.sendToolResponse({ 
                      functionResponses: { id: fc.id, name: fc.name, response: { result: `Success.` } } 
                    });
                  });
                } else if (fc.name === 'setReminder') {
                  saveReminder({ 
                    time: fc.args.time as string, 
                    label: fc.args.label as string, 
                    type: (fc.args.type as string).toUpperCase() as any, 
                    repeat: false 
                  });
                  onRefreshRemindersRef.current();

                  const extraInfo = (fc.args.doctorName) ? ` Prescribed by Dr. ${fc.args.doctorName}.` : '';

                  setTranscriptions(prev => [...prev, { 
                    sender: 'ai', 
                    text: `[SYSTEM] Reminder set for ${fc.args.time}.${extraInfo}`, 
                    timestamp: Date.now() 
                  }]);

                  sessionPromise.then(session => {
                    session.sendToolResponse({ 
                      functionResponses: { id: fc.id, name: fc.name, response: { result: `Reminder active.` } } 
                    });
                  });
                }
              }
            }

            if (message.serverContent?.interrupted) { 
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch (e) {}
              }); 
              sourcesRef.current.clear(); 
              nextStartTimeRef.current = 0; 
              setIsAiThinking(false);
              setPartialOutput('');
            }
          },
          onerror: (e) => {
            console.error("Gemini Live Error:", e);
            setError("Session issue. Restarting...");
            stopSession();
          },
          onclose: () => {
            setIsActive(false);
          },
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { 
      console.error("Mic Error:", err);
      setError("Mic required for voice."); 
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsActive(false);
    setPartialInput('');
    setPartialOutput('');
    setAudioLevel(0);
  };

  return { isActive, isMuted, setIsMuted, startSession, stopSession, transcription: transcriptions, isAiThinking, error, partialInput, partialOutput, audioLevel, analyser: analyserRef.current, playSpeech, isSpeaking, stopTTS };
};

export const VoiceLogger: React.FC<VoiceLoggerProps> = ({ onLogCreated, onRefreshReminders }) => {
  const { isActive, isMuted, setIsMuted, startSession, stopSession, transcription, isAiThinking, error, partialInput, partialOutput, audioLevel, analyser, playSpeech, isSpeaking, stopTTS } = useGeminiLive(onLogCreated, onRefreshReminders);
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();
  const lang = user?.language || 'en';

  useEffect(() => { 
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
    }
  }, [transcription, isAiThinking, partialInput, partialOutput]);

  useEffect(() => {
    return () => {
      stopSession();
      stopTTS();
    };
  }, []);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-250px)] space-y-4">
      <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar" ref={scrollRef}>
        {transcription.length === 0 && !isActive && !partialInput && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-8">
            <div className="relative">
              <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 animate-pulse border border-indigo-500/20">
                <Mic size={48} />
              </div>
              <Sparkles className="absolute -top-2 -right-2 text-indigo-400 animate-bounce" size={24} />
            </div>
            <div className="max-w-xs">
              <h2 className="text-2xl font-black text-slate-100 mb-2">DiaLog Voice</h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Prioritize sugar level logs and medicine adherence with AI.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              <ExampleChip text={lang === 'hi' ? '"शुगर लेवल १२५ लॉग करो"' : '"Log sugar level 125"'} icon={<Droplet size={12}/>} />
              <ExampleChip text={lang === 'hi' ? '"रात ९ बजे मेटफोर्मिन की याद दिलाओ"' : '"Remind me Metformin at 9 PM"'} icon={<Pill size={12}/>} />
            </div>
          </div>
        )}
        
        {transcription.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-[24px] p-5 shadow-xl group relative ${
              msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
            }`}>
              <p className="leading-relaxed font-medium">{msg.text}</p>
              {msg.sender === 'ai' && (
                <button 
                  onClick={() => playSpeech(msg.text, idx)}
                  className={`mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all px-3 py-1.5 rounded-lg border ${
                    isSpeaking === idx ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
                >
                  {isSpeaking === idx ? <Square size={10} /> : <Play size={10} />}
                  <span>{isSpeaking === idx ? 'Stop' : 'Play'}</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {partialInput && (
           <div className="flex justify-end">
            <div className="max-w-[85%] rounded-[24px] rounded-tr-none p-5 shadow-xl bg-indigo-600/40 text-white/90 italic backdrop-blur-md">
              <p className="text-sm leading-relaxed font-medium">{partialInput}</p>
            </div>
          </div>
        )}

        {partialOutput && (
           <div className="flex justify-start">
            <div className="max-w-[85%] rounded-[24px] rounded-tl-none p-5 shadow-xl bg-slate-900/80 border border-slate-800 text-slate-300 italic backdrop-blur-md">
              <p className="text-sm leading-relaxed font-medium">{partialOutput}</p>
            </div>
          </div>
        )}
      </div>

      {isActive && <AudioVisualizer analyser={analyser} isActive={isActive} />}

      <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-3.5 h-3.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
            <div>
              <span className="text-sm font-bold text-slate-100 block">DiaLog Live ({lang.toUpperCase()})</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">{isActive ? 'Listening...' : 'Tap to start'}</span>
            </div>
          </div>
          <button 
            onClick={isActive ? stopSession : startSession} 
            className={`px-8 py-3.5 rounded-2xl font-black transition-all flex items-center gap-2 text-sm min-w-[150px] justify-center ${
              isActive ? 'bg-rose-500 text-white shadow-rose-900/40' : 'bg-indigo-600 text-white shadow-indigo-900/40'
            }`}
          >
            {isActive ? <MicOff size={20} /> : <Mic size={20} />}
            <span>{isActive ? 'Stop' : 'Start Session'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ExampleChip: React.FC<{ text: string, icon?: React.ReactNode }> = ({ text, icon }) => (
  <div className="bg-slate-800 text-slate-400 text-[10px] font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2">
    {icon}
    {text}
  </div>
);
