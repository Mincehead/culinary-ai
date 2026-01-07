import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Background from '../components/Background';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { CuisineType, RecipeTag, DietaryRequirement } from '../types';
import { ChevronRight, Search, Globe, Wheat, Flame, Check, User, LogOut } from 'lucide-react';
import { ReviewsSection } from '../components/ReviewsSection';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    const [selectedCuisine, setSelectedCuisine] = useState<CuisineType | null>(null);
    const [selectedDietary, setSelectedDietary] = useState<DietaryRequirement[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        navigate(`/recipes?q=${encodeURIComponent(searchQuery)}`);
    };

    const handleStartSearch = (tag: RecipeTag) => {
        if (!selectedCuisine) return;

        const params = new URLSearchParams();
        params.append('cuisine', selectedCuisine);
        params.append('tag', tag);
        selectedDietary.forEach(d => params.append('dietary', d));

        navigate(`/recipes?${params.toString()}`);
    };

    return (
        <div className="relative min-h-screen text-gray-200 selection:bg-culinary-gold selection:text-black">
            <Helmet>
                <title>Lumière Culinary | AI Personal Chef & Bespoke Recipe Generator</title>
                <meta name="description" content="Draft bespoke, Michelin-style recipes instantly with AI. Select your cuisine, style, and dietary needs." />
                <link rel="canonical" href="https://lumiereculinary.com/" />
            </Helmet>
            <Background />

            <div className="relative z-10">
                <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/profile')}
                                className="flex items-center gap-2 text-sm uppercase tracking-widest hover:text-culinary-gold transition-colors font-sans"
                            >
                                <div className="w-8 h-8 rounded-full bg-culinary-gold/20 flex items-center justify-center border border-culinary-gold/50">
                                    <User className="w-4 h-4 text-culinary-gold" />
                                </div>
                                <span className="hidden md:block">My Menu</span>
                            </button>
                            <button
                                onClick={() => signOut()}
                                className="flex items-center gap-2 px-3 py-2 text-white hover:text-red-400 transition-colors bg-black/30 rounded-full border border-white/10"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-xs uppercase tracking-widest">Sign Out</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="px-6 py-2 border border-culinary-gold/50 rounded-full text-xs uppercase tracking-widest hover:bg-culinary-gold hover:text-culinary-dark transition-all duration-300 font-sans backdrop-blur-md"
                        >
                            Sign In
                        </button>
                    )}
                </div>

                <div className="absolute top-6 left-6 z-50">
                    <img
                        src="/logo.png"
                        alt="Lumière Culinary"
                        className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => navigate('/')}
                    />
                </div>

                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                />

                <div className="max-w-6xl mx-auto px-6 py-12">
                    <header className="text-center mb-16">
                        <h1 className="text-5xl md:text-7xl font-serif text-culinary-gold mb-4 text-shadow tracking-tight">
                            Lumière Culinary
                        </h1>
                        <p className="text-xl text-white font-sans tracking-widest uppercase opacity-90 drop-shadow-md">
                            AI-Powered Recipes
                        </p>
                    </header>

                    <section className="mb-12 max-w-2xl mx-auto">
                        <form onSubmit={handleSearch} className="relative group">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for a specific dish..."
                                className="w-full bg-black/60 border border-gray-600 focus:border-culinary-gold rounded-full py-4 pl-12 pr-6 text-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-culinary-gold/50 transition-all font-serif backdrop-blur-md shadow-xl"
                            />
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 group-focus-within:text-culinary-gold transition-colors" />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-culinary-gold text-culinary-dark p-2 rounded-full hover:bg-yellow-500 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </form>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-serif text-culinary-cream mb-6 border-b border-gray-400/30 pb-2 flex items-center gap-2 drop-shadow-md">
                            <Globe className="w-5 h-5 text-culinary-gold" /> Select Origin
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.values(CuisineType).map((cuisine) => (
                                <button
                                    key={cuisine}
                                    onClick={() => setSelectedCuisine(cuisine)}
                                    className={`p-6 text-lg font-serif transition-all duration-300 border shadow-xl ${selectedCuisine === cuisine
                                        ? 'bg-culinary-gold/90 text-culinary-dark border-culinary-gold shadow-[0_0_20px_rgba(212,175,55,0.5)] scale-105'
                                        : 'bg-black/60 text-gray-100 border-gray-600 hover:border-culinary-gold hover:text-culinary-gold hover:bg-black/80'
                                        } backdrop-blur-md rounded-sm`}
                                >
                                    {cuisine}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="mb-6 md:mb-12">
                        <h2 className="text-2xl font-serif text-culinary-cream mb-6 border-b border-gray-400/30 pb-2 flex items-center gap-2 drop-shadow-md">
                            <Wheat className="w-5 h-5 text-culinary-gold" /> Dietary Preferences <span className="text-gray-500 text-sm font-sans ml-2 normal-case tracking-normal">(Optional)</span>
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {Object.values(DietaryRequirement).map((diet) => {
                                const isSelected = selectedDietary.includes(diet);
                                return (
                                    <button
                                        key={diet}
                                        onClick={() => {
                                            setSelectedDietary(prev =>
                                                isSelected ? prev.filter(d => d !== diet) : [...prev, diet]
                                            );
                                        }}
                                        className={`px-4 py-2 rounded-full border transition-all duration-300 font-sans text-sm flex items-center gap-2 ${isSelected
                                            ? 'bg-culinary-gold text-culinary-dark border-culinary-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                                            : 'bg-black/40 text-gray-300 border-gray-600 hover:border-culinary-gold hover:text-culinary-gold'
                                            }`}
                                    >
                                        {isSelected && <Check className="w-3 h-3" />}
                                        {diet}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className={`transition-all duration-700 ${selectedCuisine ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none h-0 overflow-hidden'}`}>
                        <h2 className="text-2xl font-serif text-culinary-cream mb-6 border-b border-gray-400/30 pb-2 flex items-center gap-2 drop-shadow-md">
                            <Flame className="w-5 h-5 text-culinary-gold" /> Select Style
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.values(RecipeTag).map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => handleStartSearch(tag)}
                                    className="group relative overflow-hidden p-8 border border-gray-600 hover:border-culinary-gold transition-colors duration-300 bg-black/60 hover:bg-black/80 backdrop-blur-md text-left shadow-xl"
                                >
                                    <span className="relative z-10 text-xl font-serif text-gray-100 group-hover:text-culinary-gold transition-colors">
                                        {tag}
                                    </span>
                                    <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-gray-400 group-hover:text-culinary-gold transition-colors" />
                                </button>
                            ))}
                        </div>
                    </section>

                    <ReviewsSection />
                </div>
            </div>
        </div>
    );
};
