import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { RecipeDetail } from '../types';
import ImageWithLoader from './ImageWithLoader';
import { Trash2, ArrowRight, Loader, Clock, ChefHat } from 'lucide-react';

interface SavedRecipesProps {
    onSelectRecipe: (recipe: RecipeDetail) => void;
}

export const SavedRecipes: React.FC<SavedRecipesProps> = ({ onSelectRecipe }) => {
    const { user } = useAuth();
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchSavedRecipes();
        }
    }, [user]);

    const fetchSavedRecipes = async () => {
        try {
            console.log("Fetching recipes for user:", user?.id);
            const { data, error } = await supabase
                .from('saved_recipes')
                .select('*')
                .order('created_at', { ascending: false });

            console.log("Supabase response:", { data, error });

            if (error) throw error;
            setRecipes(data || []);
        } catch (err) {
            console.error('Error fetching recipes:', err);
        } finally {
            setLoading(false);
        }
    };

    const removeRecipe = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to remove this recipe?')) return;

        try {
            const { error } = await supabase
                .from('saved_recipes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setRecipes(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error('Error removing recipe:', err);
        }
    };

    if (loading) return <div className="p-12 text-center text-culinary-gold"><Loader className="w-8 h-8 animate-spin mx-auto" /></div>;

    if (recipes.length === 0) {
        return (
            <div className="text-center py-20 px-6">
                <ChefHat className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-2xl font-serif text-gray-400 mb-2">No Saved Recipes</h3>
                <p className="text-gray-500 font-sans">Start exploring and save your favorites here.</p>
            </div>
        );
    }

    // Helper to generate consistent food images (copied from App.tsx logic for consistency)
    const getDishImageUrl = (name: string, width: number, height: number) => {
        const prompt = `professional food photography of ${name} dish, cinematic lighting, appetizing, michelin star presentation`;
        const encodedPrompt = encodeURIComponent(prompt);
        const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;
    };

    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <h2 className="text-3xl font-serif text-culinary-cream mb-8 border-b border-gray-700 pb-4">My Personal Menu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recipes.map((item) => {
                    const recipe: RecipeDetail = item.recipe_data;
                    return (
                        <div
                            key={item.id}
                            onClick={() => onSelectRecipe(recipe)}
                            className="group cursor-pointer bg-black/60 border border-gray-700 rounded-sm overflow-hidden hover:border-culinary-gold/50 transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] relative"
                        >
                            <div className="h-48 overflow-hidden relative">
                                <ImageWithLoader
                                    src={getDishImageUrl(recipe.name, 400, 300)}
                                    alt={recipe.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    containerClassName="w-full h-full"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            </div>

                            <div className="p-5">
                                <h3 className="text-xl font-serif text-gray-200 mb-2 line-clamp-1 group-hover:text-culinary-gold transition-colors">
                                    {recipe.name}
                                </h3>
                                <div className="flex items-center text-xs text-gray-400 mb-4 font-sans uppercase tracking-wider">
                                    <Clock className="w-3 h-3 mr-1" /> {recipe.prepTime}
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-xs text-culinary-gold font-bold flex items-center group-hover:translate-x-1 transition-transform">
                                        VIEW RECIPE <ArrowRight className="w-3 h-3 ml-1" />
                                    </span>
                                    <button
                                        onClick={(e) => removeRecipe(item.id, e)}
                                        className="text-gray-600 hover:text-red-400 p-2 -mr-2 transition-colors z-20 relative"
                                        title="Remove from collection"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
