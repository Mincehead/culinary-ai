import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Camera, Image as ImageIcon, StopCircle, ChefHat, X, Loader, Bookmark, BookmarkCheck, Volume2, Pause, Play } from 'lucide-react';
import { generateChefReply } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { saveRecipe } from '../services/savedRecipesService';
import { generateSpeech } from '../services/elevenLabsService';

interface Message {
    role: 'user' | 'model';
    text?: string;
    image?: string; // base64
}

export const ChefAI: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: "Bonjour! I'm Chef Lumière, your personal culinary master. I've spent decades in Michelin-starred kitchens around the world, and I'm here to help you cook like a pro.\n\nBefore we begin - what's your experience level in the kitchen? Are you just starting out, comfortable with basics, or an experienced home cook looking to refine your skills?\n\nAnd show me what you're working with! I can analyze ingredients, suggest dishes, and even show you visual representations of plated meals. What would you like to create today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [listening, setListening] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [lastFrameCapture, setLastFrameCapture] = useState<number>(0);
    const [savingRecipe, setSavingRecipe] = useState<number | null>(null);
    const [savedRecipes, setSavedRecipes] = useState<Set<number>>(new Set());
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [showVoiceSelector, setShowVoiceSelector] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load available voices
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);

            // Load saved preference or set default
            const savedVoiceName = localStorage.getItem('preferredVoice');
            if (savedVoiceName) {
                const voice = voices.find(v => v.name === savedVoiceName);
                if (voice) setSelectedVoice(voice);
            } else {
                // Default to best available voice
                const defaultVoice = voices.find(v =>
                    v.name.toLowerCase().includes('male') ||
                    v.name.toLowerCase().includes('google') ||
                    v.name.toLowerCase().includes('natural')
                ) || voices[0];
                setSelectedVoice(defaultVoice);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    // Scroll to bottom on new message - DISABLED to prevent jumping on mobile
    // useEffect(() => {
    //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // }, [messages]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + (prev ? ' ' : '') + transcript);
                setListening(false);

                // Auto-send in Live Mode
                if (isLiveMode) {
                    setTimeout(() => {
                        setInput(transcript);
                        // Trigger send
                        const sendEvent = new Event('liveModeAutoSend');
                        window.dispatchEvent(sendEvent);
                    }, 500);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setListening(false);
            };

            recognitionRef.current.onend = () => {
                setListening(false);
                // Auto-restart in Live Mode
                if (isLiveMode) {
                    setTimeout(() => {
                        try {
                            recognitionRef.current?.start();
                            setListening(true);
                        } catch (e) {
                            // Ignore if already started
                        }
                    }, 100);
                }
            };
        }
    }, [isLiveMode]);

    // Assign camera stream to video element when both are ready
    useEffect(() => {
        if (cameraStream && videoRef.current) {
            console.log('[Camera] Assigning stream to video element');
            videoRef.current.srcObject = cameraStream;

            videoRef.current.play()
                .then(() => {
                    console.log('[Camera] ✅ Video playing successfully');
                })
                .catch(err => {
                    console.error('[Camera] ❌ Video play error:', err);
                });
        }
    }, [cameraStream, videoRef.current]);

    // Capture frame from video for AI analysis
    const captureFrame = (): string | null => {
        if (!videoRef.current || !canvasRef.current) return null;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas size to match video
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64 JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        console.log('[Camera] Frame captured');
        setLastFrameCapture(Date.now());

        return dataUrl;
    };

    // Auto-capture frames in Live Mode
    useEffect(() => {
        if (isLiveMode && cameraStream && videoRef.current) {
            console.log('[Camera] Starting auto-capture every 5 seconds');

            const interval = setInterval(() => {
                const frame = captureFrame();
                if (frame) {
                    setSelectedImage(frame);
                    console.log('[Camera] Frame auto-attached for next query');
                }
            }, 5000); // Capture every 5 seconds

            return () => clearInterval(interval);
        }
    }, [isLiveMode, cameraStream]);

    // Live Mode camera effect
    useEffect(() => {
        if (isLiveMode) {
            console.log('[Camera] Live Mode activated, requesting camera...');

            // Start camera with fallback
            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' }
                },
                audio: false
            };

            navigator.mediaDevices.getUserMedia(constraints)
                .then(stream => {
                    console.log('[Camera] ✅ Stream obtained:', stream);
                    console.log('[Camera] Video tracks:', stream.getVideoTracks());
                    setCameraStream(stream);
                })
                .catch(err => {
                    console.error('[Camera] ❌ Initial request failed:', err);

                    // Try again without facingMode constraint
                    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                        .then(stream => {
                            console.log('[Camera] ✅ Fallback stream obtained:', stream);
                            setCameraStream(stream);
                        })
                        .catch(fallbackErr => {
                            console.error('[Camera] ❌ Fallback failed:', fallbackErr);
                            alert('Camera access denied. Please check browser permissions.');
                            setIsLiveMode(false);
                        });
                });

            // Start continuous voice
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                    setListening(true);
                } catch (e) {
                    // Already started
                }
            }
        } else {
            // Stop camera
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                setCameraStream(null);
            }
            // Stop voice
            if (recognitionRef.current && listening) {
                recognitionRef.current.stop();
            }
        }

        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isLiveMode]);

    const toggleLiveMode = () => {
        setIsLiveMode(!isLiveMode);
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Voice input is not supported in this browser.");
            return;
        }

        if (listening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setListening(true);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async () => {
        if ((!input.trim() && !selectedImage) || loading) return;

        const newUserMsg: Message = { role: 'user', text: input, image: selectedImage || undefined };

        // Optimistic update
        const newHistory = [...messages, newUserMsg];
        setMessages(newHistory);
        setInput('');
        setSelectedImage(null);
        setLoading(true);

        try {
            // Transform history for Gemini
            // We need to map our local Message format to the API format
            // API expects parts: [{text: ...}, {inlineData: ...}]

            const apiHistory = newHistory.map(msg => {
                const parts: any[] = [];
                if (msg.text) parts.push({ text: msg.text });
                if (msg.image) {
                    // Extract base64 and mime
                    const mimeMatch = msg.image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
                    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
                    const data = msg.image.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

                    parts.push({
                        inlineData: {
                            mimeType: mimeType,
                            data: data
                        }
                    });
                }
                return { role: msg.role, parts };
            });

            const replyText = await generateChefReply(apiHistory);

            setMessages(prev => [...prev, { role: 'model', text: replyText }]);

            // Speak AI response in Live Mode
            if (isLiveMode && replyText) {
                speakText(replyText);
            }

        } catch (error: any) {
            console.error(error);
            const errorMessage = error.message || "I apologize, Chef. I had trouble processing that request. Please try again.";
            setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Listen for Live Mode auto-send events
    useEffect(() => {
        const handleAutoSend = () => {
            if (isLiveMode && input.trim()) {
                handleSend();
            }
        };
        window.addEventListener('liveModeAutoSend', handleAutoSend);
        return () => window.removeEventListener('liveModeAutoSend', handleAutoSend);
    }, [isLiveMode, input, messages, selectedImage, loading]);

    // Text-to-speech function with natural    // Speak text using browser TTS
    const speakText = (text: string) => {
        // Cancel any ongoing speech
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        // Small delay to ensure cancellation completes
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);

            // Force reload voices to ensure we have the latest
            const voices = window.speechSynthesis.getVoices();

            if (selectedVoice) {
                // Find the voice again from the current list to ensure it's valid
                const currentVoice = voices.find(v => v.name === selectedVoice.name);
                if (currentVoice) {
                    utterance.voice = currentVoice;
                    console.log('🎙️ Using voice:', currentVoice.name, '(', currentVoice.lang, ')');
                } else {
                    console.warn('Selected voice not found, using default');
                }
            }

            // Set voice parameters AFTER setting the voice
            utterance.rate = 0.95;
            utterance.pitch = 0.8;
            utterance.volume = 1.0;

            utterance.onstart = () => {
                setIsSpeaking(true);
                console.log('Started speaking with:', utterance.voice?.name || 'default voice');
            };
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = (error) => {
                console.error('Speech error:', error);
                setIsSpeaking(false);
            };

            speechSynthesisRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }, 100);
    };

    // Stop speaking (interrupt)
    const stopSpeaking = () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setIsSpeaking(false);
            setIsPaused(false);
        }
    };

    // ElevenLabs TTS function (premium voice)
    const speakTextElevenLabs = async (text: string) => {
        try {
            stopSpeaking();
            setIsSpeaking(true);
            setIsPaused(false);

            const audioBlob = await generateSpeech(text);
            const audioUrl = URL.createObjectURL(audioBlob);

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setIsSpeaking(false);
                setIsPaused(false);
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = () => {
                setIsSpeaking(false);
                setIsPaused(false);
            };

            await audio.play();
        } catch (error: any) {
            console.error('ElevenLabs error:', error);
            setIsSpeaking(false);
            if (error.message?.includes('API key')) {
                alert('ElevenLabs not configured. Add VITE_ELEVENLABS_API_KEY to .env');
            }
        }
    };

    // Pause/resume controls
    const pauseSpeaking = () => {
        if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
            setIsPaused(true);
        }
    };

    const resumeSpeaking = () => {
        if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play();
            setIsPaused(false);
        }
    };

    // Google Cloud TTS (FREE 1M chars/month!)
    const speakTextGoogle = async (text: string) => {
        try {
            stopSpeaking();
            setIsSpeaking(true);
            setIsPaused(false);

            console.log('🎙️ Attempting Google TTS...');

            // Use Deep Male voice
            const audioBlob = await synthesizeSpeech(text, RECOMMENDED_VOICES[0].name);
            const audioUrl = URL.createObjectURL(audioBlob);

            console.log('✅ Google TTS audio generated successfully!');

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setIsSpeaking(false);
                setIsPaused(false);
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = () => {
                setIsSpeaking(false);
                setIsPaused(false);
            };

            await audio.play();
        } catch (error: any) {
            console.error('❌ Google TTS error:', error);
            console.error('Error message:', error.message);
            setIsSpeaking(false);
            setIsPaused(false);

            // Fallback to browser voice if not configured
            if (error.message?.includes('API key')) {
                console.warn('⚠️ Google TTS API key not configured - falling back to browser voice');
                alert('Google TTS not configured. Using browser voice instead. Check console for details.');
                speakText(text);
            } else {
                console.error('⚠️ Google TTS failed with unexpected error - falling back to browser voice');
                speakText(text);
            }
        }
    };

    // Save recipe from AI message
    const handleSaveRecipe = async (messageIndex: number, messageText: string) => {
        setSavingRecipe(messageIndex);

        try {
            // Extract recipe name from content (first line or first 50 chars)
            const firstLine = messageText.split('\n')[0];
            const recipeName = firstLine.length > 50
                ? firstLine.substring(0, 47) + '...'
                : firstLine || 'Untitled Recipe';

            const { data, error } = await saveRecipe({
                recipe_name: recipeName,
                recipe_content: messageText,
                conversation_context: messages.slice(Math.max(0, messageIndex - 2), messageIndex + 1)
                    .map(m => `${m.role}: ${m.text}`)
                    .join('\n')
            });

            if (error) {
                console.error('Save error:', error);
                alert('Failed to save recipe: ' + error.message);
            } else {
                setSavedRecipes(prev => new Set(prev).add(messageIndex));
                // Show success feedback
                const toast = document.createElement('div');
                toast.className = 'fixed top-24 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                toast.textContent = '✓ Recipe saved!';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);
            }
        } catch (err: any) {
            console.error('Save error:', err);
            alert('Failed to save recipe');
        } finally {
            setSavingRecipe(null);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-gray-900 text-white relative overflow-hidden">
            {/* Voice Selector Modal */}
            {showVoiceSelector && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-gray-700">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Select Voice</h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    Current: {selectedVoice?.name || 'None selected'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowVoiceSelector(false)}
                                className="text-gray-400 hover:text-white p-2"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Voice List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-2">
                            {availableVoices.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">Loading voices...</p>
                            ) : (
                                availableVoices.map((voice, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSelectedVoice(voice);
                                            localStorage.setItem('preferredVoice', voice.name);

                                            // Preview the voice
                                            const testUtterance = new SpeechSynthesisUtterance('Hello, I am your chef assistant');
                                            testUtterance.voice = voice;
                                            testUtterance.rate = 0.95;
                                            testUtterance.pitch = 0.8;
                                            window.speechSynthesis.cancel();
                                            window.speechSynthesis.speak(testUtterance);

                                            setTimeout(() => setShowVoiceSelector(false), 1000);
                                        }}
                                        className={`w-full text-left p-4 rounded-lg transition-all flex items-center justify-between ${selectedVoice?.name === voice.name
                                            ? 'bg-culinary-gold text-black'
                                            : 'bg-gray-800 hover:bg-gray-700 text-white'
                                            }`}
                                    >
                                        <div>
                                            <div className="font-semibold">{voice.name}</div>
                                            <div className="text-sm opacity-70">
                                                {voice.lang} • {voice.localService ? 'Local' : 'Online'}
                                            </div>
                                        </div>
                                        {(voice.name.toLowerCase().includes('google') ||
                                            voice.name.toLowerCase().includes('enhanced') ||
                                            voice.name.toLowerCase().includes('premium')) && (
                                                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                                                    Premium
                                                </span>
                                            )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Background decoration */}
            <div className="flex-1 max-w-4xl mx-auto w-full bg-gray-900/40 md:border border-gray-800 md:rounded-2xl flex flex-col overflow-hidden relative shadow-2xl">

                {/* Header */}
                <div className="p-4 border-b border-gray-800 bg-black/40 backdrop-blur-md flex items-center justify-between z-10 w-full">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-culinary-gold/20 flex items-center justify-center border border-culinary-gold/50">
                            <ChefHat className="w-6 h-6 text-culinary-gold" />
                        </div>
                        <div>
                            <h1 className="font-serif text-xl text-culinary-gold tracking-wide">Lumière Chef AI</h1>
                            <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-xs text-gray-400 font-sans uppercase tracking-widest">
                                    {import.meta.env.VITE_GEMINI_API_KEY ? "System: Connected" : "🔴 ERROR: Missing API Key"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Live Mode Toggle */}
                    <button
                        onClick={() => setIsLiveMode(!isLiveMode)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center space-x-2 ${isLiveMode ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                    >
                        <Camera className="w-5 h-5" />
                        <span>{isLiveMode ? 'Stop Live' : 'Live Mode'}</span>
                    </button>

                    {/* Voice Selector Button */}
                    <button
                        onClick={() => setShowVoiceSelector(true)}
                        className="px-4 py-2 rounded-lg font-semibold bg-purple-600 hover:bg-purple-700 transition-all flex items-center space-x-2"
                        title={`Current voice: ${selectedVoice?.name || 'None'}`}
                    >
                        <Volume2 className="w-5 h-5" />
                        <span>Voice</span>
                    </button>
                </div>

                {/* Live Mode Camera Feed */}
                {isLiveMode && (
                    <div className="absolute bottom-24 right-4 z-20 w-48 h-36 md:w-64 md:h-48 rounded-xl overflow-hidden border-2 border-red-500 shadow-2xl shadow-red-500/50 bg-gray-900">
                        {cameraStream ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-xs text-center p-2">
                                <div>
                                    <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>Requesting camera...</p>
                                </div>
                            </div>
                        )}
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center space-x-1 animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            <span>LIVE</span>
                        </div>
                        {isSpeaking && (
                            <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center space-x-1">
                                <span>🔊 Speaking</span>
                            </div>
                        )}
                        {isSpeaking && (
                            isPaused ? (
                                <button
                                    onClick={resumeSpeaking}
                                    className="absolute bottom-2 right-2 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-full font-bold flex items-center space-x-1 transition-all"
                                >
                                    <Play className="w-4 h-4" />
                                    <span>Resume</span>
                                </button>
                            ) : (
                                <button
                                    onClick={pauseSpeaking}
                                    className="absolute bottom-2 right-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-2 rounded-full font-bold flex items-center space-x-1 transition-all"
                                >
                                    <Pause className="w-4 h-4" />
                                    <span>Pause</span>
                                </button>
                            )
                        )}
                        {selectedImage && (Date.now() - lastFrameCapture < 2000) && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center space-x-1">
                                <span>👁️ AI Vision</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Hidden canvas for frame capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex flex-col max-w-[85%] md:max-w-[70%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                                {msg.image && (
                                    <img
                                        src={msg.image}
                                        alt="Uploaded context"
                                        className="w-48 h-48 object-cover rounded-xl border border-gray-700 shadow-lg"
                                    />
                                )}

                                {msg.text && (
                                    <div className={`px-5 py-3 rounded-2xl text-lg md:text-2xl leading-relaxed font-sans shadow-md ${msg.role === 'user'
                                        ? 'bg-culinary-gold text-black rounded-tr-sm'
                                        : 'bg-gray-800 text-gray-200 rounded-tl-sm border border-gray-700'
                                        }`}>
                                        {msg.role === 'model' ? (
                                            <>
                                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                {/* Read Aloud Button */}
                                                <button
                                                    onClick={() => speakTextGoogle(msg.text!)}
                                                    className="mt-3 mr-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all inline-flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700"
                                                >
                                                    <Volume2 className="w-4 h-4" />
                                                    <span>Read Aloud</span>
                                                </button>
                                                {/* Save Recipe Button - shows on messages > 100 chars */}
                                                {msg.text.length > 100 && (
                                                    <button
                                                        onClick={() => handleSaveRecipe(idx, msg.text!)}
                                                        disabled={savingRecipe === idx || savedRecipes.has(idx)}
                                                        className={`mt-3 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${savedRecipes.has(idx)
                                                            ? 'bg-green-600 text-white cursor-default'
                                                            : 'bg-culinary-gold text-black hover:bg-yellow-500'
                                                            }`}
                                                    >
                                                        {savedRecipes.has(idx) ? (
                                                            <>
                                                                <BookmarkCheck className="w-4 h-4" />
                                                                <span>Saved</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Bookmark className="w-4 h-4" />
                                                                <span>{savingRecipe === idx ? 'Saving...' : 'Save Recipe'}</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-800 px-5 py-4 rounded-2xl rounded-tl-sm border border-gray-700 flex items-center space-x-2">
                                <Loader className="w-4 h-4 animate-spin text-culinary-gold" />
                                <span className="text-xs text-gray-400 font-mono animate-pulse">CHEF IS THINKING...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/60 backdrop-blur-md border-t border-gray-800">
                    <div className="relative">
                        {/* Selected Image Preview (Thumbnail above input) */}
                        {selectedImage && (
                            <div className="absolute bottom-full mb-4 left-0 bg-gray-800 p-2 rounded-lg border border-gray-700 shadow-xl flex items-start animate-fade-in-up">
                                <img src={selectedImage} alt="Preview" className="w-20 h-20 object-cover rounded-md" />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="ml-2 bg-red-500/20 text-red-200 p-1 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center space-x-2 bg-gray-900 border border-gray-700 rounded-full p-2 pl-4 shadow-inner focus-within:border-culinary-gold/50 focus-within:ring-1 focus-within:ring-culinary-gold/20 transition-all">

                            {/* Media Controls */}
                            <div className="flex items-center space-x-1 pr-2 border-r border-gray-700">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-gray-400 hover:text-culinary-gold hover:bg-white/5 rounded-full transition-colors"
                                    title="Upload Image"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => cameraInputRef.current?.click()} // Camera trigger
                                    className="p-2 text-gray-400 hover:text-culinary-gold hover:bg-white/5 rounded-full transition-colors md:hidden"
                                    title="Take Photo"
                                >
                                    <Camera className="w-5 h-5" />
                                </button>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />

                            <input
                                type="file"
                                ref={cameraInputRef}
                                className="hidden"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileSelect}
                            />

                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={listening ? "Listening..." : "Ask your chef..."}
                                className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 text-white text-lg placeholder-gray-400 font-sans h-12"
                                disabled={loading}
                            />

                            {/* Voice & Send */}
                            <div className="flex items-center space-x-2 shrink-0">
                                <button
                                    onClick={toggleListening}
                                    className={`p-2 rounded-full transition-all duration-300 ${listening
                                        ? 'bg-red-500/20 text-red-500 animate-pulse'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    title="Voice Input"
                                >
                                    {listening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>

                                <button
                                    onClick={handleSend}
                                    disabled={loading || (!input.trim() && !selectedImage)}
                                    className="bg-culinary-gold text-black p-3 rounded-full hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95 shadow-lg"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
