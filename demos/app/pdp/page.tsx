"use client";
import React from 'react';
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Shield, Zap, CreditCard, Lock, Check, ArrowRight, Sparkles, TrendingUp, Clock } from 'lucide-react';

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
  if (typeof document === 'undefined') return html;
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// Function to get a valid image URL
const getValidImageUrl = (images: string[] | undefined): string => {
  if (!images || images.length === 0) {
    return "/shirt.avif";
  }

  // Find the first non-empty, non-undefined image URL
  const validImage = images.find((img) => img && img.trim() !== "");
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-900"></div>
          <p className="mt-4 text-slate-600">Loading products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load products</p>
          <p className="text-slate-600 mb-8">{error instanceof Error ? error.message : "Unknown error"}</p>
          <Link
            href="/"
            className="inline-block bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition-colors"
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="relative bg-white rounded-xl p-1.5 sm:p-2 shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                <Image 
                  src="/avatar-black.png" 
                  alt="Accelerate Logo" 
                  width={40} 
                  height={40} 
                  className="w-7 h-7 sm:w-9 sm:h-9 object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent tracking-tight">Accelerate Store</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                Powered by Accelerate Checkout
              </span>
            </div>
          </div>
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        </div>
      </header>

      {/* Hero Section - Accelerate Checkout Feature */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                Lightning-Fast Checkout
              </div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Shop Smarter with<br/>
                Accelerate Checkout
              </h1>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                The most seamless checkout experience, recognizing over 85% of shoppers. No change to your payment stack and processor agnostic.
              </p>
              <div className="flex gap-4">
                <a href="https://weaccelerate.com" target="_blank" rel="noopener noreferrer"
                   className="px-6 py-3 bg-white text-slate-900 font-semibold rounded hover:bg-slate-100 transition-all inline-flex items-center gap-2">
                  Discover Accelerate
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/5 border border-white/10 rounded-lg p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">3x Faster Checkout</div>
                      <div className="text-sm text-slate-400">85% of US shoppers recognized</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">Bank-Level Security</div>
                      <div className="text-sm text-slate-400">256-bit encryption, PCI compliant, SOC II</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">Smart Autofill</div>
                      <div className="text-sm text-slate-400">Auto-fill payment & shipping info</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Bar */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <Clock className="w-6 h-6 text-slate-700 mb-2" />
              <div className="font-semibold text-slate-900 text-sm">Quick and Simple Integration</div>
              <div className="text-xs text-slate-600">Lightning fast</div>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="w-6 h-6 text-slate-700 mb-2" />
              <div className="font-semibold text-slate-900 text-sm">100% Secure</div>
              <div className="text-xs text-slate-600">Protected payments</div>
            </div>
            <div className="flex flex-col items-center">
              <CreditCard className="w-6 h-6 text-slate-700 mb-2" />
              <div className="font-semibold text-slate-900 text-sm">Payment Processor Agnostic</div>
              <div className="text-xs text-slate-600">Cards, digital wallets</div>
            </div>
            <div className="flex flex-col items-center">
              <TrendingUp className="w-6 h-6 text-slate-700 mb-2" />
              <div className="font-semibold text-slate-900 text-sm">85% Shopper Recognition</div>
              <div className="text-xs text-slate-600">Proven reliability</div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Shop Our Collection</h2>
          <p className="text-xl text-slate-600">Experience instant checkout with every purchase</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => {
            // Hardcode price to $0.99 for all products
            const price = "0.99";

            // Get a valid image URL
            const productImage = getValidImageUrl(product.images);

            // Strip HTML tags for display
            const plainTitle = stripHtmlTags(product.title);
            const plainDescription = stripHtmlTags(
              product.description || "Premium quality product with excellent craftsmanship."
            );

            return (
              <Link
                key={product.id}
                href={`/pdp/${product.id}`}
                className="group bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all flex flex-col"
              >
                <div className="aspect-square relative overflow-hidden bg-slate-200">
                  <Image
                    src={productImage}
                    alt={plainTitle}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700">
                    ⚡ Accelerate Ready
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{plainTitle}</h3>
                      <p className="text-sm text-slate-600 line-clamp-2">{plainDescription}</p>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">${price}</div>
                  </div>
                  
                  <button
                    className="w-full h-12 bg-slate-900 text-white text-sm font-semibold rounded hover:bg-slate-800 transition-all flex items-center justify-center mt-auto"
                  >
                    Checkout with Accelerate
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How Accelerate Checkout Works</h2>
            <p className="text-lg text-slate-600">Three simple steps to complete your purchase</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-slate-900">1</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Identify Shoppers</h3>
              <p className="text-slate-600">No prior use or account creation necessary</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-slate-900">2</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Swift and Secure Auth</h3>
              <p className="text-slate-600">Verify shoppers with a 2fa security code</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-slate-900">3</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Prefill Shipping and Payment</h3>
              <p className="text-slate-600">Shoppers are presented with their available payment methods for checkout in one click</p>
            </div>
          </div>
        </div>
      </div>

      {/* Accelerate CTA Section */}
      <div className="bg-slate-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <Zap className="w-16 h-16 mx-auto mb-6 text-slate-300" />
          <h2 className="text-4xl font-bold mb-6">Ready to Accelerate Your Business?</h2>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Join thousands of merchants who've increased their conversion rates with Accelerate Checkout. 
            Fast, secure, and loved by customers.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="https://weaccelerate.com" target="_blank" rel="noopener noreferrer"
               className="px-8 py-4 bg-white text-slate-900 font-semibold rounded hover:bg-slate-100 transition-all inline-flex items-center gap-2 text-lg">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-slate-400" />
              No setup fees
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-slate-400" />
              Quick integration
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl blur-sm opacity-60"></div>
                  <div className="relative bg-white rounded-xl p-1.5 shadow-md">
                    <Image 
                      src="/avatar-black.png" 
                      alt="Accelerate Logo" 
                      width={40} 
                      height={40} 
                      className="w-9 h-9 object-contain"
                    />
                  </div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent tracking-tight">Accelerate</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Experience the future of online shopping with Accelerate Checkout. 
                Fast, secure, and effortless purchasing.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">All Products</a></li>
                <li><a href="#" className="hover:text-white transition-colors">New Arrivals</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Best Sellers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Accelerate</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="https://weaccelerate.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">About Accelerate</a></li>
                <li><a href="https://weaccelerate.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">For Merchants</a></li>
                <li><a href="https://weaccelerate.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>© 2026 Accelerate Store. Powered by <a href="https://weaccelerate.com" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white">Accelerate Checkout</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
