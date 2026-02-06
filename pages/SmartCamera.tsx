import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, ChefHat, ArrowRight, Loader } from 'lucide-react';
import { generateRecipeFromImage } from '../services/geminiService';
import { RecipeSummary } from '../types';

export const SmartCamera: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<RecipeSummary | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setResult(null);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!imagePreview) return;

        setAnalyzing(true);
        setError(null);

        try {
            const analysis = await generateRecipeFromImage(imagePreview);
            setResult(analysis);
        } catch (err) {
            console.error(err);
            setError("Failed to analyze image. Please try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCreateRecipe = () => {
        if (result) {
            // Navigate to detail view, passing the summary state
            navigate('/recipe/preview', { state: { recipe: result } });
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pt-24 px-4 pb-12">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-serif text-culinary-gold mb-4">Smart Chef Camera</h1>
                    <p className="text-gray-400 font-sans">
                        Take a photo of ingredients or a dish, and let our AI Chef create a recipe.
                    </p>
                </div>

                {/* Image Input Area */}
                <div className="bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-xl p-8 mb-8 text-center relative overflow-hidden group">
                    {imagePreview ? (
                        <div className="relative">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-64 object-cover rounded-lg shadow-lg mx-auto"
                            />
                            <button
                                onClick={() => {
                                    setImagePreview(null);
                                    setResult(null);
                                }}
                                className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-red-500/80 transition-colors"
                            >
                                <span className="sr-only">Remove</span>
                                ✕
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 py-8">
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all border border-gray-600 hover:border-culinary-gold group-hover:scale-105 duration-300"
                                >
                                    <Camera className="w-10 h-10 text-culinary-gold mb-2" />
                                    <span className="text-sm font-sans uppercase tracking-widest">Take Photo</span>
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all border border-gray-600 hover:border-culinary-gold group-hover:scale-105 duration-300"
                                >
                                    <Upload className="w-10 h-10 text-culinary-gold mb-2" />
                                    <span className="text-sm font-sans uppercase tracking-widest">Upload Image</span>
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-4">JPG, PNG supported</p>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                    />
                </div>

                {/* Action Button */}
                {imagePreview && !result && (
                    <div className="text-center">
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="bg-culinary-gold text-black px-8 py-3 rounded-full font-bold font-sans tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                        >
                            {analyzing ? (
                                <>
                                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                                    ANALYZING...
                                </>
                            ) : (
                                <>
                                    <ChefHat className="w-5 h-5 mr-2" />
                                    ANALYZE INGREDIENTS
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-6 p-4 bg-red-900/20 border border-red-500/50 text-red-200 rounded text-center font-sans text-sm">
                        {error}
                    </div>
                )}

                {/* Result Card */}
                {result && (
                    <div className="mt-8 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden animate-fade-in">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-culinary-gold text-xs font-sans uppercase tracking-widest">Analysis Complete</span>
                                <div className="flex items-center space-x-3 text-xs text-gray-400">
                                    <span>{result.prepTime}</span>
                                    <span>•</span>
                                    <span>{result.difficulty}</span>
                                </div>
                            </div>

                            <h2 className="text-3xl font-serif text-white mb-3">{result.name}</h2>
                            <p className="text-gray-300 font-sans leading-relaxed mb-6">{result.description}</p>

                            <button
                                onClick={handleCreateRecipe}
                                className="w-full bg-culinary-gold text-black py-4 font-bold font-sans tracking-widest hover:bg-yellow-400 transition-all flex items-center justify-center group"
                            >
                                GENERATE FULL RECIPE
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <p className="text-center text-xs text-gray-500 mt-3">
                                Proceed to get step-by-step instructions.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
