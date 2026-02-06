import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Camera, Image as ImageIcon, StopCircle, ChefHat, X, Loader } from 'lucide-react';
import { generateChefReply } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'model';
    text?: string;
    image?: string; // base64
}

export const ChefAI: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: "Bonjour! I am Lumière, your personal Executive Chef. Show me your ingredients, tell me what you're craving, or ask me anything about cooking. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [listening, setListening] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

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
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setListening(false);
            };

            recognitionRef.current.onend = () => {
                setListening(false);
            };
        }
    }, []);

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

    return (
        <div className="flex flex-col h-[100dvh] bg-black text-white pt-20 pb-4 md:px-4">
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
                                <span className="text-xs text-gray-400 font-sans uppercase tracking-widest">Online</span>
                            </div>
                        </div>
                    </div>
                </div>

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
                                    <div className={`px-5 py-3 rounded-2xl text-sm md:text-base leading-relaxed font-sans shadow-md ${msg.role === 'user'
                                        ? 'bg-culinary-gold text-black rounded-tr-sm'
                                        : 'bg-gray-800 text-gray-200 rounded-tl-sm border border-gray-700'
                                        }`}>
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
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
                                className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 font-sans h-10"
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
