import { useNavigate } from 'react-router-dom';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("[AuthContext] getSession:", session);
            setSession(session);
            setUser(session?.user ?? null);

            // AGGRESSIVE URL CLEANUP:
            // Check immediately if we have a hash to clear, even before onAuthStateChange
            if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery'))) {
                console.log("[AuthContext] Cleaning hash...");
                // Use navigate with replace: true to clean URL and sync router state
                navigate(window.location.pathname + window.location.search, { replace: true });
            }

            // If there is a hash with an access token, allow onAuthStateChange to handle the loading state
            // This prevents a premature "Logged Out" flash on mobile while parsing the URL
            // Check for both implicit (hash) and PKCE (search code) flows
            const hasAuthParams = window.location.hash.includes('access_token') ||
                window.location.search.includes('code=');

            if (!session && hasAuthParams) {
                console.log("[AuthContext] Auth params detected, waiting for onAuthStateChange");
                return;
            }

            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("[AuthContext] onAuthStateChange event:", event);
            console.log("[AuthContext] onAuthStateChange session:", session);
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            // Clean up the URL hash if it contains auth info
            if (event === 'SIGNED_IN' && (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery'))) {
                navigate(window.location.pathname + window.location.search, { replace: true });
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const signOut = async () => {
        await supabase.auth.signOut();
        navigate('/'); // Redirect to home first
        window.location.reload(); // Then reload to clear state cleanly
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
