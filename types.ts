export enum CuisineType {
  ITALIAN = 'Italian',
  JAPANESE = 'Japanese',
  MEXICAN = 'Mexican',
  INDIAN = 'Indian',
  FRENCH = 'French',
  THAI = 'Thai',
  VIETNAMESE = 'Vietnamese',
  FILIPINO = 'Filipino',
  AUSTRALIAN = 'Australian',
  AMERICAN = 'American',
  MEDITERRANEAN = 'Mediterranean'
}

export enum RecipeTag {
  SPICY = 'Spicy',
  FAST = 'Fast (<30m)',
  VEGETARIAN = 'Vegetarian',
  COMFORT = 'Comfort Food',
  DESSERT = 'Dessert',
  HEALTHY = 'Healthy'
}

export interface RecipeSummary {
  name: string;
  description: string;
  prepTime: string;
  difficulty: string;
  imageKeyword: string;
}

export interface RecipeDetail extends RecipeSummary {
  history: string;
  ingredients: string[];
  instructions: string[];
  chefTips: string;
  flavorProfile: string;
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
}

export type ImageSize = '1K' | '2K' | '4K';