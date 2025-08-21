export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  images?: string[]; // Array of additional product images
  category: string;
  features: string[];
}
