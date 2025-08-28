"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Types for Printify products
interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  blueprint_id: number;
  shop_id: number;
  images: string[];
  variants: Array<{ id: number; price: number; is_enabled: boolean }>;
}

interface ProductsResponse {
  success: boolean;
  products: PrintifyProduct[];
  total: number;
}

// Function to strip HTML tags for plain text display
const stripHtmlTags = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// Function to get a valid image URL
const getValidImageUrl = (images: string[] | undefined): string => {
  if (!images || images.length === 0) {
    return "/shirt.avif";
  }
  
  // Find the first non-empty, non-undefined image URL
  const validImage = images.find(img => img && img.trim() !== "");
  return validImage || "/shirt.avif";
};

// Fetch function for products
const fetchProducts = async (): Promise<ProductsResponse> => {
  const response = await fetch("/api/pdp/list-products");

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
};

export default function ProductDetailsPage() {

  // Fetch products using useQuery
  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["printify-products"],
    queryFn: fetchProducts,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-700"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load products</p>
          <p className="text-gray-600 mb-8">{error instanceof Error ? error.message : "Unknown error"}</p>
          <Link 
            href="/" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Get all products from the API response
  const products = productsData?.products || [];

  return (
    <div className="flex overflow-hidden flex-col bg-white min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center py-5 w-full whitespace-nowrap border-b border-neutral-200">
        <div className="flex justify-between items-center mx-auto max-w-[1104px] w-full px-4">
          <div className="flex justify-between w-full items-center">
            <div className="flex gap-3 items-center">
              <span className="text-3xl font-black text-blue-500">
                <Image src="/baggslogo.svg" alt="Accelerate Swag Store Logo" width={30} height={30} />
              </span>
              <span className="text-2xl font-bold tracking-tighter text-stone-950">Accelerate Swag Store</span>
            </div>
            <Image src="/checkoutbag.svg" alt="Checkout Bag" width={30} height={30} className="h-6 w-6" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Product
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select from our featured products below to view detailed information and make a purchase.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => {
            // Hardcode price to $0.99 for all products
            const price = "0.99";
            
            // Get a valid image URL
            const productImage = getValidImageUrl(product.images);
            
            // Get first 3 tags or use default tags
            const productTags = product.tags?.slice(0, 3) || ["Premium", "Quality", "Design"];

            // Strip HTML tags for display in cards
            const plainTitle = stripHtmlTags(product.title);
            const plainDescription = stripHtmlTags(product.description || "Premium quality product with excellent craftsmanship.");

            return (
              <Link 
                key={product.id}
                href={`/pdp/${product.id}`}
                className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200"
              >
                {/* Product Image */}
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  <Image
                    src={productImage}
                    alt={plainTitle}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {plainTitle}
                    </h3>
                    <span className="text-xl font-bold text-blue-600">
                      ${price}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {plainDescription}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {productTags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* View Product Button */}
                  <div className="flex items-center justify-center">
                    <button className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors group-hover:bg-blue-700">
                      View Product
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Additional Info Section */}
        <div className="mt-16 text-center">
          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Need Help Choosing?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Product Information</h3>
                <p className="text-gray-600 text-sm">Click on any product to view detailed specifications and images</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Easy Checkout</h3>
                <p className="text-gray-600 text-sm">Use our Accelerate payment system for a seamless purchase experience</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Quality Guaranteed</h3>
                <p className="text-gray-600 text-sm">All products are made with premium materials and excellent craftsmanship</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
