import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Background from './Background';
import Loader from './Loader';
import { RecipeCard } from './RecipeCard';
import { generateRecipeList } from '../services/geminiService';
import { RecipeSummary, CuisineType, RecipeTag, DietaryRequirement } from '../types';
import { ArrowLeft, Plus } from 'lucide-react';
import { Footer } from './Footer';

export const RecipeList: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Parse params
    const query = searchParams.get('q');
    const cuisine = searchParams.get('cuisine') as CuisineType | null;
    const tag = searchParams.get('tag') as RecipeTag | null;
    const dietary = searchParams.getAll('dietary') as DietaryRequirement[];

    const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Initial fetch
    useEffect(() => {
        const fetchRecipes = async () => {
            setLoading(true);
            setError(null);

            try {
                let result: RecipeSummary[] = [];
                if (query) {
                    result = await generateRecipeList(null, null, dietary, query);
                } else if (cuisine && tag) {
                    result = await generateRecipeList(cuisine, tag, dietary);
                } else {
                    // Fallback or bad URL
                    setError("Invalid search parameters.");
                    setLoading(false);
                    return;
                }
                setRecipes(result);
            } catch (err: any) {
                console.error(err);
                setError("The AI Chef is busy. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (query || (cuisine && tag)) {
            fetchRecipes();
        } else {
            // If accessed directly without params, maybe redirect or show empty?
            // For now, let's just show no results.
            setLoading(false);
        }
    }, [query, cuisine, tag, JSON.stringify(dietary)]);

    const handleLoadMore = async () => {
        setLoading(true);
        try {
            let newRecipes: RecipeSummary[] = [];
            if (query) {
                newRecipes = await generateRecipeList(null, null, dietary, query);
            } else if (cuisine && tag) {
                newRecipes = await generateRecipeList(cuisine, tag, dietary);
            }

            setRecipes(prev => {
                const existingNames = new Set(prev.map(r => r.name));
                const uniqueNew = newRecipes.filter(r => !existingNames.has(r.name));
                return [...prev, ...uniqueNew];
            });
        } catch (err) {
            console.error("Failed to load more recipes", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRecipe = (summary: RecipeSummary) => {
        // We pass the summary and context via state to the detail page
        // so we don't have to re-fetch basic info or guess context.
        navigate('/recipe/preview', {
            state: {
                summary,
                context: {
                    cuisine,
                    dietary
                }
            }
        });
    };

    const displayTitle = query
        ? `Results for "${query}"`
        : `${cuisine} Cuisine`;

    const displaySubtitle = query
        ? 'Custom Search'
        : tag;

    return (
        <div className="relative min-h-screen text-gray-200 selection:bg-culinary-gold selection:text-black">
            <Background />
            <div className="relative z-10 flex flex-col min-h-screen">
                <div className="max-w-7xl mx-auto px-6 py-8 w-full flex-grow">
                    <div className="flex items-center justify-between mb-8 border-b border-gray-600/50 pb-4 bg-black/60 p-4 rounded-t-sm backdrop-blur-md">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center text-gray-300 hover:text-culinary-gold transition-colors uppercase tracking-widest text-sm font-sans"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Search
                        </button>
                        <div className="text-right">
                            <h2 className="text-3xl font-serif text-culinary-cream">
                                {displayTitle}
                            </h2>
                            <p className="text-culinary-gold font-sans text-sm uppercase tracking-wider">
                                {displaySubtitle}
                            </p>
                        </div>
                    </div>

                    {loading && recipes.length === 0 ? (
                        <Loader message="Curating Menu..." />
                    ) : error ? (
                        <div className="text-center text-red-400 py-10 font-serif text-xl bg-black/60 rounded-lg backdrop-blur-sm">{error}</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                            {recipes.map((recipe, idx) => (
                                <RecipeCard
                                    key={idx}
                                    recipe={recipe}
                                    selectedCuisine={cuisine}
                                    onClick={handleSelectRecipe}
                                />
                            ))}
                        </div>
                    )}

                    {!loading && recipes.length > 0 && (
                        <div className="mt-12 text-center pb-12">
                            <button
                                onClick={handleLoadMore}
                                className="group flex flex-col items-center mx-auto text-culinary-gold hover:text-white transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full border border-culinary-gold group-hover:bg-culinary-gold/10 flex items-center justify-center mb-2 transition-all">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <span className="font-serif text-lg tracking-wider">Discover More</span>
                            </button>
                        </div>
                    )}
                </div>
                <Footer />
            </div>
        </div>
    );
};
