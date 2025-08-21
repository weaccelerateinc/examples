import { Product } from './types';
import { tote } from './tote';
import { laptop } from './laptop';
import { mug } from './mug';

export const products: Product[] = [
  tote,
  laptop,
  mug
];

export { tote, laptop, mug };

// Utility function to find product by ID
export const getProductById = (id: string): Product | undefined => {
  return products.find(product => product.id === id);
};

// Utility function to get product by ID with fallback
export const getProductByIdWithFallback = (id: string): Product => {
  return getProductById(id) || tote; // Default to tote if not found
};
