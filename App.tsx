import React, { useState, useEffect } from 'react';
import Background from './components/Background';
import Loader from './components/Loader';
import LiveChefAssistant from './components/LiveChefAssistant';
import ImageWithLoader from './components/ImageWithLoader';
import { AuthModal } from './components/AuthModal';
import { SavedRecipes } from './components/SavedRecipes';
import { RecipeCard } from './components/RecipeCard';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './services/supabaseClient';
import { CuisineType, RecipeTag, RecipeSummary, RecipeDetail, GenerationState, ImageSize, DietaryRequirement } from './types';
import { generateRecipeList, generateRecipeDetail, generateImage } from './services/geminiService';
import { ChevronRight, ArrowLeft, Clock, BarChart2, ChefHat, BookOpen, Flame, Globe, Camera, Image as ImageIcon, Settings, Wand2, Search, Plus, User, Heart, LogOut, Wheat, Check } from 'lucide-react';
import { Footer } from './components/Footer';
import { ReviewsSection } from './components/ReviewsSection';
import { DebugAuth } from './components/DebugAuth';


enum ViewState {
  HOME,
  RECIPE_LIST,
  RECIPE_DETAIL,
  PROFILE
}

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.HOME);

  // Selection State
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType | null>(null);
  const [selectedTag, setSelectedTag] = useState<RecipeTag | null>(null);
  const [selectedDietary, setSelectedDietary] = useState<DietaryRequirement[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRecipeSummary, setSelectedRecipeSummary] = useState<RecipeSummary | null>(null);

  // Data State
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [recipeDetail, setRecipeDetail] = useState<RecipeDetail | null>(null);

  // Image Generation State
  // Image Generation State
  const [ingredientImages, setIngredientImages] = useState<Record<number, string>>({});
  const [isGeneratingIngredient, setIsGeneratingIngredient] = useState<number | null>(null);
  const [generatedInfographic, setGeneratedInfographic] = useState<string | null>(null);
  const [isGeneratingInfographic, setIsGeneratingInfographic] = useState<boolean>(false);

  // UI State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Auth Hook
  const { user, signOut } = useAuth();

  // Helper to generate consistent food images based on recipe name (Fallback)
  const getDishImageUrl = (name: string, cuisine: string | null, width: number, height: number) => {
    const prompt = `professional food photography of ${name} ${cuisine || ''} dish, cinematic lighting, appetizing, michelin star presentation`;
    const encodedPrompt = encodeURIComponent(prompt);
    // Create a deterministic seed from the string to ensure the image doesn't change on re-renders
    const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;
  };

  // Helper to ensure API Key is selected for Pro models
  const ensureApiKey = async () => {
    // Cast to any to handle cases where standard types might conflict or be incomplete
    const aiStudio = (window as any).aistudio;
    if (aiStudio) {
      const hasKey = await aiStudio.hasSelectedApiKey();
      if (!hasKey) {
        await aiStudio.openSelectKey();
        // Double check after modal closes (though race condition exists, we assume user complied)
        return await aiStudio.hasSelectedApiKey();
      }
      return true;
    }
    return true; // Fallback for dev environments if aistudio isn't injected
  };



  const handleGenerateIngredientImage = async (ingredient: string, index: number) => {
    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) return;

      setIsGeneratingIngredient(index);
      const prompt = `Macro food photography close up of raw ${ingredient}. Cinematic lighting, dark background, fresh quality ingredients. Detailed texture, 8k resolution, photorealistic.`;
      // We use the selected size for quality
      const imageSize: ImageSize = '1K';
      const base64Image = await generateImage(prompt, imageSize);
      setIngredientImages(prev => ({ ...prev, [index]: base64Image }));
    } catch (err) {
      console.error(err);
      // Fail silently for thumbnails or show small alert
    } finally {
      setIsGeneratingIngredient(null);
    }
  };

  const handleGenerateInfographic = async () => {
    if (!recipeDetail) return;

    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) return;

      setIsGeneratingInfographic(true);
      const prompt = `A vertical visual infographic guide for cooking ${recipeDetail.name}.
                  Step-by-step visual instructions.
                  Elegant typography, dark culinary theme, gold accents.
                  Show key stages: Preparation, Cooking, Plating.
                  High resolution, professional graphic design.`;

      const base64Image = await generateImage(prompt, '1K', '9:16'); // Vertical aspect ratio
      setGeneratedInfographic(base64Image);
    } catch (err) {
      console.error(err);
      setError("Failed to generate visual guide.");
    } finally {
      setIsGeneratingInfographic(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!recipeDetail) return;

    try {
      const { error } = await supabase.from('saved_recipes').insert({
        user_id: user.id,
        recipe_data: recipeDetail
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

  // Handlers
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setView(ViewState.RECIPE_LIST);
    setRecipes([]); // Clear previous results
    setSelectedCuisine(null); // Clear specific cuisine if searching globally
    setSelectedTag(null);

    try {
      const result = await generateRecipeList(null, null, selectedDietary, searchQuery);
      setRecipes(result);
    } catch (err) {
      setError("The AI Chef is busy. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSearch = async (tag: RecipeTag) => {
    if (!selectedCuisine) return;

    setSelectedTag(tag);
    setSearchQuery(""); // Clear search query
    setLoading(true);
    setError(null);
    setView(ViewState.RECIPE_LIST);

    try {
      const result = await generateRecipeList(selectedCuisine, tag, selectedDietary);
      setRecipes(result);
    } catch (err) {
      setError("The AI Chef is currently busy. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    setLoading(true);
    try {
      // Logic: if we have a search query, use that. Else use cuisine+tag.
      let newRecipes: RecipeSummary[] = [];
      if (searchQuery) {
        newRecipes = await generateRecipeList(null, null, searchQuery);
      } else if (selectedCuisine && selectedTag) {
        newRecipes = await generateRecipeList(selectedCuisine, selectedTag, selectedDietary);
      }

      // Filter out duplicates based on name
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

  const handleSelectRecipe = async (summary: RecipeSummary) => {
    setSelectedRecipeSummary(summary);
    setLoading(true);
    setError(null);

    // Reset valid image states
    setIngredientImages({});
    setGeneratedInfographic(null);

    try {
      const detail = await generateRecipeDetail(summary.name, selectedCuisine, selectedDietary);
      setRecipeDetail(detail);
      // Only switch view if data retrieval is successful
      setView(ViewState.RECIPE_DETAIL);
    } catch (err) {
      setError("Failed to retrieve the secret recipe. The AI Chef might be busy.");
      console.error(err);
      // Stay on current view so user sees the error
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError(null);
    if (view === ViewState.RECIPE_DETAIL) {
      setView(ViewState.RECIPE_LIST);
      setRecipeDetail(null);
    } else if (view === ViewState.RECIPE_LIST) {
      setView(ViewState.HOME);
      setRecipes([]);
      setSelectedTag(null);
    }
  };

  // --- RENDER HELPERS ---

  const renderHome = () => (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-serif text-culinary-gold mb-4 text-shadow tracking-tight">
          Lumière Culinary
        </h1>
        <p className="text-xl text-white font-sans tracking-widest uppercase opacity-90 drop-shadow-md">
          AI-Powered Recipes
        </p>
      </header>

      {/* Search Section */}
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

      {/* Step 1: Cuisine Selection */}

      {/* Step 1: Cuisine Selection */}
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



      {/* Step 2: Dietary Preferences (Optional) */}
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

      {/* Step 3: Tag Selection (Only visible if cuisine selected) */}
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

      {/* Reviews Section */}
      <ReviewsSection />
    </div >
  );

  const renderRecipeList = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8 border-b border-gray-600/50 pb-4 bg-black/60 p-4 rounded-t-sm backdrop-blur-md">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-300 hover:text-culinary-gold transition-colors uppercase tracking-widest text-sm font-sans"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Regions
        </button>
        <div className="text-right">
          <h2 className="text-3xl font-serif text-culinary-cream">
            {searchQuery ? `Results for "${searchQuery}"` : `${selectedCuisine} Cuisine`}
          </h2>
          <p className="text-culinary-gold font-sans text-sm uppercase tracking-wider">
            {searchQuery ? 'Custom Search' : selectedTag}
          </p>
        </div>
      </div>

      {loading ? (
        <Loader message="Curating Menu..." />
      ) : error ? (
        <div className="text-center text-red-400 py-10 font-serif text-xl bg-black/60 rounded-lg backdrop-blur-sm">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {recipes.map((recipe, idx) => (
            <RecipeCard
              key={idx}
              recipe={recipe}
              selectedCuisine={selectedCuisine}
              onClick={handleSelectRecipe}
            />
          ))}
        </div>
      )}

      {!loading && recipes.length > 0 && (
        <div className="mt-12 text-center">
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
  );

  const renderRecipeDetail = () => {
    if (loading) return (
      <div className="h-screen flex items-center justify-center">
        <Loader message="Deconstructing Recipe..." />
      </div>
    );

    if (!recipeDetail) return null;

    return (
      <div className="max-w-5xl mx-auto bg-culinary-dark/95 min-h-screen shadow-2xl relative border-x border-gray-800">

        {/* Inject Live Chef Assistant here so it has access to the detail context */}
        <LiveChefAssistant recipe={recipeDetail} />

        {/* Detail Header Image */}
        <div className="h-[50vh] w-full relative overflow-hidden group">
          <ImageWithLoader
            src={getDishImageUrl(recipeDetail.name, selectedCuisine, 1200, 800)}
            alt={recipeDetail.name}
            className="w-full h-full object-cover transition-all duration-1000"
            containerClassName="w-full h-full"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-culinary-dark via-culinary-dark/40 to-transparent"></div>



          <button
            onClick={handleBack}
            className="absolute top-6 left-6 z-20 flex items-center text-white/90 hover:text-culinary-gold transition-colors bg-black/50 p-2 rounded-full backdrop-blur-md border border-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full flex items-end justify-between">
            <div>
              <span className="text-culinary-gold uppercase tracking-[0.2em] text-sm font-bold mb-2 block drop-shadow-md">{recipeDetail.difficulty} • {recipeDetail.prepTime}</span>
              <h1 className="text-4xl md:text-6xl font-serif text-culinary-cream mb-4 drop-shadow-lg">{recipeDetail.name}</h1>
              <p className="text-gray-200 italic font-serif text-lg max-w-2xl drop-shadow-md">{recipeDetail.flavorProfile}</p>
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
          {/* Left Column: Story & Ingredients */}
          <div className="lg:col-span-1 space-y-12">

            {/* History Section */}
            <section>
              <h3 className="text-xl font-serif text-culinary-gold mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" /> The Story
              </h3>
              <p className="text-gray-300 font-sans leading-relaxed text-sm text-justify">
                {recipeDetail.history}
              </p>
            </section>

            {/* Ingredients Section */}
            <section className="bg-white/5 p-6 rounded-sm border border-white/10 shadow-inner">
              <div className="flex items-center justify-between mb-6 border-b border-gray-600 pb-2">
                <h3 className="text-xl font-serif text-culinary-cream">Mise en Place</h3>
              </div>

              <ul className="space-y-6">
                {recipeDetail.ingredients.map((ing, i) => (
                  <li key={i} className="group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start text-gray-200 font-sans text-sm flex-1">
                        <span className="w-1.5 h-1.5 bg-culinary-gold rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                        <span className="leading-relaxed">{ing}</span>
                      </div>

                      {/* Ingredient Thumbnail Generator */}
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

                    {/* Render generated ingredient image if exists */}
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

          {/* Right Column: Instructions & Tips */}
          <div className="lg:col-span-2 space-y-12">

            {/* Chef's Tips */}
            <div className="bg-culinary-gold/10 border-l-4 border-culinary-gold p-6 rounded-r-sm">
              <h4 className="text-culinary-gold font-bold uppercase tracking-widest text-xs mb-2 flex items-center">
                <ChefHat className="w-4 h-4 mr-2" /> Chef's Secret
              </h4>
              <p className="text-culinary-cream font-serif italic text-lg">
                "{recipeDetail.chefTips}"
              </p>
            </div>

            {/* Infographic Generator */}
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

            {/* Render Infographic */}
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

            {/* Instructions */}
            <section>
              <h3 className="text-3xl font-serif text-culinary-cream mb-8">Preparation</h3>
              <div className="space-y-8">
                {recipeDetail.instructions.map((step, i) => (
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

  return (
    <div className="relative min-h-screen text-gray-200 selection:bg-culinary-gold selection:text-black">
      <DebugAuth />
      {/* Background sits at z-0 */}
      <Background />

      {/* Content sits at z-10 */}
      <div className="relative z-10">

        {/* Global Header / Nav */}
        <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView(ViewState.PROFILE)}
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

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />

        {view === ViewState.HOME && renderHome()}
        {view === ViewState.RECIPE_LIST && renderRecipeList()}
        {view === ViewState.RECIPE_DETAIL && renderRecipeDetail()}
        {view === ViewState.PROFILE && (
          <div className="relative">
            <button
              onClick={() => setView(ViewState.HOME)}
              className="absolute top-6 left-6 z-20 flex items-center text-gray-300 hover:text-culinary-gold transition-colors uppercase tracking-widest text-sm font-sans"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </button>
            <SavedRecipes onSelectRecipe={(recipe) => {
              setRecipeDetail(recipe);
              setView(ViewState.RECIPE_DETAIL);
            }} />
          </div>
        )}
        <Footer />
      </div>
    </div>
  );
};

export default App;
