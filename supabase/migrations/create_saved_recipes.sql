-- Create saved_recipes table for storing user recipes
CREATE TABLE IF NOT EXISTS saved_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_name TEXT NOT NULL,
    recipe_content TEXT NOT NULL,
    conversation_context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tags TEXT[],
    CONSTRAINT user_recipe UNIQUE (user_id, recipe_name)
);

-- Enable Row Level Security
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only see their own recipes
CREATE POLICY "Users can view own recipes"
    ON saved_recipes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own recipes
CREATE POLICY "Users can insert own recipes"
    ON saved_recipes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own recipes
CREATE POLICY "Users can update own recipes"
    ON saved_recipes
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own recipes
CREATE POLICY "Users can delete own recipes"
    ON saved_recipes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id ON saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_created_at ON saved_recipes(created_at DESC);
