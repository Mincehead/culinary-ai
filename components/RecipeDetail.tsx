import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loader from './Loader';
import LiveChefAssistant from './LiveChefAssistant';
import ImageWithLoader from './ImageWithLoader';
import { AuthModal } from './AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { generateRecipeDetail, generateImage } from '../services/geminiService';
import { RecipeDetail as RecipeDetailType, ImageSize } from '../types';
import { ArrowLeft, Heart, BookOpen, Camera, ChefHat, Wand2, ImageIcon } from 'lucide-react';

export const RecipeDetail: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State from navigation
    const { summary, context, preloadedDetail } = location.state || {}; // Added preloadedDetail

    const [detail, setDetail] = useState<RecipeDetailType | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Image Gen State
    const [ingredientImages, setIngredientImages] = useState<Record<number, string>>({});
    const [isGeneratingIngredient, setIsGeneratingIngredient] = useState<number | null>(null);
    const [generatedInfographic, setGeneratedInfographic] = useState<string | null>(null);
    const [isGeneratingInfographic, setIsGeneratingInfographic] = useState<boolean>(false);

    // Auth State
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        if (preloadedDetail) { // Check for preloaded data first
            setDetail(preloadedDetail);
            setLoading(false);
            return;
        }

        if (!summary) {
            // content invoked without state (e.g. refresh), redirect to home
            navigate('/');
            return;
        }

        const fetchDetail = async () => {
            setLoading(true);
            try {
                const result = await generateRecipeDetail(summary.name, context?.cuisine, context?.dietary);
                setDetail(result);
            } catch (err) {
                console.error(err);
                setError("Failed to retrieve the detailed recipe.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [summary, context, preloadedDetail, navigate]);

    // --- Helpers Copied from Home.tsx ---

    const getDishImageUrl = (name: string, cuisine: string | null, width: number, height: number) => {
        const prompt = `professional food photography of ${name} ${cuisine || ''} dish, cinematic lighting, appetizing, michelin star presentation`;
        const encodedPrompt = encodeURIComponent(prompt);
        const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;
    };

    const ensureApiKey = async () => {
        const aiStudio = (window as any).aistudio;
        if (aiStudio) {
            const hasKey = await aiStudio.hasSelectedApiKey();
            if (!hasKey) {
                await aiStudio.openSelectKey();
                return await aiStudio.hasSelectedApiKey();
            }
            return true;
        }
        return true;
    };

    const handleGenerateIngredientImage = async (ingredient: string, index: number) => {
        try {
            const hasKey = await ensureApiKey();
            if (!hasKey) return;
            setIsGeneratingIngredient(index);
            const prompt = `Macro food photography close up of raw ${ingredient}. Cinematic lighting, dark background, fresh quality ingredients. Detailed texture, 8k resolution, photorealistic.`;
            const imageSize: ImageSize = '1K';
            const base64Image = await generateImage(prompt, imageSize);
            setIngredientImages(prev => ({ ...prev, [index]: base64Image }));
        } catch (err) {
            console.error(err);
        } finally {
            setIsGeneratingIngredient(null);
        }
    };

    const handleGenerateInfographic = async () => {
        if (!detail) return;
        try {
            const hasKey = await ensureApiKey();
            if (!hasKey) return;
            setIsGeneratingInfographic(true);
            const prompt = `A vertical visual infographic guide for cooking ${detail.name}. Step-by-step visual instructions. Elegant typography, dark culinary theme, gold accents. Show key stages: Preparation, Cooking, Plating. High resolution, professional graphic design.`;
            const base64Image = await generateImage(prompt, '1K', '9:16');
            setGeneratedInfographic(base64Image);
        } catch (err) {
            console.error(err);
        } finally {
            setIsGeneratingInfographic(false);
        }
    };

    const handleSaveRecipe = async () => {
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }
        if (!detail) return;

        try {
            const { error } = await supabase.from('saved_recipes').insert({
                user_id: user.id,
                recipe_data: detail
            });
            if (error) throw error;
            alert("Recipe saved to your personal menu.");
        } catch (err: any) {
            console.error(err);
            if (err.code === '42P01') {
                alert("Database setup required. Please run the SQL setup script.");
            } else {
                alert("Failed to save recipe: " + err.message);
            }
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-culinary-dark text-white">
                <Loader message="Deconstructing Recipe..." />
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="h-screen flex items-center justify-center bg-culinary-dark text-white">
                <div className="text-center">
                    <p className="text-xl mb-4 text-red-400">{error || "Recipe not found"}</p>
                    <button onClick={() => navigate(-1)} className="text-culinary-gold underline">Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto bg-culinary-dark/95 min-h-screen shadow-2xl relative border-x border-gray-800 text-gray-200 selection:bg-culinary-gold selection:text-black">

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />

            <LiveChefAssistant recipe={detail} />

            <div className="h-[50vh] w-full relative overflow-hidden group">
                <ImageWithLoader
                    src={getDishImageUrl(detail.name, context?.cuisine || null, 1200, 800)}
                    alt={detail.name}
                    className="w-full h-full object-cover transition-all duration-1000"
                    containerClassName="w-full h-full"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-culinary-dark via-culinary-dark/40 to-transparent"></div>

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 z-20 flex items-center text-white/90 hover:text-culinary-gold transition-colors bg-black/50 p-2 rounded-full backdrop-blur-md border border-white/10"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full flex items-end justify-between">
                    <div>
                        <span className="text-culinary-gold uppercase tracking-[0.2em] text-sm font-bold mb-2 block drop-shadow-md">{detail.difficulty} • {detail.prepTime}</span>
                        <h1 className="text-4xl md:text-6xl font-serif text-culinary-cream mb-4 drop-shadow-lg">{detail.name}</h1>
                        <p className="text-gray-200 italic font-serif text-lg max-w-2xl drop-shadow-md">{detail.flavorProfile}</p>
                    </div>

                    <button
                        onClick={handleSaveRecipe}
                        className="mb-4 mr-4 bg-culinary-gold text-culinary-dark px-6 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-2 shadow-lg"
                    >
                        <Heart className="w-5 h-5" /> Save Recipe
                    </button>
                </div>
            </div>

            <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 space-y-12">
                    <section>
                        <h3 className="text-xl font-serif text-culinary-gold mb-4 flex items-center">
                            <BookOpen className="w-5 h-5 mr-2" /> The Story
                        </h3>
                        <p className="text-gray-300 font-sans leading-relaxed text-sm text-justify">
                            {detail.history}
                        </p>
                    </section>

                    <section className="bg-white/5 p-6 rounded-sm border border-white/10 shadow-inner">
                        <div className="flex items-center justify-between mb-6 border-b border-gray-600 pb-2">
                            <h3 className="text-xl font-serif text-culinary-cream">Mise en Place</h3>
                        </div>

                        <ul className="space-y-6">
                            {detail.ingredients.map((ing, i) => (
                                <li key={i} className="group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start text-gray-200 font-sans text-sm flex-1">
                                            <span className="w-1.5 h-1.5 bg-culinary-gold rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                                            <span className="leading-relaxed">{ing}</span>
                                        </div>

                                        <button
                                            onClick={() => handleGenerateIngredientImage(ing, i)}
                                            disabled={isGeneratingIngredient === i}
                                            className="ml-2 text-gray-500 hover:text-culinary-gold transition-colors opacity-50 group-hover:opacity-100"
                                            title="Generate Ingredient Visual"
                                        >
                                            {isGeneratingIngredient === i ? (
                                                <div className="w-4 h-4 border-2 border-culinary-gold border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Camera className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>

                                    {ingredientImages[i] && (
                                        <div className="mt-3 ml-4 overflow-hidden rounded-md border border-gray-700 shadow-lg animate-in fade-in zoom-in duration-300">
                                            <ImageWithLoader
                                                src={ingredientImages[i]}
                                                alt={ing}
                                                className="w-full h-32 object-cover hover:scale-110 transition-transform duration-500"
                                                containerClassName="w-full h-32"
                                            />
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                <div className="lg:col-span-2 space-y-12">
                    <div className="bg-culinary-gold/10 border-l-4 border-culinary-gold p-6 rounded-r-sm">
                        <h4 className="text-culinary-gold font-bold uppercase tracking-widest text-xs mb-2 flex items-center">
                            <ChefHat className="w-4 h-4 mr-2" /> Chef's Secret
                        </h4>
                        <p className="text-culinary-cream font-serif italic text-lg">
                            "{detail.chefTips}"
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleGenerateInfographic}
                            disabled={isGeneratingInfographic}
                            className="flex items-center gap-2 bg-gradient-to-r from-culinary-gold to-yellow-600 text-culinary-dark px-6 py-3 rounded-sm font-serif font-bold tracking-widest uppercase hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isGeneratingInfographic ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-culinary-dark border-t-transparent rounded-full animate-spin"></div>
                                    Designing Visual Guide...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    {generatedInfographic ? 'Regenerate Guide' : 'Generate Visual Guide'}
                                </>
                            )}
                        </button>
                    </div>

                    {generatedInfographic && (
                        <div className="w-full relative group cursor-pointer" onClick={() => window.open(generatedInfographic, '_blank')}>
                            <ImageWithLoader
                                src={generatedInfographic}
                                alt="Recipe Infographic"
                                className="w-full h-auto rounded-sm border border-culinary-gold/30 shadow-2xl"
                                containerClassName="w-full h-auto"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <span className="text-white font-sans uppercase tracking-widest text-sm flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" /> Click to Expand
                                </span>
                            </div>
                        </div>
                    )}

                    <section>
                        <h3 className="text-3xl font-serif text-culinary-cream mb-8">Preparation</h3>
                        <div className="space-y-8">
                            {detail.instructions.map((step, i) => (
                                <div key={i} className="group">
                                    <div className="flex items-baseline mb-2">
                                        <span className="text-4xl font-serif text-gray-600 group-hover:text-culinary-gold transition-colors mr-4 select-none">
                                            {(i + 1).toString().padStart(2, '0')}
                                        </span>
                                        <p className="text-gray-300 font-sans leading-loose text-lg border-b border-gray-700 pb-8 w-full group-hover:border-gray-500 transition-colors">
                                            {step}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
