import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, Volume2, X, ExternalLink, Settings, HelpCircle, ChevronRight, Lock } from 'lucide-react';
import { RecipeDetail } from '../types';

interface LiveChefAssistantProps {
  recipe: RecipeDetail;
}

// --- Audio Helper Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const LiveChefAssistant: React.FC<LiveChefAssistantProps> = ({ recipe }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [volume, setVolume] = useState(0);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Initialize AI Client
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
    return () => stopSession();
  }, []);

  const stopSession = () => {
    setIsActive(false);
    setIsConnecting(false);
    setVolume(0);
    // Don't clear error message on stop so user can see it

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { }
    });
    sourcesRef.current.clear();

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
  };

  const checkPermissions = async (): Promise<string | null> => {
    try {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isInApp = /(FBAN|FBAV|Instagram|Line|LinkedIn|wv)/i.test(ua);

      if (isInApp) {
        return "Open in Safari/Chrome";
      }

      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'microphone' as any });
        if (status.state === 'denied') {
          return "Mic Denied (Tap for Help)";
        }
      }
    } catch (e) { }
    return null;
  };

  const startSession = async () => {
    // If we have an error and user clicks, show help instead of retrying blindly
    if (errorMessage) {
      setShowHelp(true);
      return;
    }

    try {
      setErrorMessage(null);
      setShowHelp(false);

      const permError = await checkPermissions();
      if (permError) {
        setErrorMessage(permError);
        setShowHelp(true);
        return;
      }

      if (!window.isSecureContext) {
        setErrorMessage("HTTPS Required");
        setShowHelp(true);
        return;
      }
      if (!process.env.API_KEY) {
        setErrorMessage("API Key Missing");
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage("Mic Not Supported");
        setShowHelp(true);
        return;
      }

      // 1. Immediate Native Mic Request 
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      streamRef.current = stream;
      setIsConnecting(true);

      // 2. Init Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 24000 });
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });

      audioContextRef.current = audioCtx;
      inputAudioContextRef.current = inputCtx;

      await audioCtx.resume();
      await inputCtx.resume();

      nextStartTimeRef.current = audioCtx.currentTime;

      // 3. Connect to AI
      const config = {
        model: 'gemini-2.0-flash-exp',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `You are a helpful executive chef guiding the user to cook "${recipe.name}". Keep answers short and conversational.`,
        },
      };

      const session = await ai.live.connect({
        ...config,
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);

            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              session.sendRealtimeInput({ media: pcmBlob });

              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolume(Math.sqrt(sum / inputData.length));
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);

            sourceNodeRef.current = source;
            processorRef.current = processor;
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                audioCtx,
                24000, 1
              );

              const source = audioCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioCtx.destination);

              const startTime = Math.max(audioCtx.currentTime, nextStartTimeRef.current);
              source.start(startTime);
              nextStartTimeRef.current = startTime + audioBuffer.duration;

              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
          },
          onclose: () => stopSession(),
          onerror: (err) => {
            console.error(err);
            stopSession();
            setErrorMessage("Connection Lost");
          }
        }
      });

      sessionRef.current = session;

    } catch (e: any) {
      console.error(e);
      setIsConnecting(false);
      setIsActive(false);

      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setErrorMessage("Mic Denied (Tap Help)");
        setShowHelp(true);
      } else if (e.name === 'NotFoundError') {
        setErrorMessage("No Mic Found");
      } else if (e.name === 'NotReadableError') {
        setErrorMessage("Mic Busy");
      } else {
        setErrorMessage(`Err: ${e.name?.substring(0, 10) || 'Unknown'}`);
      }
    }
  };

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, rate: number, channels: number) {
    const dataInt16 = new Int16Array(data.buffer);
    const float32 = new Float32Array(dataInt16.length);
    for (let i = 0; i < dataInt16.length; i++) float32[i] = dataInt16[i] / 32768;

    const buffer = ctx.createBuffer(channels, float32.length, rate);
    buffer.getChannelData(0).set(float32);
    return buffer;
  }

  // --- RENDER HELP MODAL ---
  const renderHelpModal = () => (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
        <button
          onClick={() => setShowHelp(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-serif text-culinary-gold mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" /> Unlock Application
        </h3>

        <div className="space-y-4 text-sm text-zinc-300 font-sans">
          <p>Your browser has blocked microphone access.</p>

          <div className="bg-black/50 p-4 rounded-lg border border-zinc-800">
            <strong className="text-white block mb-2 uppercase text-xs tracking-wider">How to fix it:</strong>
            <ol className="list-decimal list-inside space-y-2">
              <li>Tap the <Lock className="w-3 h-3 inline mx-1" /> <strong>Lock Icon</strong> in the URL bar (top or bottom).</li>
              <li>Tap <strong>Permissions</strong> or <strong>Site Settings</strong>.</li>
              <li>Find <strong>Microphone</strong> and switch it to <strong>Allow</strong>.</li>
              <li>Tap <strong>Reset Permissions</strong> if Allow isn't there.</li>
            </ol>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-culinary-gold text-culinary-dark py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-yellow-500 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isActive) {
    return (
      <>
        {showHelp && renderHelpModal()}
        <button
          onClick={startSession}
          disabled={isConnecting}
          className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl transition-all duration-300 group disabled:opacity-70 disabled:cursor-wait ${errorMessage ? 'bg-red-500 text-white animate-pulse' : 'bg-culinary-gold text-culinary-dark hover:scale-105'
            }`}
        >
          {isConnecting ? (
            <>
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="font-bold font-serif uppercase tracking-widest">Connecting...</span>
            </>
          ) : errorMessage === "Open in Safari/Chrome" ? (
            <>
              <ExternalLink className="w-6 h-6" />
              <span className="font-bold font-serif uppercase tracking-widest text-xs">Open in System Browser</span>
            </>
          ) : errorMessage ? (
            <>
              <Settings className="w-6 h-6" />
              <span className="font-bold font-serif uppercase tracking-widest text-xs">{errorMessage}</span>
            </>
          ) : (
            <>
              <Mic className="w-6 h-6" />
              <span className="font-bold font-serif uppercase tracking-widest">Ask Chef</span>
            </>
          )}
        </button>
      </>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center gap-4 bg-black/90 backdrop-blur-xl border border-culinary-gold/50 p-2 pr-6 rounded-full shadow-2xl animate-in slide-in-from-bottom-10">
      <button
        onClick={stopSession}
        className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-full transition-colors border border-red-500/30"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col">
        <span className="text-culinary-gold font-bold uppercase tracking-widest text-xs flex items-center gap-2">
          Chef Live
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        </span>
      </div>

      {/* Simple Visualizer */}
      <div className="flex gap-0.5 items-end h-6 ml-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="w-1 bg-culinary-gold rounded-full transition-all duration-75"
            style={{ height: `${Math.max(4, volume * 100 * Math.random() * 20)}px` }}
          />
        ))}
      </div>
    </div>
  );
};

export default LiveChefAssistant;