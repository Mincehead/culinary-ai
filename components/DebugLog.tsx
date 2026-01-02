import React, { useEffect, useState } from 'react';

export const DebugLog: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const originalLog = console.log;
        const originalError = console.error;

        console.log = (...args) => {
            const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
            if (message.includes('[AuthContext]') || message.includes('Supabase')) {
                setLogs(prev => [message, ...prev].slice(0, 20));
            }
            originalLog(...args);
        };

        console.error = (...args) => {
            const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
            setLogs(prev => [`ERROR: ${message}`, ...prev].slice(0, 20));
            originalError(...args);
        };

        return () => {
            console.log = originalLog;
            console.error = originalError;
        };
    }, []);

    if (logs.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-48 bg-black/90 text-green-400 font-mono text-xs overflow-y-auto p-4 z-[9999] border-t border-green-500 opacity-80 pointer-events-none">
            <div className="font-bold mb-2 text-white border-b border-gray-700 pb-1">Mobile Auth Debugger</div>
            {logs.map((log, i) => (
                <div key={i} className="mb-1 border-b border-gray-800 pb-0.5">{log}</div>
            ))}
        </div>
    );
};
