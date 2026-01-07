import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SavedRecipes } from '../components/SavedRecipes';
import Background from '../components/Background';
import { ArrowLeft } from 'lucide-react';
import { RecipeDetail } from '../types';

export const Profile: React.FC = () => {
    const navigate = useNavigate();

    const handleSelectRecipe = (recipe: RecipeDetail) => {
        // Since we have the details already, we can pass them in state just like in the list view
        navigate('/recipe/preview', {
            state: {
                summary: { name: recipe.name, description: recipe.flavorProfile, image: '' }, // Reconstruct summary
                context: null, // Saved recipes don't need context regen
                preloadedDetail: recipe // Pass the full detail object
            }
        });

        // Note: Ideally, we should have a /recipe/:id route for saved recipes
        // But for this refactor we are sticking to the 'preview' pattern for generated content
        // However, since we HAVE the full details for saved recipes, we might want to pass the WHOLE detail object
        // The RecipeDetail component currently fetches data based on summary name if passed.
        // Let's modify this slightly: If we have the full detail, we should pass it or handle it.
        // But RecipeDetail.tsx as written expects 'summary' and calls 'generateRecipeDetail'.

        // IMPORTANT: The current RecipeDetail.tsx executes an API call on mount.
        // Use a slight hack for now: We should probably refactor RecipeDetail to accept 'detail' in state too.
        // I will update this file to pass 'preloadedDetail' in state, and update RecipeDetail to check for it.
    };

    return (
        <div className="relative min-h-screen text-gray-200 selection:bg-culinary-gold selection:text-black">
            <Helmet>
                <title>My Menu | Lumière Culinary</title>
                <meta name="description" content="Your saved recipes and personalized menu." />
            </Helmet>
            <Background />
            <div className="relative z-10">
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 z-20 flex items-center text-gray-300 hover:text-culinary-gold transition-colors uppercase tracking-widest text-sm font-sans"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </button>
                <div className="pt-20 px-6 max-w-7xl mx-auto">
                    <SavedRecipes onSelectRecipe={handleSelectRecipe} />
                </div>
            </div>
        </div>
    );
};
