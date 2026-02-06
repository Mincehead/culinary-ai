import React, { useState, useEffect, useRef } from 'react';
import { RecipeSummary, CuisineType } from '../types';
import { getOrGenerateImage } from '../services/geminiService';
import ImageWithLoader from './ImageWithLoader';
import { Clock, BarChart2 } from 'lucide-react';

interface RecipeCardProps {
    recipe: RecipeSummary;
    selectedCuisine: CuisineType | null;
    onClick: (recipe: RecipeSummary) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, selectedCuisine, onClick }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState(false);
    const generatedRef = useRef(false);

    useEffect(() => {
        let isMounted = true;

        const fetchImage = async () => {
            if (generatedRef.current) return;
            generatedRef.current = true;
            setLoadingImage(true);

            try {
                // Check if we have a valid API key available globally or just try
                // Logic based on App.tsx ensureApiKey:
                // For list items, we might just try. If it fails (no key), we might want a fallback or just leave it blank/placeholder.

                const prompt = `Professional food photography of ${recipe.name} ${selectedCuisine || ''} dish, cinematic lighting, appetizing, michelin star presentation, 8k resolution.`;
                const url = await getOrGenerateImage(recipe.name, prompt, '1K');

                if (isMounted) {
                    setImageUrl(url);
                }
            } catch (err) {
                console.error("Failed to generate image for recipe card:", err);
                // Optional: Set a fallback image or keep null to show placeholder
            } finally {
                if (isMounted) {
                    setLoadingImage(false);
                }
            }
        };

        fetchImage();

        return () => {
            isMounted = false;
        };
    }, [recipe.name, selectedCuisine]);

    return (
        <div
            onClick={() => onClick(recipe)}
            className="group cursor-pointer bg-black/70 backdrop-blur-md border border-gray-700 hover:border-culinary-gold/70 transition-all duration-300 flex flex-col md:flex-row overflow-hidden shadow-2xl"
        >
            <div className="md:w-2/5 h-48 md:h-auto overflow-hidden relative bg-gray-900 flex items-center justify-center">
                {imageUrl ? (
                    <ImageWithLoader
                        src={imageUrl}
                        alt={recipe.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                        containerClassName="w-full h-full"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-sans text-xs uppercase tracking-widest p-4 text-center">
                        {loadingImage ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-culinary-gold border-t-transparent rounded-full animate-spin"></div>
                                <span>Painting...</span>
                            </div>
                        ) : (
                            <span>Food Art</span>
                        )}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent md:bg-gradient-to-r pointer-events-none"></div>
            </div>

            <div className="p-6 md:w-3/5 flex flex-col justify-between">
                <div>
                    <h3 className="text-2xl font-serif text-culinary-cream mb-2 group-hover:text-culinary-gold transition-colors">{recipe.name}</h3>
                    <p className="text-gray-300 font-sans text-sm line-clamp-2 mb-4">{recipe.description}</p>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-400 font-sans uppercase tracking-widest border-t border-gray-600 pt-4">
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {recipe.prepTime}</span>
                    <span className="flex items-center"><BarChart2 className="w-3 h-3 mr-1" /> {recipe.difficulty}</span>
                </div>
            </div>
        </div>
    );
};
