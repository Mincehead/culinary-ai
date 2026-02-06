import React, { useState, useEffect, useRef } from 'react';
import { Send, User, ChefHat, Loader } from 'lucide-react';
import { generateChefReply } from '../services/geminiService';

interface Message {
    role: 'user' | 'model';
    text: string;
}

interface ChefChatProps {
    initialImage?: string | null;
    onRecipeSelect?: (recipeName: string) => void;
}

export const ChefChat: React.FC<ChefChatProps> = ({ initialImage }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize Chat
    useEffect(() => {
        // Initial greeting
        if (messages.length === 0) {
            setMessages([
                { role: 'model', text: "Bonjour! I see your ingredients. What shall we cook today? Ask me for ideas or staple suggestions." }
            ]);
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        // Create new messages array with user message
        const msgsWithUser = [...messages, { role: 'user', text: userMsg } as Message];
        setMessages(msgsWithUser);
        setLoading(true);

        try {
            // Convert messages to Gemini history format
            const history = msgsWithUser.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const reply = await generateChefReply(history);
            setMessages(prev => [...prev, { role: 'model', text: reply }]);

        } catch (err) {
            console.error("Chat error", err);
            setMessages(prev => [...prev, { role: 'model', text: "Pardon, I had a little trouble hearing you. Could you say that again?" }]);
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
        <div className="flex flex-col h-full bg-gray-900/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-gray-800/80 p-4 border-b border-gray-700 flex items-center">
                <ChefHat className="w-5 h-5 text-culinary-gold mr-2" />
                <span className="font-serif text-culinary-cream">Chef de Cuisine</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 text-sm font-sans leading-relaxed ${msg.role === 'user'
                                ? 'bg-culinary-gold text-black rounded-tr-none'
                                : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 rounded-lg p-3 rounded-tl-none border border-gray-700">
                            <Loader className="w-4 h-4 animate-spin text-gray-500" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-gray-900 border-t border-gray-700 flex items-center space-x-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask about ingredients, substitutes..."
                    className="flex-1 bg-black/50 border border-gray-600 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-culinary-gold placeholder-gray-500"
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="bg-culinary-gold text-black p-2 rounded-full hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
