import { supabase } from './supabaseClient';

export interface SavedRecipe {
    id: string;
    user_id: string;
    recipe_name: string;
    recipe_content: string;
    conversation_context?: string;
    created_at: string;
    tags?: string[];
}

export interface SaveRecipeInput {
    recipe_name: string;
    recipe_content: string;
    conversation_context?: string;
    tags?: string[];
}

/**
 * Save a new recipe for the current user
 */
export async function saveRecipe(input: SaveRecipeInput): Promise<{ data: SavedRecipe | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
        .from('saved_recipes')
        .insert([{
            user_id: user.id,
            ...input
        }])
        .select()
        .single();

    return { data, error };
}

/**
 * Get all recipes for the current user
 */
export async function getRecipes(filters?: { search?: string; tags?: string[] }): Promise<{ data: SavedRecipe[] | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
    }

    let query = supabase
        .from('saved_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    // Apply search filter
    if (filters?.search) {
        query = query.or(`recipe_name.ilike.%${filters.search}%,recipe_content.ilike.%${filters.search}%`);
    }

    // Apply tag filter
    if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query;

    return { data, error };
}

/**
 * Get a single recipe by ID
 */
export async function getRecipe(recipeId: string): Promise<{ data: SavedRecipe | null; error: any }> {
    const { data, error } = await supabase
        .from('saved_recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

    return { data, error };
}

/**
 * Update a recipe
 */
export async function updateRecipe(recipeId: string, updates: Partial<SaveRecipeInput>): Promise<{ data: SavedRecipe | null; error: any }> {
    const { data, error } = await supabase
        .from('saved_recipes')
        .update(updates)
        .eq('id', recipeId)
        .select()
        .single();

    return { data, error };
}

/**
 * Delete a recipe
 */
export async function deleteRecipe(recipeId: string): Promise<{ error: any }> {
    const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('id', recipeId);

    return { error };
}
