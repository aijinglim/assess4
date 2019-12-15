export interface RecipeIngredient {
    order_details_id?: number;
    description: string;
    quantity : number
};

export interface RecipeReview {
    reviewerid: string;
    username: string;
    rating: number;
    comments: string
};

export interface Recipe {
    recipeName: string;
    prepTime: number;
    cookTime: number;
    description: string;
    serving :number;
    category: string[];
    ingredients: RecipeIngredient[];
    instructions: string[];
    username: string;
    submitted: Date;
    image_url: string
}