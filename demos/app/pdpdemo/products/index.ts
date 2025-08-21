import { Product } from './types';
import { tote } from './tote';
import { tshirt } from './tshirt';
import { mug } from './mug';

export const products: Product[] = [
  tote,
  tshirt,
  mug
];

export { tote, tshirt, mug };

// Utility function to find product by ID
export const getProductById = (id: string): Product | undefined => {
  return products.find(product => product.id === id);
};

// Utility function to get product by ID with fallback
export const getProductByIdWithFallback = (id: string): Product => {
  return getProductById(id) || tote; // Default to tote if not found
};
