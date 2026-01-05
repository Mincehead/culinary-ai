import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const DebugAuth: React.FC = () => {
    const { user, session, loading } = useAuth();
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

        addLog(`URL: ${window.location.href}`);
        addLog(`Origin: ${window.location.origin}`);

        if (window.location.hash) addLog(`Hash: ${window.location.hash.substring(0, 20)}...`);
        if (window.location.search) addLog(`Search: ${window.location.search}`);

    }, []);

    useEffect(() => {
        if (user) setLogs(prev => [`User: ${user.email}`, ...prev].slice(0, 5));
    }, [user]);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 p-2 text-[10px] text-green-400 font-mono z-[100] border-t border-green-800 opacity-80 pointer-events-none">
            <div>Status: {loading ? 'LOADING' : (session ? 'LOGGED IN' : 'LOGGED OUT')}</div>
            {logs.map((log, i) => (
                <div key={i}>{log}</div>
            ))}
        </div>
    );
};
